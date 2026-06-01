"""
Core execution tracer using sys.settrace.
Captures a full snapshot after every statement executed.
"""

import sys
import ast
import copy
import io
import traceback
import builtins
from typing import Any, Dict, List, Optional


# Types that are safe to deep-copy and serialize
PRIMITIVE_TYPES = (int, float, str, bool, type(None))
MAX_COLLECTION_SIZE = 50
MAX_STRING_LEN = 300
MAX_STEPS = 500


class SafeRepr:
    """Converts Python values to JSON-serializable snapshot dicts."""

    def __init__(self):
        self._seen: set = set()

    def convert(self, value: Any, depth: int = 0) -> Any:
        if depth > 4:
            return {"type": "...", "value": "..."}

        if isinstance(value, PRIMITIVE_TYPES):
            if isinstance(value, str) and len(value) > MAX_STRING_LEN:
                return {"type": "str", "value": value[:MAX_STRING_LEN] + "…", "truncated": True}
            return {"type": type(value).__name__, "value": value}

        obj_id = id(value)

        if isinstance(value, list):
            if obj_id in self._seen:
                return {"type": "list", "id": obj_id, "circular": True}
            self._seen.add(obj_id)
            items = [self.convert(v, depth + 1) for v in value[:MAX_COLLECTION_SIZE]]
            truncated = len(value) > MAX_COLLECTION_SIZE
            self._seen.discard(obj_id)
            return {"type": "list", "id": obj_id, "items": items, "length": len(value), "truncated": truncated}

        if isinstance(value, tuple):
            items = [self.convert(v, depth + 1) for v in value[:MAX_COLLECTION_SIZE]]
            return {"type": "tuple", "id": obj_id, "items": items, "length": len(value)}

        if isinstance(value, dict):
            if obj_id in self._seen:
                return {"type": "dict", "id": obj_id, "circular": True}
            self._seen.add(obj_id)
            pairs = [
                {"key": self.convert(k, depth + 1), "value": self.convert(v, depth + 1)}
                for k, v in list(value.items())[:MAX_COLLECTION_SIZE]
            ]
            truncated = len(value) > MAX_COLLECTION_SIZE
            self._seen.discard(obj_id)
            return {"type": "dict", "id": obj_id, "pairs": pairs, "length": len(value), "truncated": truncated}

        if isinstance(value, set):
            items = [self.convert(v, depth + 1) for v in list(value)[:MAX_COLLECTION_SIZE]]
            return {"type": "set", "id": obj_id, "items": items, "length": len(value)}

        if callable(value) and not isinstance(value, type):
            name = getattr(value, "__name__", repr(value))
            return {"type": "function", "value": f"<function {name}>"}

        if isinstance(value, type):
            return {"type": "class", "value": f"<class {value.__name__}>"}

        # Generic object
        try:
            attrs = {
                k: self.convert(v, depth + 1)
                for k, v in list(vars(value).items())[:20]
                if not k.startswith("__")
            }
            return {"type": type(value).__name__, "id": obj_id, "attrs": attrs}
        except Exception:
            return {"type": type(value).__name__, "value": repr(value)[:200]}


# Variables that should never appear in snapshots
_HIDDEN_VARS = frozenset({
    "__name__", "__doc__", "__package__", "__loader__",
    "__spec__", "__builtins__", "__file__", "__cached__",
    "_stdout_capture", "_tracer_active",
})


class ExecutionTracer:
    def __init__(self, user_code: str):
        self.user_code = user_code
        self.snapshots: List[Dict] = []
        self._stdout_buf = io.StringIO()
        self._step = 0
        self._call_stack: List[Dict] = []
        self._active = False
        self._error: Optional[Dict] = None
        self._source_lines = user_code.splitlines()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(self) -> Dict:
        """Execute user code and return the full trace."""
        try:
            compiled = compile(self.user_code, "<user_code>", "exec")
        except SyntaxError as e:
            return {
                "success": False,
                "error": {"type": "SyntaxError", "message": str(e), "line": e.lineno},
                "snapshots": [],
            }

        global_ns = self._make_safe_globals()
        self._active = True

        old_stdout = sys.stdout
        sys.stdout = self._stdout_buf
        sys.settrace(self._trace_dispatch)

        try:
            exec(compiled, global_ns)  # noqa: S102
        except Exception as e:
            tb = traceback.extract_tb(sys.exc_info()[2])
            user_tb = [f for f in tb if f.filename == "<user_code>"]
            self._error = {
                "type": type(e).__name__,
                "message": str(e),
                "line": user_tb[-1].lineno if user_tb else None,
            }
            # Record the error as a final snapshot
            self._record_snapshot(
                line=self._error["line"],
                frame_locals={},
                event="exception",
                exception=self._error,
            )
        finally:
            sys.settrace(None)
            sys.stdout = old_stdout
            self._active = False

        return {
            "success": self._error is None,
            "error": self._error,
            "snapshots": self.snapshots,
            "total_steps": len(self.snapshots),
        }

    # ------------------------------------------------------------------
    # Tracer callbacks
    # ------------------------------------------------------------------

    def _trace_dispatch(self, frame, event, arg):
        if not self._active:
            return None

        filename = frame.f_code.co_filename
        if filename != "<user_code>":
            return None  # ignore stdlib frames

        if len(self.snapshots) >= MAX_STEPS:
            # Safety: stop tracing after too many steps
            self._active = False
            return None

        if event == "call":
            func_name = frame.f_code.co_name
            if func_name != "<module>":
                self._call_stack.append({
                    "function": func_name,
                    "line": frame.f_lineno,
                    "locals": {},  # populated on line events inside this frame
                })
            return self._trace_dispatch  # trace inside this frame

        if event == "line":
            self._record_snapshot(
                line=frame.f_lineno,
                frame_locals=frame.f_locals,
                event="line",
            )

        if event == "return":
            func_name = frame.f_code.co_name
            if func_name != "<module>":
                ret_repr = SafeRepr().convert(arg)
                # Update top-of-stack locals before popping
                if self._call_stack:
                    self._call_stack[-1]["locals"] = self._serialize_locals(frame.f_locals)
                self._record_snapshot(
                    line=frame.f_lineno,
                    frame_locals=frame.f_locals,
                    event="return",
                    return_value=ret_repr,
                )
                if self._call_stack:
                    self._call_stack.pop()

        if event == "exception":
            exc_type, exc_value, _ = arg
            self._record_snapshot(
                line=frame.f_lineno,
                frame_locals=frame.f_locals,
                event="exception",
                exception={"type": exc_type.__name__, "message": str(exc_value), "line": frame.f_lineno},
            )

        return self._trace_dispatch

    # ------------------------------------------------------------------
    # Snapshot helpers
    # ------------------------------------------------------------------

    def _record_snapshot(self, line, frame_locals, event, return_value=None, exception=None):
        self._step += 1

        # Update call stack locals for the current top frame
        if self._call_stack and event == "line":
            self._call_stack[-1]["locals"] = self._serialize_locals(frame_locals)
            self._call_stack[-1]["line"] = line

        stack_snapshot = [
            {
                "function": f["function"],
                "line": f["line"],
                "locals": f["locals"],
            }
            for f in self._call_stack
        ]

        # Global scope variables (module level)
        global_vars = (
            self._serialize_locals(frame_locals)
            if not self._call_stack
            else {}
        )

        snapshot = {
            "step": self._step,
            "line": line,
            "event": event,
            "source_line": self._get_source_line(line),
            "globals": global_vars,
            "stack": stack_snapshot,
            "stdout": self._stdout_buf.getvalue(),
        }

        if return_value is not None:
            snapshot["return_value"] = return_value
        if exception is not None:
            snapshot["exception"] = exception

        self.snapshots.append(snapshot)

    def _serialize_locals(self, locals_dict: dict) -> Dict[str, Any]:
        result = {}
        repr_engine = SafeRepr()
        for k, v in locals_dict.items():
            if k in _HIDDEN_VARS:
                continue
            if k.startswith("__"):
                continue
            try:
                result[k] = repr_engine.convert(v)
            except Exception:
                result[k] = {"type": "unknown", "value": "?"}
        return result

    def _get_source_line(self, lineno: int) -> str:
        if lineno and 1 <= lineno <= len(self._source_lines):
            return self._source_lines[lineno - 1].rstrip()
        return ""

    def _make_safe_globals(self) -> dict:
        """Restricted builtins — no open, exec, import, etc."""
        safe_builtins = {
            name: getattr(builtins, name)
            for name in [
                "abs", "all", "any", "bin", "bool", "chr", "dict", "dir",
                "divmod", "enumerate", "filter", "float", "format", "frozenset",
                "getattr", "hasattr", "hash", "hex", "int", "isinstance",
                "issubclass", "iter", "len", "list", "map", "max", "min",
                "next", "oct", "ord", "pow", "print", "range", "repr",
                "reversed", "round", "set", "setattr", "slice", "sorted",
                "str", "sum", "tuple", "type", "zip",
                "True", "False", "None",
                "Exception", "ValueError", "TypeError", "KeyError",
                "IndexError", "AttributeError", "RuntimeError",
                "StopIteration", "NotImplementedError", "ZeroDivisionError",
                "OverflowError", "RecursionError",
            ]
        }
        return {"__builtins__": safe_builtins}