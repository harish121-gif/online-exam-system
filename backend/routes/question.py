from flask import Blueprint, jsonify, request, session
from models.db import get_connection

question_bp = Blueprint(
    "question",
    __name__,
    url_prefix="/api/exam"
)


# =====================================================
# GET QUESTIONS FOR AN EXAM
# =====================================================

@question_bp.route("/<int:exam_id>/questions", methods=["GET"])
def get_questions(exam_id):

    question_set = request.args.get("set", "A").upper()

    if question_set not in ["A", "B", "C", "D"]:
        return jsonify({
            "success": False,
            "message": "Invalid question set"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            # Check exam
            cursor.execute("""
                SELECT
                    id,
                    title,
                    total_questions,
                    duration_minutes,
                    is_active
                FROM exam
                WHERE id = %s
            """, (exam_id,))

            exam = cursor.fetchone()

            if not exam:
                return jsonify({
                    "success": False,
                    "message": "Exam not found"
                }), 404

            if not exam["is_active"]:
                return jsonify({
                    "success": False,
                    "message": "This examination is currently inactive"
                }), 403

            # Get questions
            cursor.execute("""
                SELECT
                    id,
                    exam_id,
                    question_set,
                    question_text,
                    option_a,
                    option_b,
                    option_c,
                    option_d,
                    category,
                    difficulty
                FROM question
                WHERE exam_id = %s
                AND question_set = %s
                ORDER BY id ASC
            """, (exam_id, question_set))

            questions = cursor.fetchall()

        if not questions:
            return jsonify({
                "success": False,
                "message": f"No questions available for Set {question_set}"
            }), 404

        return jsonify({
            "success": True,
            "exam": exam,
            "question_set": question_set,
            "questions": questions,
            "total_questions": len(questions)
        })

    finally:
        connection.close()