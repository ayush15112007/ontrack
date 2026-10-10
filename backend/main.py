from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.student import router as student_router
from app.db.database import create_tables

app = FastAPI(title="OnTrack API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    create_tables()

app.include_router(auth_router)
app.include_router(student_router)

@app.get("/")
def read_root():
    return {"message": "OnTrack Backend is Running"}
