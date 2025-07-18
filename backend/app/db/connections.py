from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from decouple import config
from fastapi import FastAPI
from contextlib import asynccontextmanager

class MongoDB:
    def __init__(self):
        self.mongo_uri = config('MONGO_URI', default="mongodb://localhost:27017/")
        self.db_name = config('MONGO_DB_NAME', default="mcq_generator_db")
        self.client = None
        self.db = None

    async def connect(self):
        """Establishes connection to MongoDB."""
        try:
            self.client = MongoClient(self.mongo_uri)
            # The ping command is cheap and does not require auth.
            # It will raise an exception if the connection fails.
            self.client.admin.command('ping')
            self.db = self.client[self.db_name]
            print(f"MongoDB connected successfully to database: {self.db_name}")
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

