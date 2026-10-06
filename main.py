import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routes import students_router, system_router
from app.logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info(f"[STARTUP] Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"[SERVER] Dashboard URL: http://{settings.HOST}:{settings.PORT}")
    logger.info("=" * 60)
    await connect_to_mongo()
    yield
    logger.info("[SHUTDOWN] Stopping server...")
    await close_mongo_connection()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTP Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    client_host = request.client.host if request.client else "127.0.0.1"
    response = await call_next(request)
    duration = (time.time() - start_time) * 1000

    # Only log API / non-static requests
    if not request.url.path.startswith("/static"):
        status_code = response.status_code
        log_message = f"[HTTP {status_code}] {request.method} {request.url.path} ({duration:.1f}ms) [{client_host}]"
        if status_code < 400:
            logger.info(log_message)
        elif status_code < 500:
            logger.warning(log_message)
        else:
            logger.error(log_message)

    return response

# Register Application Routers
app.include_router(students_router)
app.include_router(system_router)

# Mount Static Files & Serve Single Page Application
os.makedirs("static/css", exist_ok=True)
os.makedirs("static/js", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def serve_index():
    """Serve the single-page student dashboard UI"""
    index_file = os.path.join("static", "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Student Management API is running. static/index.html not found."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
