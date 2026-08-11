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

    # ==========================================
    # FLASK CONFIGURATION
    # ==========================================

    app.config["SECRET_KEY"] = Config.SECRET_KEY

    # Session cookie configuration
    # Required because React frontend and
    # Render backend are on different domains.

    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "None"
    app.config["SESSION_COOKIE_SECURE"] = True

    # ==========================================
    # CORS CONFIGURATION
    # ==========================================

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

    # ==========================================
    # BLUEPRINTS
    # ==========================================

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(exam_bp)
    app.register_blueprint(question_bp)
    app.register_blueprint(question_import_bp)
    app.register_blueprint(attempt_bp)

    # ==========================================
    # HOME
    # ==========================================

    @app.route("/")
    def home():

        return jsonify({
            "success": True,
            "message": "Online Examination System API is running",
            "version": "Phase 1"
        })

    # ==========================================
    # HEALTH CHECK
    # ==========================================

    @app.route("/api/health")
    def health():

        return jsonify({
            "success": True,
            "message": "Backend and Flask server are working"
        })

    # ==========================================
    # DATABASE CONNECTION TEST
    # ==========================================

    @app.route("/api/db-test")
def db_test():

    connection = None

    try:

        connection = get_connection()

        with connection.cursor() as cursor:

            # Check which database is currently selected
            cursor.execute(
                "SELECT DATABASE() AS database_name"
            )

            database_result = cursor.fetchone()

            # Check available tables
            cursor.execute(
                "SHOW TABLES"
            )

            tables_result = cursor.fetchall()

        return jsonify({

            "success": True,

            "message": "Aiven MySQL connection successful",

            "database": database_result["database_name"],

            "tables": tables_result

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

    # ==========================================
    # SESSION TEST
    # ==========================================

    @app.route("/api/test-session")
    def test_session():

        return jsonify({

            "success": True,

            "logged_in":
                bool(session.get("user_id")),

            "user_id":
                session.get("user_id"),

            "role":
                session.get("role"),

            "name":
                session.get("name"),

            "email":
                session.get("email")

        })

    # ==========================================
    # RETURN APPLICATION
    # ==========================================

    return app


# ==============================================
# CREATE APPLICATION
# ==============================================

app = create_app()


# ==============================================
# RUN APPLICATION LOCALLY
# ==============================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )