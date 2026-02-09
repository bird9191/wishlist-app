from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load .env только для локальной разработки
# В production (Railway) переменные приходят напрямую
load_dotenv()

# Railway передаёт DATABASE_URL через environment variables
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"🔍 DATABASE_URL loaded: {DATABASE_URL[:50] if DATABASE_URL else 'NOT SET'}...")
if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL environment variable is not set!")
    print(f"Available env vars: {list(os.environ.keys())[:10]}")
    raise ValueError("DATABASE_URL environment variable is not set!")

# SQLite требует check_same_thread=False для FastAPI
# PostgreSQL не требует дополнительных connect_args
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency для получения сессии БД"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Инициализация базы данных"""
    Base.metadata.create_all(bind=engine)
