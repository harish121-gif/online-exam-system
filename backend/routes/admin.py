from flask import Blueprint, request, jsonify

from models.db import get_connection
from services.auth_service import admin_required, hash_password


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


# ---------------------------------------
# Dashboard Statistics
# ---------------------------------------
@admin_bp.route("/dashboard", methods=["GET"])
@admin_required
def dashboard():

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("SELECT COUNT(*) AS total_students FROM student")
            students = cursor.fetchone()

            cursor.execute("SELECT COUNT(*) AS total_exams FROM exam")
            exams = cursor.fetchone()

            cursor.execute(
                "SELECT COUNT(*) AS active_exams FROM exam WHERE is_active = TRUE"
            )
            active_exams = cursor.fetchone()

            cursor.execute(
                "SELECT COUNT(*) AS total_attempts FROM exam_attempt"
            )
            attempts = cursor.fetchone()

        return jsonify({
            "success": True,
            "statistics": {
                "total_students": students["total_students"],
                "total_exams": exams["total_exams"],
                "active_exams": active_exams["active_exams"],
                "total_attempts": attempts["total_attempts"]
            }
        })

    finally:
        connection.close()


# ---------------------------------------
# Get All Students
# ---------------------------------------
@admin_bp.route("/students", methods=["GET"])
@admin_required
def get_students():

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    name,
                    email,
                    phone,
                    created_at
                FROM student
                ORDER BY id DESC
            """)

            students = cursor.fetchall()

        return jsonify({
            "success": True,
            "students": students
        })

    finally:
        connection.close()


# ---------------------------------------
# Get Single Student
# ---------------------------------------
@admin_bp.route("/students/<int:student_id>", methods=["GET"])
@admin_required
def get_student(student_id):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    name,
                    email,
                    phone,
                    created_at
                FROM student
                WHERE id = %s
            """, (student_id,))

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

    finally:
        connection.close()


# ---------------------------------------
# Add Student
# ---------------------------------------
@admin_bp.route("/students", methods=["POST"])
@admin_required
def add_student():

    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    phone = data.get("phone", "").strip()

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email and password are required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                "SELECT id FROM student WHERE email = %s",
                (email,)
            )

            existing = cursor.fetchone()

            if existing:
                return jsonify({
                    "success": False,
                    "message": "Student email already exists"
                }), 409

            password_hash = hash_password(password)

            cursor.execute("""
                INSERT INTO student
                (name, email, password_hash, phone)
                VALUES (%s, %s, %s, %s)
            """, (
                name,
                email,
                password_hash,
                phone
            ))

            student_id = cursor.lastrowid

        return jsonify({
            "success": True,
            "message": "Student created successfully",
            "student_id": student_id
        }), 201

    finally:
        connection.close()


# ---------------------------------------
# Update Student
# ---------------------------------------
@admin_bp.route("/students/<int:student_id>", methods=["PUT"])
@admin_required
def update_student(student_id):

    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()

    if not name or not email:
        return jsonify({
            "success": False,
            "message": "Name and email are required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                "SELECT id FROM student WHERE id = %s",
                (student_id,)
            )

            student = cursor.fetchone()

            if not student:
                return jsonify({
                    "success": False,
                    "message": "Student not found"
                }), 404

            cursor.execute("""
                SELECT id
                FROM student
                WHERE email = %s AND id != %s
            """, (email, student_id))

            duplicate = cursor.fetchone()

            if duplicate:
                return jsonify({
                    "success": False,
                    "message": "Email already belongs to another student"
                }), 409

            cursor.execute("""
                UPDATE student
                SET name = %s,
                    email = %s,
                    phone = %s
                WHERE id = %s
            """, (
                name,
                email,
                phone,
                student_id
            ))

        return jsonify({
            "success": True,
            "message": "Student updated successfully"
        })

    finally:
        connection.close()


# ---------------------------------------
# Delete Student
# ---------------------------------------
@admin_bp.route("/students/<int:student_id>", methods=["DELETE"])
@admin_required
def delete_student(student_id):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                "SELECT id FROM student WHERE id = %s",
                (student_id,)
            )

            student = cursor.fetchone()

            if not student:
                return jsonify({
                    "success": False,
                    "message": "Student not found"
                }), 404

            cursor.execute(
                "DELETE FROM student WHERE id = %s",
                (student_id,)
            )

        return jsonify({
            "success": True,
            "message": "Student deleted successfully"
        })

    finally:
        connection.close()