import os
from dotenv import load_dotenv

load_dotenv()


class Config:

    # ==============================
    # DATABASE
    # ==============================

    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_NAME = os.getenv("DB_NAME", "online_exam_system")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")

    # ==============================
    # FLASK
    # ==============================

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "examsecure-development-secret-key-2026"
    )

    # ==============================
    # FRONTEND / CORS
    # ==============================

    CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "https://examsecure-frontend.onrender.com"
]
