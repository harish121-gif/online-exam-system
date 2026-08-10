from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
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

    # Allow browser to send Flask session cookie
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = False

    # ==========================================
    # CORS
    # ==========================================

    CORS(
        app,
        origins=Config.CORS_ORIGINS,
        supports_credentials=True
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
    # HEALTH
    # ==========================================

    @app.route("/api/health")
    def health():

        return jsonify({
            "success": True,
            "message": "Backend and Flask server are working"
        })

    return app


# ==============================================
# CREATE APPLICATION
# ==============================================

app = create_app()


# ==============================================
# RUN APPLICATION
# ==============================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )