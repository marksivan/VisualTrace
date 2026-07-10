from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import execution, health

app = FastAPI(
    title="VisualTrace API",
    description="Multi-language algorithm execution visualizer API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(execution.router, prefix="/api", tags=["execution"])
