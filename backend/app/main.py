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

# CORS настройки
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://wishlist-app.pages.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создание директории для загрузок
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Подключение статических файлов
try:
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except RuntimeError:
    pass  # Директория уже подключена

# Инициализация БД при запуске
@app.on_event("startup")
def on_startup():
    init_db()

# Подключение роутов
app.include_router(auth.router)
app.include_router(wishlists.router)
app.include_router(items.router)
app.include_router(url_parser.router)

@app.get("/")
def root():
    """Корневой эндпоинт"""
    return {
        "message": "Wishlist API",
        "docs": "/docs",
        "redoc": "/redoc",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    """Проверка здоровья сервиса"""
    return {"status": "healthy"}
