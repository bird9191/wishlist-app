from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

from .database import init_db
from .routes import auth, wishlists, items, url_parser

load_dotenv()

app = FastAPI(
    title="Wishlist API",
    description="API для управления вишлистами (списками желаний)",
    version="1.0.0"
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://wishlist-app.pages.dev",
        "https://wishlist-app-production-5549.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

try:
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except RuntimeError:
    pass

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(auth.router)
app.include_router(wishlists.router)
app.include_router(items.router)
app.include_router(url_parser.router)

@app.get("/")
def root():
    return {
        "message": "Wishlist API",
        "docs": "/docs",
        "redoc": "/redoc",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
