"""
Sandbox service: runs user code inside a throwaway Docker container.

Each request:
  1. Writes user code to a temp file
  2. docker run with strict resource limits
  3. Reads JSON output from stdout
  4. Container auto-removed after exit
"""

import asyncio
import json
import os
import tempfile
import uuid
from typing import Dict

SANDBOX_IMAGE = os.getenv("SANDBOX_IMAGE", "pyvisualizer-sandbox:latest")
EXECUTION_TIMEOUT = int(os.getenv("EXECUTION_TIMEOUT", "10"))  # seconds
MEMORY_LIMIT = os.getenv("MEMORY_LIMIT", "64m")
CPU_QUOTA = os.getenv("CPU_QUOTA", "50000")   # 50% of 1 core (100000 = full core)
PIDS_LIMIT = int(os.getenv("PIDS_LIMIT", "32"))
SHARED_DIR = "/sandbox_files"

class SandboxError(Exception):
    pass


class SandboxTimeoutError(SandboxError):
    pass


async def execute_in_sandbox(code: str) -> Dict:
    """
    Execute Python code inside a Docker container and return the trace result.
    """
    run_id = uuid.uuid4().hex

    # Write code to a temp file that we'll volume-mount into the container
    os.makedirs(SHARED_DIR, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=SHARED_DIR, prefix=f"pyvis_{run_id}_") as tmpdir:
        code_path = os.path.join(tmpdir, "user_code.py")
        with open(code_path, "w") as f:
            f.write(code)

        cmd = [
            "docker", "run",
            "--rm",                          # auto-remove container
            "--name", f"pyvis-{run_id}",
            "--network", "none",             # no network
            "--memory", MEMORY_LIMIT,        # RAM cap
            "--memory-swap", MEMORY_LIMIT,   # no swap
            "--cpu-quota", CPU_QUOTA,
            "--pids-limit", str(PIDS_LIMIT), # prevent fork bombs
            "--read-only",                   # read-only filesystem
            "--tmpfs", "/tmp:size=16m",      # small writable tmp
            "--security-opt", "no-new-privileges",
            "-v", f"{code_path}:/code/user_code.py:ro",
            SANDBOX_IMAGE,
            "python", "/app/runner.py", "/code/user_code.py",
        ]

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            print("DOCKER CMD:", " ".join(cmd))
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=EXECUTION_TIMEOUT,
            )
        except asyncio.TimeoutError:
            # Kill the container forcefully
            await _kill_container(f"pyvis-{run_id}")
            raise SandboxTimeoutError(
                f"Execution exceeded {EXECUTION_TIMEOUT}s time limit."
            )
        except FileNotFoundError:
            raise SandboxError(
                "Docker is not available. Make sure Docker is installed and running."
            )

        if proc.returncode != 0 and not stdout:
            raise SandboxError(
                f"Sandbox container failed (exit {proc.returncode}): "
                f"{stderr.decode('utf-8', errors='replace')[:500]}"
            )

        try:
            result = json.loads(stdout.decode("utf-8"))
        except json.JSONDecodeError as e:
            raise SandboxError(
                f"Sandbox produced invalid JSON: {e}\n"
                f"stdout: {stdout[:200]}\nstderr: {stderr[:200]}"
            )
        
        try:
            os.remove(code_path)
            os.rmdir(tmpdir)
        except Exception:
            pass

        return result


async def _kill_container(name: str):
    try:
        proc = await asyncio.create_subprocess_exec(
            "docker", "kill", name,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
        )
        await asyncio.wait_for(proc.wait(), timeout=5)
    except Exception:
        pass  # best-effort