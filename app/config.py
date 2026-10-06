import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "student_management_db")
    COLLECTION_NAME: str = os.getenv("COLLECTION_NAME", "students")
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    APP_NAME: str = "Student Management CRUD API"
    APP_VERSION: str = "1.0.0"

settings = Settings()
