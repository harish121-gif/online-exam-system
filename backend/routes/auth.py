import os
import random
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from flask import Blueprint, jsonify, request, session
from models.db import get_connection

from services.auth_service import (
    hash_password,
    verify_password,
    get_current_user
)

# In-memory store for reset tokens: { email: { "code": "...", "expires_at": timestamp, "role": "..." } }
RESET_TOKENS = {}

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

    user = get_current_user()

    if not user or not user.get("id"):
        return jsonify({
            "success": False,
            "message": "Not logged in"
        }), 401

    return jsonify({
        "success": True,
        "user": user
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


# ============================================================
# FORGOT PASSWORD & RESET PASSWORD
# ============================================================

def send_email_reset_code(to_email, code, recipient_name="User"):
    """
    Attempts to send email via SMTP if configured.
    Returns True if email sent, False otherwise.
    """
    smtp_host = os.getenv("SMTP_HOST", os.getenv("MAIL_SERVER", "smtp.gmail.com"))
    smtp_port = int(os.getenv("SMTP_PORT", os.getenv("MAIL_PORT", "587")))
    smtp_user = os.getenv("SMTP_USER", os.getenv("MAIL_USERNAME", ""))
    smtp_pass = os.getenv("SMTP_PASSWORD", os.getenv("MAIL_PASSWORD", ""))
    sender_email = os.getenv("SENDER_EMAIL", smtp_user or "noreply@examsecure.com")

    if not smtp_user or not smtp_pass:
        print(f"[FORGOT PASSWORD] SMTP credentials not set. Code for {to_email}: {code}")
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = f"ExamSecure System <{sender_email}>"
        msg["To"] = to_email
        msg["Subject"] = "Your Password Reset Code - ExamSecure"

        body = f"""Hello {recipient_name},

You requested a password reset for your ExamSecure account.

Your Password Reset Verification Code is: {code}

This code is valid for 15 minutes. If you did not request a password reset, please ignore this email.

Best regards,
ExamSecure Team
"""
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        print(f"[FORGOT PASSWORD] Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"[FORGOT PASSWORD ERROR] Failed to send email to {to_email}: {e}")
        return False


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({
            "success": False,
            "message": "Registered email address is required"
        }), 400

    connection = get_connection()
    try:
        user_record = None
        role = "student"

        with connection.cursor() as cursor:
            # Search student table first
            cursor.execute("SELECT id, name, email FROM student WHERE email = %s LIMIT 1", (email,))
            user_record = cursor.fetchone()

            if not user_record:
                # Search admin table
                cursor.execute("SELECT id, name, email FROM admin WHERE email = %s LIMIT 1", (email,))
                user_record = cursor.fetchone()
                role = "admin"

        if not user_record:
            return jsonify({
                "success": False,
                "message": "No account found registered with this email address."
            }), 404

        code = str(random.randint(100000, 999999))
        expires_at = time.time() + 900  # 15 minutes

        RESET_TOKENS[email] = {
            "code": code,
            "expires_at": expires_at,
            "role": role,
            "user_id": user_record["id"]
        }

        recipient_name = user_record.get("name", "User")
        email_sent = send_email_reset_code(email, code, recipient_name)

        resp = {
            "success": True,
            "message": f"Verification reset code sent to your registered email ({email})!",
            "email": email,
            "email_sent": email_sent
        }

        if not email_sent:
            resp["verification_code"] = code
            resp["message"] += f" (Verification Code: {code})"

        return jsonify(resp), 200

    except Exception as error:
        print("FORGOT PASSWORD ERROR:", error)
        return jsonify({
            "success": False,
            "message": "Unable to process password reset request",
            "error": str(error)
        }), 500
    finally:
        connection.close()


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    code = data.get("code", "").strip()
    new_password = data.get("new_password", "")

    if not email or not code or not new_password:
        return jsonify({
            "success": False,
            "message": "Email, verification code, and new password are required"
        }), 400

    if len(new_password) < 6:
        return jsonify({
            "success": False,
            "message": "Password must be at least 6 characters long"
        }), 400

    token_info = RESET_TOKENS.get(email)

    if not token_info or time.time() > token_info["expires_at"]:
        return jsonify({
            "success": False,
            "message": "Expired or invalid reset code. Please request a new verification code."
        }), 400

    if token_info["code"] != code:
        return jsonify({
            "success": False,
            "message": "Invalid verification code. Please check your email and try again."
        }), 400

    password_hash = hash_password(new_password)
    role = token_info["role"]
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            if role == "student":
                cursor.execute(
                    "UPDATE student SET password_hash = %s WHERE email = %s",
                    (password_hash, email)
                )
            else:
                cursor.execute(
                    "UPDATE admin SET password_hash = %s WHERE email = %s",
                    (password_hash, email)
                )
            connection.commit()

        # Clear reset token
        RESET_TOKENS.pop(email, None)

        return jsonify({
            "success": True,
            "message": "Password reset successfully! You can now log in with your new password."
        }), 200

    except Exception as error:
        connection.rollback()
        print("RESET PASSWORD ERROR:", error)
        return jsonify({
            "success": False,
            "message": "Unable to reset password",
            "error": str(error)
        }), 500
    finally:
        connection.close()