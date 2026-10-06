import os
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.config import settings
from app.database import connect_to_mongo, check_db_health, db_manager
from app.logger import logger

router = APIRouter(prefix="/api", tags=["System"])

class MongoUriUpdate(BaseModel):
    mongodb_url: str

@router.get("/health")
async def health_check():
    """Health check endpoint showing MongoDB connection status"""
    return await check_db_health()

@router.post("/update-mongo-uri")
async def update_mongo_uri(payload: MongoUriUpdate):
    """Allows user to update and reconnect to MongoDB directly from UI"""
    new_uri = payload.mongodb_url.strip()
    if not new_uri:
        return JSONResponse(status_code=400, content={"message": "MongoDB URL cannot be empty."})

    settings.MONGODB_URL = new_uri
    logger.info("[CONFIG] Reconnecting MongoDB to new URI...")
    if db_manager.client:
        db_manager.client.close()

    await connect_to_mongo()
    health = await check_db_health()

    # Update .env file
    env_path = os.path.join(os.getcwd(), ".env")
    try:
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

        found = False
        new_lines = []
        for line in lines:
            if line.startswith("MONGODB_URL="):
                new_lines.append(f"MONGODB_URL={new_uri}\n")
                found = True
            else:
                new_lines.append(line)
        if not found:
            new_lines.append(f"MONGODB_URL={new_uri}\n")

        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        logger.success("[CONFIG] Updated .env file with new MONGODB_URL")
    except Exception as e:
        logger.warning(f"[CONFIG WARNING] Could not persist to .env: {e}")

    return {
        "message": "Reconnection attempted",
        "health": health
    }
