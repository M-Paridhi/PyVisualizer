from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ExecuteRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=10_000, description="Python source code to execute")


class VariableValue(BaseModel):
    type: str
    value: Optional[Any] = None
    id: Optional[int] = None
    items: Optional[List[Any]] = None
    pairs: Optional[List[Any]] = None
    attrs: Optional[Dict[str, Any]] = None
    length: Optional[int] = None
    truncated: Optional[bool] = None
    circular: Optional[bool] = None


class StackFrame(BaseModel):
    function: str
    line: int
    locals: Dict[str, Any]


class ExecutionSnapshot(BaseModel):
    step: int
    line: Optional[int]
    event: str  # "line" | "return" | "exception"
    source_line: str
    globals: Dict[str, Any]
    stack: List[StackFrame]
    stdout: str
    return_value: Optional[Any] = None
    exception: Optional[Dict[str, Any]] = None


class ExecuteResponse(BaseModel):
    success: bool
    error: Optional[Dict[str, Any]] = None
    snapshots: List[Dict[str, Any]]
    total_steps: int