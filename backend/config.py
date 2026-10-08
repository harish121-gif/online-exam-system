import os
import re
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=env_path)
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
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "https://examsecure-frontend.onrender.com",
        "https://online-exam-secure.onrender.com",
        re.compile(r"https://.*\.onrender\.com"),
        re.compile(r"https://.*\.vercel\.app"),
        re.compile(r"https://.*\.netlify\.app"),
        re.compile(r"https://.*\.github\.io"),
        re.compile(r".*")
    ]

