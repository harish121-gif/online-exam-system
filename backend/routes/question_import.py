from flask import Blueprint, request, jsonify

from models.db import get_connection
from services.auth_service import admin_required


question_import_bp = Blueprint(
    "question_import",
    __name__,
    url_prefix="/api/admin/questions"
)


@question_import_bp.route("/bulk", methods=["POST"])
@admin_required
def bulk_create_questions():

    data = request.get_json() or {}

    questions = data.get("questions")

    if not isinstance(questions, list) or len(questions) == 0:
        return jsonify({
            "success": False,
            "message": "questions must be a non-empty list"
        }), 400

    valid_sets = ["A", "B", "C", "D"]

    valid_categories = [
        "Quantitative Aptitude",
        "Logical Reasoning",
        "Verbal Ability"
    ]

    valid_options = ["A", "B", "C", "D"]

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            inserted = 0

            for index, question in enumerate(questions, start=1):

                exam_id = question.get("exam_id")
                question_set = question.get("question_set")
                question_text = question.get("question_text")
                option_a = question.get("option_a")
                option_b = question.get("option_b")
                option_c = question.get("option_c")
                option_d = question.get("option_d")
                correct_option = question.get("correct_option")
                category = question.get("category")

                if not all([
                    exam_id,
                    question_set,
                    question_text,
                    option_a,
                    option_b,
                    option_c,
                    option_d,
                    correct_option,
                    category
                ]):
                    connection.rollback()

                    return jsonify({
                        "success": False,
                        "message": f"Question {index}: missing required field"
                    }), 400

                if question_set not in valid_sets:
                    connection.rollback()

                    return jsonify({
                        "success": False,
                        "message": f"Question {index}: invalid question_set"
                    }), 400

                if correct_option not in valid_options:
                    connection.rollback()

                    return jsonify({
                        "success": False,
                        "message": f"Question {index}: invalid correct_option"
                    }), 400

                if category not in valid_categories:
                    connection.rollback()

                    return jsonify({
                        "success": False,
                        "message": f"Question {index}: invalid category"
                    }), 400

                cursor.execute(
                    "SELECT id FROM exam WHERE id = %s",
                    (exam_id,)
                )

                exam = cursor.fetchone()

                if not exam:
                    connection.rollback()

                    return jsonify({
                        "success": False,
                        "message": f"Question {index}: exam {exam_id} not found"
                    }), 404

                cursor.execute("""
                    INSERT INTO question (
                        exam_id,
                        question_set,
                        question_text,
                        option_a,
                        option_b,
                        option_c,
                        option_d,
                        correct_option,
                        category
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    exam_id,
                    question_set,
                    question_text,
                    option_a,
                    option_b,
                    option_c,
                    option_d,
                    correct_option,
                    category
                ))

                inserted += 1

        return jsonify({
            "success": True,
            "message": "Questions imported successfully",
            "inserted_count": inserted
        }), 201

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to import questions",
            "error": str(e)
        }), 500

    finally:
        connection.close()