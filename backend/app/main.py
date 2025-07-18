# D:\mcq-generator\backend\app\main.py

from dotenv import load_dotenv
load_dotenv() # Load environment variables from .env file
# --- FIX END ---

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.mongo import lifespan
from .api import routes_mcq, routes_quiz, routes_export, routes_documents
from bson import ObjectId

app = FastAPI(lifespan=lifespan,
              title="MCQ Generator API",
              description="A comprehensive API for generating, managing, and taking MCQs with AI integration.",
              version="0.1.0",
              docs_url="/docs",
              redoc_url="/redoc",
              json_encoders={ObjectId: str}
             )

# Configure CORS
# IMPORTANT: You will update "https://YOUR_NETLIFY_APP_URL.netlify.app"
# after your React app is deployed in Phase 3 of the deployment guide.
origins = [
    "http://localhost",
    "http://localhost:3000",
    # Add your deployed Netlify frontend URL here after it's deployed
    "https://YOUR_NETLIFY_APP_URL.netlify.app", # <--- Placeholder for your Netlify URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your routers
app.include_router(routes_mcq.router, prefix="/api/v1/mcq", tags=["MCQ Management & AI Generation"])
app.include_router(routes_quiz.router, prefix="/api/v1/quiz", tags=["Quiz Taking & Results"])
app.include_router(routes_documents.router, prefix="/api/v1/documents", tags=["Document Processing"])
app.include_router(routes_export.router, prefix="/api/v1/export", tags=["Export"])

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint to verify API is running."""
    return {"status": "ok", "message": "MCQ Generator API is running!"}