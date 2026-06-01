from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
import logging

from app.models.schemas import ExecuteRequest, ExecuteResponse
from app.services.sandbox import execute_in_sandbox, SandboxError, SandboxTimeoutError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["execution"])


@router.post("/execute", response_model=ExecuteResponse)
async def execute_code(request: ExecuteRequest, req: Request):
    logger.info("Execute request received, code length=%d", len(request.code))

    try:
        result = await execute_in_sandbox(request.code)
    except SandboxTimeoutError as e:
        raise HTTPException(status_code=408, detail=str(e))
    except SandboxError as e:
        logger.error("Sandbox error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error during execution")
        raise HTTPException(status_code=500, detail="Internal server error")

    return JSONResponse(content=result)


@router.get("/health")
async def health():
    return {"status": "ok"}