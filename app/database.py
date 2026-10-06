from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from app.config import settings
from app.logger import logger
import asyncio

class MongoDBManager:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None
    is_connected: bool = False
    last_error: str | None = None

db_manager = MongoDBManager()

async def connect_to_mongo():
    """Establish connection to MongoDB using Motor async client"""
    try:
        masked_url = settings.MONGODB_URL
        if "@" in masked_url:
            prefix = masked_url.split("@")[0].split("//")[0] + "//***:***@"
            suffix = masked_url.split("@")[1]
            masked_url = f"{prefix}{suffix}"
            
        logger.info(f"[DB CONNECT] Connecting to MongoDB: {masked_url}")
        db_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000
        )
        # Test connection with a ping
        await db_manager.client.admin.command('ping')
        db_manager.db = db_manager.client[settings.DATABASE_NAME]
        db_manager.is_connected = True
        db_manager.last_error = None
        logger.success(f"[DB READY] Successfully connected to MongoDB database: '{settings.DATABASE_NAME}'")
    except Exception as exc:
        db_manager.is_connected = False
        db_manager.last_error = str(exc)
        logger.warning(f"[DB WARNING] Could not connect to MongoDB: {exc}")
        logger.warning("[DB INFO] Please verify your MongoDB connection string in the '.env' file or via UI")

async def close_mongo_connection():
    """Close MongoDB connection gracefully"""
    if db_manager.client:
        logger.info("[DB DISCONNECT] Closing MongoDB connection...")
        db_manager.client.close()
        db_manager.is_connected = False
        logger.info("[DB CLOSED] MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase | None:
    return db_manager.db

def get_student_collection() -> AsyncIOMotorCollection | None:
    if db_manager.db is not None:
        return db_manager.db[settings.COLLECTION_NAME]
    return None

async def check_db_health() -> dict:
    """Check live status of the database connection"""
    if not db_manager.client:
        return {
            "connected": False,
            "database": settings.DATABASE_NAME,
            "error": "MongoDB client is not initialized. Please verify MONGODB_URL in .env"
        }
    try:
        await db_manager.client.admin.command('ping')
        db_manager.is_connected = True
        db_manager.last_error = None
        return {
            "connected": True,
            "database": settings.DATABASE_NAME,
            "collection": settings.COLLECTION_NAME,
            "error": None
        }
    except Exception as exc:
        db_manager.is_connected = False
        db_manager.last_error = str(exc)
        return {
            "connected": False,
            "database": settings.DATABASE_NAME,
            "error": str(exc)
        }
