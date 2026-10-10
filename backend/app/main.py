from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="OnTrack API",
    description="Smart Campus Analytics: Predict, Optimize and Improve Student Success",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "project": "OnTrack",
        "message": "OnTrack backend is running successfully!",
        "status": "online",
    }


@app.get("/api/health")
def health_check():
    return {
        "project": "OnTrack",
        "status": "healthy",
    }
