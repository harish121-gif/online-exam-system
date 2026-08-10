from functools import wraps

from flask import session, jsonify
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
# CURRENT USER
# ============================================================

def get_current_user():
    """
    Return the currently logged-in user.
    """

    user_id = session.get("user_id")

    if not user_id:
        return None

    return {
        "id": user_id,
        "name": session.get("name"),
        "email": session.get("email"),
        "role": session.get("role", "student")
    }


# ============================================================
# LOGIN CHECK
# ============================================================

def is_logged_in():
    """
    Check whether a user is logged in.
    """

    return session.get("user_id") is not None


# ============================================================
# STUDENT REQUIRED DECORATOR
# ============================================================

def student_required(function):
    """
    Decorator that allows only logged-in students.
    """

    @wraps(function)
    def decorated_function(*args, **kwargs):

        if session.get("user_id") is None:
            return jsonify({
                "success": False,
                "message": "Login required."
            }), 401

        if session.get("role") != "student":
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

        if session.get("user_id") is None:
            return jsonify({
                "success": False,
                "message": "Login required."
            }), 401

        if session.get("role") != "admin":
            return jsonify({
                "success": False,
                "message": "Admin access required."
            }), 403

        return function(*args, **kwargs)

    return decorated_function