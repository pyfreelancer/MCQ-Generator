from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from fastapi import FastAPI
from contextlib import asynccontextmanager
from ..config import settings
from typing import Optional

class MongoDB:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None

    async def connect(self):
        """Establishes connection to MongoDB."""
        try:
            self.client = AsyncIOMotorClient(settings.MONGO_URI)
            # The ping command is cheap and does not require auth.
            # It will raise an exception if the connection fails.
            await self.client.admin.command('ping')
            self.db = self.client[settings.MONGO_DB_NAME]
            print(f"MongoDB connected successfully to database: {settings.MONGO_DB_NAME}")
        except ConnectionFailure as e:
            print(f"MongoDB connection failed: {e}")
            raise # Re-raise the exception to prevent the app from starting

    async def close(self):
        """Closes the MongoDB connection."""
        if self.client:
            self.client.close()
            print("MongoDB connection closed.")

mongo_db = MongoDB()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager for managing database connection.
    Connects to DB on startup and closes on shutdown.
    """
    await mongo_db.connect()
    yield # Application runs here
    await mongo_db.close()