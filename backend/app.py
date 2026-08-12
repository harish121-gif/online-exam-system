
import os

from flask import Flask, jsonify, session
from flask_cors import CORS

from config import Config
from models.db import get_connection

from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.exam import exam_bp
from routes.question import question_bp
from routes.question_import import question_import_bp
from routes.attempt import attempt_bp


def create_app():

    app = Flask(__name__)

    # ============================================================
    # FLASK CONFIGURATION
    # ============================================================

    app.config["SECRET_KEY"] = Config.SECRET_KEY

    is_production = (
        os.getenv("FLASK_ENV", "development").lower()
        == "production"
    )

    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["PERMANENT_SESSION_LIFETIME"] = 86400

    if is_production:
        # Render / HTTPS
        app.config["SESSION_COOKIE_SECURE"] = True
        app.config["SESSION_COOKIE_SAMESITE"] = "None"
    else:
        # Local / HTTP
        app.config["SESSION_COOKIE_SECURE"] = False
        app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    # ============================================================
    # CORS
    # ============================================================

    CORS(
        app,
        origins=Config.CORS_ORIGINS,
        supports_credentials=True,
        methods=[
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ],
        allow_headers=[
            "Content-Type",
            "Authorization"
        ]
    )

    # ============================================================
    # BLUEPRINTS
    # ============================================================

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(exam_bp)
    app.register_blueprint(question_bp)
    app.register_blueprint(question_import_bp)
    app.register_blueprint(attempt_bp)

    # ============================================================
    # HOME
    # ============================================================

    @app.route("/")
    def home():

        return jsonify({
            "success": True,
            "message": "Online Examination System API is running",
            "version": "Phase 1"
        })

    # ============================================================
    # HEALTH CHECK
    # ============================================================

    @app.route("/api/health")
    def health():

        return jsonify({
            "success": True,
            "message": "Backend and Flask server are working"
        })

    # ============================================================
    # SESSION TEST
    # ============================================================

    @app.route("/api/test-session")
    def test_session():

        return jsonify({
            "success": True,
            "logged_in": session.get("user_id") is not None,
            "user_id": session.get("user_id"),
            "name": session.get("name"),
            "email": session.get("email"),
            "role": session.get("role")
        })

    # ============================================================
    # DATABASE TEST
    # ============================================================

    @app.route("/api/db-test")
    def db_test():

        connection = None

        try:

            connection = get_connection()

            with connection.cursor() as cursor:

                cursor.execute(
                    "SELECT 1 AS test"
                )

                result = cursor.fetchone()

                cursor.execute(
                    "SELECT DATABASE() AS database_name"
                )

                database_result = cursor.fetchone()

            return jsonify({
                "success": True,
                "message": "MySQL connection successful",
                "database_test": result,
                "active_database": database_result
            })

        except Exception as error:

            print(
                "DATABASE TEST ERROR:",
                error
            )

            return jsonify({
                "success": False,
                "message": "Database connection failed",
                "error": str(error)
            }), 500

        finally:

            if connection:
                connection.close()

    # ============================================================
    # APPLICATION INFO
    # ============================================================

    @app.route("/api/info")
    def application_info():

        return jsonify({
            "success": True,
            "application": "AI-Based Online Examination Monitoring and Integrity System",
            "version": "Phase 1",
            "environment": (
                "production"
                if is_production
                else "development"
            ),
            "session_secure": app.config[
                "SESSION_COOKIE_SECURE"
            ],
            "session_samesite": app.config[
                "SESSION_COOKIE_SAMESITE"
            ]
        })

    return app


# ================================================================
# CREATE APPLICATION
# ================================================================

app = create_app()


# ================================================================
# RUN APPLICATION
# ================================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
