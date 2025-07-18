from decouple import config

class Settings:
    """Application settings loaded from environment variables."""
    MONGO_URI: str = config('MONGO_URI', default="mongodb://localhost:27017/")
    MONGO_DB_NAME: str = config('MONGO_DB_NAME', default="mcq_generator_db")
    GEMINI_API_KEY: str = config('GEMINI_API_KEY') # Load Google Gemini API Key

settings = Settings()

# Debug print to confirm API Key loading (first 5 and last 5 chars for security)
print(f"DEBUG: Gemini API Key loaded: {settings.GEMINI_API_KEY[:5]}...{settings.GEMINI_API_KEY[-5:]}")
