"""
runner.py — executed INSIDE the sandbox container.

Usage: python runner.py /code/user_code.py

Reads the user code file, runs the tracer, and prints the JSON result to stdout.
The FastAPI backend reads this stdout to get the trace.
"""

import sys
import json
import os

# Add /app to path so we can import tracer
sys.path.insert(0, "/app")
from tracer import ExecutionTracer


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": {"type": "RunnerError", "message": "No code file provided"}, "snapshots": [], "total_steps": 0}))
        sys.exit(1)

    code_file = sys.argv[1]

    try:
        with open(code_file, "r") as f:
            code = f.read()
    except OSError as e:
        print(json.dumps({"success": False, "error": {"type": "RunnerError", "message": str(e)}, "snapshots": [], "total_steps": 0}))
        sys.exit(1)

    tracer = ExecutionTracer(code)
    result = tracer.run()

    # Write JSON to stdout — FastAPI backend reads this
    print(json.dumps(result))


if __name__ == "__main__":
    main()