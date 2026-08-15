import os

from flask import Flask, jsonify, session, send_from_directory
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

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

    app = Flask(
        __name__,
        static_folder=FRONTEND_DIST,
        static_url_path=""
    )

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
    @app.route("/api")
    def api_home():

        return jsonify({
            "success": True,
            "message": "Online Examination System API is running",
            "version": "Phase 1"
        })

    # ============================================================`r`n    # HEALTH CHECK`r`n    # ============================================================

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
    # TEMPORARY DEBUG STUDENT
    # ============================================================
    #
    # IMPORTANT:
    # This endpoint is ONLY for debugging the login problem.
    # It exposes the password hash.
    #
    # REMOVE THIS ENDPOINT AFTER TESTING.
    #
    # ============================================================

    @app.route("/api/debug-student")
    def debug_student():

        connection = None

        try:

            connection = get_connection()

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        name,
                        email,
                        phone,
                        password_hash
                    FROM student
                    WHERE email = %s
                    LIMIT 1
                    """,
                    ("harishpro14@gmail.com",)
                )

                student = cursor.fetchone()

            if not student:

                return jsonify({
                    "success": False,
                    "message": "Student not found"
                }), 404

            return jsonify({
                "success": True,
                "student": student
            })

        except Exception as error:

            print(
                "DEBUG STUDENT ERROR:",
                error
            )

            return jsonify({
                "success": False,
                "message": "Database error",
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
            "application": (
                "AI-Based Online Examination Monitoring "
                "and Integrity System"
            ),
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

    # ============================================================
    # TEMPORARY ROUTE DEBUG
    # ============================================================

    @app.route("/api/debug-routes")
    def debug_routes():

        routes = []

        for rule in app.url_map.iter_rules():

            routes.append({
                "path": str(rule),
                "methods": sorted(
                    list(rule.methods - {"HEAD", "OPTIONS"})
                )
            })

        return jsonify({
            "success": True,
            "routes": routes
        })

    # ============================================================
    # RETURN APP
    # ============================================================
    # ============================================================
    # REACT FRONTEND
    # ============================================================

    @app.route("/")
    def serve_frontend():
        return send_from_directory(FRONTEND_DIST, "index.html")

    @app.route("/<path:path>")
    def serve_react(path):
        file_path = os.path.join(FRONTEND_DIST, path)

        if os.path.isfile(file_path):
            return send_from_directory(FRONTEND_DIST, path)

        return send_from_directory(FRONTEND_DIST, "index.html")


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




