from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from app.api.execute import router as execute_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="PyVisualizer API",
    description="Step-by-step Python execution tracer",
    version="1.0.0",
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(execute_router)


@app.get("/")
async def root():
    return {"message": "PyVisualizer API", "docs": "/docs"}