from flask import Blueprint, jsonify, request, session
from models.db import get_connection

question_bp = Blueprint(
    "question",
    __name__,
    url_prefix="/api/exam"
)


# ============================================================
# GET QUESTIONS FOR AN EXAM
#
# Student:
# GET /api/exam/<exam_id>/questions?set=A
#
# IMPORTANT:
# correct_option is NOT returned to students
# ============================================================

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

            # ------------------------------------------------
            # CHECK EXAM
            # ------------------------------------------------

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

            # ------------------------------------------------
            # GET QUESTIONS
            #
            # correct_option intentionally excluded
            # ------------------------------------------------

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
            """, (
                exam_id,
                question_set
            ))

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


# ============================================================
# ADMIN - GET ALL QUESTIONS
#
# GET /api/exam/<exam_id>/admin/questions
#
# correct_option IS returned because this is an admin endpoint.
# ============================================================

@question_bp.route(
    "/<int:exam_id>/admin/questions",
    methods=["GET"]
)
def admin_get_questions(exam_id):

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # CHECK EXAM
            # ------------------------------------------------

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

            # ------------------------------------------------
            # OPTIONAL SET FILTER
            # ------------------------------------------------

            question_set = request.args.get("set")

            if question_set:

                question_set = question_set.upper()

                if question_set not in ["A", "B", "C", "D"]:

                    return jsonify({
                        "success": False,
                        "message": "Invalid question set"
                    }), 400

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
                        correct_option,
                        category,
                        difficulty
                    FROM question
                    WHERE exam_id = %s
                      AND question_set = %s
                    ORDER BY id ASC
                """, (
                    exam_id,
                    question_set
                ))

            else:

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
                        correct_option,
                        category,
                        difficulty
                    FROM question
                    WHERE exam_id = %s
                    ORDER BY question_set ASC, id ASC
                """, (exam_id,))

            questions = cursor.fetchall()

        return jsonify({
            "success": True,
            "exam": exam,
            "questions": questions,
            "total_questions": len(questions)
        })

    finally:

        connection.close()


# ============================================================
# ADMIN - GET SINGLE QUESTION
#
# GET /api/exam/<exam_id>/admin/questions/<question_id>
# ============================================================

@question_bp.route(
    "/<int:exam_id>/admin/questions/<int:question_id>",
    methods=["GET"]
)
def admin_get_question(exam_id, question_id):

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

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
                    correct_option,
                    category,
                    difficulty
                FROM question
                WHERE id = %s
                  AND exam_id = %s
            """, (
                question_id,
                exam_id
            ))

            question = cursor.fetchone()

        if not question:

            return jsonify({
                "success": False,
                "message": "Question not found"
            }), 404

        return jsonify({
            "success": True,
            "question": question
        })

    finally:

        connection.close()


# ============================================================
# ADMIN - ADD QUESTION
#
# POST /api/exam/<exam_id>/admin/questions
# ============================================================

@question_bp.route(
    "/<int:exam_id>/admin/questions",
    methods=["POST"]
)
def admin_add_question(exam_id):

    data = request.get_json() or {}

    question_set = str(
        data.get("question_set", "")
    ).upper()

    question_text = str(
        data.get("question_text", "")
    ).strip()

    option_a = str(
        data.get("option_a", "")
    ).strip()

    option_b = str(
        data.get("option_b", "")
    ).strip()

    option_c = str(
        data.get("option_c", "")
    ).strip()

    option_d = str(
        data.get("option_d", "")
    ).strip()

    correct_option = str(
        data.get("correct_option", "")
    ).upper()

    category = str(
        data.get("category", "")
    ).strip()

    difficulty = str(
        data.get("difficulty", "Medium")
    ).strip()

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if question_set not in ["A", "B", "C", "D"]:

        return jsonify({
            "success": False,
            "message": "Question set must be A, B, C or D"
        }), 400

    if not question_text:

        return jsonify({
            "success": False,
            "message": "Question text is required"
        }), 400

    if not option_a or not option_b or not option_c or not option_d:

        return jsonify({
            "success": False,
            "message": "All four options are required"
        }), 400

    if correct_option not in ["A", "B", "C", "D"]:

        return jsonify({
            "success": False,
            "message": "Correct option must be A, B, C or D"
        }), 400

    if category not in [
        "Quantitative Aptitude",
        "Logical Reasoning",
        "Verbal Ability"
    ]:

        return jsonify({
            "success": False,
            "message": "Invalid category"
        }), 400

    if difficulty not in [
        "Easy",
        "Medium",
        "Hard"
    ]:

        return jsonify({
            "success": False,
            "message": "Invalid difficulty"
        }), 400

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # CHECK EXAM
            # ------------------------------------------------

            cursor.execute("""
                SELECT id
                FROM exam
                WHERE id = %s
            """, (exam_id,))

            exam = cursor.fetchone()

            if not exam:

                return jsonify({
                    "success": False,
                    "message": "Exam not found"
                }), 404

            # ------------------------------------------------
            # INSERT QUESTION
            # ------------------------------------------------

            cursor.execute("""
                INSERT INTO question
                (
                    exam_id,
                    question_set,
                    question_text,
                    option_a,
                    option_b,
                    option_c,
                    option_d,
                    correct_option,
                    category,
                    difficulty
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
            """, (
                exam_id,
                question_set,
                question_text,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_option,
                category,
                difficulty
            ))

            connection.commit()

            question_id = cursor.lastrowid

        return jsonify({
            "success": True,
            "message": "Question created successfully",
            "question_id": question_id,
            "exam_id": exam_id,
            "question_set": question_set
        }), 201

    except Exception as error:

        connection.rollback()

        print("ADD QUESTION ERROR:", error)

        return jsonify({
            "success": False,
            "message": "Unable to create question",
            "error": str(error)
        }), 500

    finally:

        connection.close()


# ============================================================
# ADMIN - UPDATE QUESTION
#
# PUT /api/exam/<exam_id>/admin/questions/<question_id>
# ============================================================

@question_bp.route(
    "/<int:exam_id>/admin/questions/<int:question_id>",
    methods=["PUT"]
)
def admin_update_question(exam_id, question_id):

    data = request.get_json() or {}

    question_set = str(
        data.get("question_set", "")
    ).upper()

    question_text = str(
        data.get("question_text", "")
    ).strip()

    option_a = str(
        data.get("option_a", "")
    ).strip()

    option_b = str(
        data.get("option_b", "")
    ).strip()

    option_c = str(
        data.get("option_c", "")
    ).strip()

    option_d = str(
        data.get("option_d", "")
    ).strip()

    correct_option = str(
        data.get("correct_option", "")
    ).upper()

    category = str(
        data.get("category", "")
    ).strip()

    difficulty = str(
        data.get("difficulty", "Medium")
    ).strip()

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if question_set not in ["A", "B", "C", "D"]:

        return jsonify({
            "success": False,
            "message": "Question set must be A, B, C or D"
        }), 400

    if not question_text:

        return jsonify({
            "success": False,
            "message": "Question text is required"
        }), 400

    if not option_a or not option_b or not option_c or not option_d:

        return jsonify({
            "success": False,
            "message": "All four options are required"
        }), 400

    if correct_option not in ["A", "B", "C", "D"]:

        return jsonify({
            "success": False,
            "message": "Correct option must be A, B, C or D"
        }), 400

    if category not in [
        "Quantitative Aptitude",
        "Logical Reasoning",
        "Verbal Ability"
    ]:

        return jsonify({
            "success": False,
            "message": "Invalid category"
        }), 400

    if difficulty not in [
        "Easy",
        "Medium",
        "Hard"
    ]:

        return jsonify({
            "success": False,
            "message": "Invalid difficulty"
        }), 400

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # CHECK QUESTION
            # ------------------------------------------------

            cursor.execute("""
                SELECT id
                FROM question
                WHERE id = %s
                  AND exam_id = %s
            """, (
                question_id,
                exam_id
            ))

            existing = cursor.fetchone()

            if not existing:

                return jsonify({
                    "success": False,
                    "message": "Question not found"
                }), 404

            # ------------------------------------------------
            # UPDATE
            # ------------------------------------------------

            cursor.execute("""
                UPDATE question
                SET
                    question_set = %s,
                    question_text = %s,
                    option_a = %s,
                    option_b = %s,
                    option_c = %s,
                    option_d = %s,
                    correct_option = %s,
                    category = %s,
                    difficulty = %s
                WHERE id = %s
                  AND exam_id = %s
            """, (
                question_set,
                question_text,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_option,
                category,
                difficulty,
                question_id,
                exam_id
            ))

            connection.commit()

        return jsonify({
            "success": True,
            "message": "Question updated successfully",
            "question_id": question_id
        })

    except Exception as error:

        connection.rollback()

        print("UPDATE QUESTION ERROR:", error)

        return jsonify({
            "success": False,
            "message": "Unable to update question",
            "error": str(error)
        }), 500

    finally:

        connection.close()


# ============================================================
# ADMIN - DELETE QUESTION
#
# DELETE /api/exam/<exam_id>/admin/questions/<question_id>
# ============================================================

@question_bp.route(
    "/<int:exam_id>/admin/questions/<int:question_id>",
    methods=["DELETE"]
)
def admin_delete_question(exam_id, question_id):

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # CHECK QUESTION
            # ------------------------------------------------

            cursor.execute("""
                SELECT id
                FROM question
                WHERE id = %s
                  AND exam_id = %s
            """, (
                question_id,
                exam_id
            ))

            question = cursor.fetchone()

            if not question:

                return jsonify({
                    "success": False,
                    "message": "Question not found"
                }), 404

            # ------------------------------------------------
            # DELETE
            # ------------------------------------------------

            cursor.execute("""
                DELETE FROM question
                WHERE id = %s
                  AND exam_id = %s
            """, (
                question_id,
                exam_id
            ))

            connection.commit()

        return jsonify({
            "success": True,
            "message": "Question deleted successfully",
            "question_id": question_id
        })

    except Exception as error:

        connection.rollback()

        print("DELETE QUESTION ERROR:", error)

        return jsonify({
            "success": False,
            "message": "Unable to delete question",
            "error": str(error)
        }), 500

    finally:

        connection.close()