from functools import wraps
from flask import session, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(password):
    """
    Create a secure password hash.
    """
    return generate_password_hash(
        password,
        method="pbkdf2:sha256",
        salt_length=16
    )


def verify_password(password, password_hash):
    """
    Verify a plain password against the stored password hash.
    """
    if not password_hash:
        return False

    return check_password_hash(password_hash, password)


# ============================================================
# LOGIN SESSION
# ============================================================

def login_user(user):
    """
    Store logged-in user information in Flask session.
    """

    session.clear()

    session["user_id"] = user["id"]
    session["name"] = user["name"]
    session["email"] = user["email"]
    session["role"] = user.get("role", "student")

    session.permanent = True


# ============================================================
# LOGOUT
# ============================================================

def logout_user():
    """
    Remove current user session.
    """

    session.clear()


# ============================================================
# CURRENT USER HELPER FUNCTIONS
# ============================================================

def get_current_student_id():
    """
    Get current logged-in student ID from session or headers/request.
    """
    if "user_id" in session and session.get("role") == "student":
        try:
            return int(session["user_id"])
        except (ValueError, TypeError):
            pass

    user_id_hdr = request.headers.get("X-User-Id")
    user_role_hdr = request.headers.get("X-User-Role", "student")

    if user_id_hdr and (not user_role_hdr or str(user_role_hdr).lower() == "student"):
        try:
            return int(user_id_hdr)
        except (ValueError, TypeError):
            pass

    if request.is_json and request.get_json(silent=True):
        data = request.get_json(silent=True) or {}
        if "student_id" in data:
            try:
                return int(data["student_id"])
            except (ValueError, TypeError):
                pass

    return None


def get_current_admin_id():
    """
    Get current logged-in admin ID from session or headers.
    """
    if "user_id" in session and session.get("role") == "admin":
        return session["user_id"]

    user_id_hdr = request.headers.get("X-User-Id")
    user_role_hdr = request.headers.get("X-User-Role")

    if user_id_hdr and user_role_hdr and str(user_role_hdr).lower() == "admin":
        try:
            return int(user_id_hdr)
        except (ValueError, TypeError):
            pass

    return None


def get_current_user():
    """
    Return the currently logged-in user details.
    """
    user_id = session.get("user_id")
    role = session.get("role", "student")
    name = session.get("name")
    email = session.get("email")

    if not user_id:
        user_id_hdr = request.headers.get("X-User-Id")
        if user_id_hdr:
            try:
                user_id = int(user_id_hdr)
                role = request.headers.get("X-User-Role", "student")
                name = request.headers.get("X-User-Name", "Student")
                email = request.headers.get("X-User-Email", "")
            except (ValueError, TypeError):
                pass

    if not user_id:
        return None

    return {
        "id": user_id,
        "name": name,
        "email": email,
        "role": role
    }


# ============================================================
# LOGIN CHECK
# ============================================================

def is_logged_in():
    """
    Check whether a user is logged in.
    """
    return get_current_user() is not None


# ============================================================
# STUDENT REQUIRED DECORATOR
# ============================================================

def student_required(function):
    """
    Decorator that allows only logged-in students.
    """

    @wraps(function)
    def decorated_function(*args, **kwargs):
        user = get_current_user()

        if not user or not user.get("id"):
            return jsonify({
                "success": False,
                "message": "Login required."
            }), 401

        if user.get("role") != "student":
            return jsonify({
                "success": False,
                "message": "Student access required."
            }), 403

        return function(*args, **kwargs)

    return decorated_function


# ============================================================
# ADMIN REQUIRED DECORATOR
# ============================================================

def admin_required(function):
    """
    Decorator that allows only logged-in administrators.
    """

    @wraps(function)
    def decorated_function(*args, **kwargs):
        user = get_current_user()

        if not user or not user.get("id"):
            return jsonify({
                "success": False,
                "message": "Login required."
            }), 401

        if user.get("role") != "admin":
            return jsonify({
                "success": False,
                "message": "Admin access required."
            }), 403

        return function(*args, **kwargs)

    return decorated_function