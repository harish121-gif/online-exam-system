from flask import Blueprint, jsonify, request, session
from models.db import get_connection

from services.auth_service import (
    hash_password,
    verify_password
)


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api"
)


# ============================================================
# STUDENT REGISTRATION
# ============================================================

@auth_bp.route("/student/register", methods=["POST"])
def student_register():

    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    phone = data.get("phone", "").strip()

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not name:
        return jsonify({
            "success": False,
            "message": "Name is required"
        }), 400

    if not email:
        return jsonify({
            "success": False,
            "message": "Email is required"
        }), 400

    if not password:
        return jsonify({
            "success": False,
            "message": "Password is required"
        }), 400

    if len(password) < 6:
        return jsonify({
            "success": False,
            "message": "Password must contain at least 6 characters"
        }), 400

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # CHECK DUPLICATE EMAIL
            # ------------------------------------------------

            cursor.execute(
                """
                SELECT id
                FROM student
                WHERE email = %s
                LIMIT 1
                """,
                (email,)
            )

            existing_student = cursor.fetchone()

            if existing_student:
                return jsonify({
                    "success": False,
                    "message": "Email is already registered"
                }), 409

            # ------------------------------------------------
            # HASH PASSWORD
            # ------------------------------------------------

            password_hash = hash_password(password)

            # ------------------------------------------------
            # CREATE STUDENT
            # ------------------------------------------------

            cursor.execute(
                """
                INSERT INTO student
                (
                    name,
                    email,
                    password_hash,
                    phone
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    name,
                    email,
                    password_hash,
                    phone if phone else None
                )
            )

            connection.commit()

            student_id = cursor.lastrowid

        return jsonify({
            "success": True,
            "message": "Student registration successful",
            "student": {
                "id": student_id,
                "name": name,
                "email": email,
                "phone": phone
            }
        }), 201

    except Exception as error:

        connection.rollback()

        print("STUDENT REGISTRATION ERROR:", error)

        return jsonify({
            "success": False,
            "message": "Unable to register student",
            "error": str(error)
        }), 500

    finally:

        connection.close()


# ============================================================
# STUDENT LOGIN
# ============================================================

@auth_bp.route("/student/login", methods=["POST"])
def student_login():

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not email or not password:

        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    name,
                    email,
                    password_hash,
                    phone
                FROM student
                WHERE email = %s
                LIMIT 1
                """,
                (email,)
            )

            student = cursor.fetchone()

        # ----------------------------------------------------
        # STUDENT NOT FOUND
        # ----------------------------------------------------

        if not student:

            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        # ----------------------------------------------------
        # VERIFY PASSWORD
        # ----------------------------------------------------

        if not verify_password(
            password,
            student["password_hash"]
        ):

            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        # ----------------------------------------------------
        # CREATE STUDENT SESSION
        # ----------------------------------------------------

        session.clear()

        session["user_id"] = student["id"]
        session["role"] = "student"
        session["name"] = student["name"]
        session["email"] = student["email"]

        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": student["id"],
                "name": student["name"],
                "email": student["email"],
                "phone": student["phone"],
                "role": "student"
            }
        })

    except Exception as error:

        print("STUDENT LOGIN ERROR:", error)

        return jsonify({
            "success": False,
            "message": "Unable to login",
            "error": str(error)
        }), 500

    finally:

        connection.close()


# ============================================================
# ADMIN LOGIN
# ============================================================

@auth_bp.route("/admin/login", methods=["POST"])
def admin_login():

    data = request.get_json() or {}

    username = data.get("username", "").strip()
    password = data.get("password", "")

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not username or not password:

        return jsonify({
            "success": False,
            "message": "Username and password are required"
        }), 400

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # FIND ADMIN
            # ------------------------------------------------

            cursor.execute(
                """
                SELECT
                    id,
                    username,
                    password_hash,
                    name,
                    email
                FROM admin
                WHERE username = %s
                LIMIT 1
                """,
                (username,)
            )

            admin = cursor.fetchone()

        # ----------------------------------------------------
        # ADMIN NOT FOUND
        # ----------------------------------------------------

        if not admin:

            return jsonify({
                "success": False,
                "message": "Invalid username or password"
            }), 401

        # ----------------------------------------------------
        # VERIFY ADMIN PASSWORD
        # ----------------------------------------------------

        if not verify_password(
            password,
            admin["password_hash"]
        ):

            return jsonify({
                "success": False,
                "message": "Invalid username or password"
            }), 401

        # ----------------------------------------------------
        # CREATE ADMIN SESSION
        # ----------------------------------------------------

        session.clear()

        session["user_id"] = admin["id"]
        session["role"] = "admin"
        session["name"] = admin["name"]
        session["email"] = admin["email"]
        session["username"] = admin["username"]

        # ----------------------------------------------------
        # SUCCESS
        # ----------------------------------------------------

        return jsonify({
            "success": True,
            "message": "Admin login successful",
            "user": {
                "id": admin["id"],
                "username": admin["username"],
                "name": admin["name"],
                "email": admin["email"],
                "role": "admin"
            }
        })

    except Exception as error:

        print("ADMIN LOGIN ERROR:", error)

        return jsonify({
            "success": False,
            "message": "Unable to login admin",
            "error": str(error)
        }), 500

    finally:

        connection.close()


# ============================================================
# CURRENT SESSION
# ============================================================

@auth_bp.route("/me", methods=["GET"])
def current_user():

    if "user_id" not in session:

        return jsonify({
            "success": False,
            "message": "Not logged in"
        }), 401

    return jsonify({
        "success": True,
        "user": {
            "id": session.get("user_id"),
            "name": session.get("name"),
            "email": session.get("email"),
            "username": session.get("username"),
            "role": session.get("role")
        }
    })


# ============================================================
# LOGOUT
# ============================================================

@auth_bp.route("/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "success": True,
        "message": "Logged out successfully"
    })