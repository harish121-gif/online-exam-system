from flask import Blueprint, jsonify, request, session
from models.db import get_connection

attempt_bp = Blueprint(
    "attempt",
    __name__,
    url_prefix="/api/attempt"
)


# ============================================================
# GET CURRENT ATTEMPT
# ============================================================

@attempt_bp.route("/<int:attempt_id>", methods=["GET"])
def get_attempt(attempt_id):

    if (
        "user_id" not in session
        or session.get("role") != "student"
    ):
        return jsonify({
            "success": False,
            "message": "Student login required"
        }), 401

    student_id = session["user_id"]

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    student_id,
                    exam_id,
                    question_set,
                    start_time,
                    end_time,
                    score,
                    total_questions,
                    tab_switch_count,
                    copy_paste_count,
                    status
                FROM exam_attempt
                WHERE id = %s
                  AND student_id = %s
                """,
                (
                    attempt_id,
                    student_id
                )
            )

            attempt = cursor.fetchone()

        if not attempt:
            return jsonify({
                "success": False,
                "message": "Attempt not found"
            }), 404

        return jsonify({
            "success": True,
            "attempt": attempt
        })

    finally:
        connection.close()


# ============================================================
# SUBMIT EXAMINATION
# ============================================================

@attempt_bp.route(
    "/<int:attempt_id>/submit",
    methods=["POST"]
)
def submit_attempt(attempt_id):

    # --------------------------------------------------------
    # Student session check
    # --------------------------------------------------------

    if (
        "user_id" not in session
        or session.get("role") != "student"
    ):
        return jsonify({
            "success": False,
            "message": "Student login required"
        }), 401

    student_id = session["user_id"]

    data = request.get_json() or {}

    answers = data.get("answers", {})

    if not isinstance(answers, dict):
        return jsonify({
            "success": False,
            "message": "Invalid answers format"
        }), 400

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # Get attempt
            # ------------------------------------------------

            cursor.execute(
                """
                SELECT
                    id,
                    student_id,
                    exam_id,
                    question_set,
                    start_time,
                    end_time,
                    score,
                    total_questions,
                    status
                FROM exam_attempt
                WHERE id = %s
                  AND student_id = %s
                """,
                (
                    attempt_id,
                    student_id
                )
            )

            attempt = cursor.fetchone()

            if not attempt:

                return jsonify({
                    "success": False,
                    "message": "Exam attempt not found"
                }), 404

            # ------------------------------------------------
            # Prevent duplicate submission
            # ------------------------------------------------

            if attempt["status"] != "in_progress":

                return jsonify({
                    "success": False,
                    "message": "This examination has already been submitted",
                    "score": attempt["score"],
                    "total_questions": attempt["total_questions"],
                    "status": attempt["status"]
                }), 400

            # ------------------------------------------------
            # Get correct answers
            # ------------------------------------------------

            cursor.execute(
                """
                SELECT
                    id,
                    correct_option
                FROM question
                WHERE exam_id = %s
                  AND question_set = %s
                ORDER BY id
                LIMIT %s
                """,
                (
                    attempt["exam_id"],
                    attempt["question_set"],
                    attempt["total_questions"]
                )
            )

            question_rows = cursor.fetchall()

            # ------------------------------------------------
            # Calculate score
            # ------------------------------------------------

            score = 0

            for question in question_rows:

                question_id = str(question["id"])

                selected_answer = answers.get(
                    question_id
                )

                # Also support numeric JSON keys
                if selected_answer is None:
                    selected_answer = answers.get(
                        question["id"]
                    )

                if (
                    selected_answer
                    and str(selected_answer).upper()
                    == str(question["correct_option"]).upper()
                ):
                    score += 1

            # ------------------------------------------------
            # Determine status
            # ------------------------------------------------

            status = "submitted"

            # ------------------------------------------------
            # Update attempt
            # ------------------------------------------------

            cursor.execute(
                """
                UPDATE exam_attempt
                SET
                    score = %s,
                    end_time = NOW(),
                    status = %s
                WHERE id = %s
                  AND student_id = %s
                """,
                (
                    score,
                    status,
                    attempt_id,
                    student_id
                )
            )

            connection.commit()

        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "message": "Examination submitted successfully",

            "attempt_id": attempt_id,

            "score": score,

            "total_questions": len(question_rows),

            "question_set": attempt["question_set"],

            "status": status

        })

    except Exception as error:

        connection.rollback()

        print(
            "SUBMIT EXAM ERROR:",
            error
        )

        return jsonify({

            "success": False,

            "message": "Unable to submit examination",

            "error": str(error)

        }), 500

    finally:

        connection.close()


# ============================================================
# UPDATE TAB SWITCH COUNT
# ============================================================

@attempt_bp.route(
    "/<int:attempt_id>/tab-switch",
    methods=["POST"]
)
def tab_switch(attempt_id):

    if (
        "user_id" not in session
        or session.get("role") != "student"
    ):
        return jsonify({
            "success": False,
            "message": "Student login required"
        }), 401

    student_id = session["user_id"]

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                UPDATE exam_attempt
                SET tab_switch_count =
                    tab_switch_count + 1
                WHERE id = %s
                  AND student_id = %s
                  AND status = 'in_progress'
                """,
                (
                    attempt_id,
                    student_id
                )
            )

            connection.commit()

        return jsonify({
            "success": True,
            "message": "Tab switch recorded"
        })

    finally:

        connection.close()


# ============================================================
# UPDATE COPY / PASTE COUNT
# ============================================================

@attempt_bp.route(
    "/<int:attempt_id>/copy-paste",
    methods=["POST"]
)
def copy_paste(attempt_id):

    if (
        "user_id" not in session
        or session.get("role") != "student"
    ):
        return jsonify({
            "success": False,
            "message": "Student login required"
        }), 401

    student_id = session["user_id"]

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                UPDATE exam_attempt
                SET copy_paste_count =
                    copy_paste_count + 1
                WHERE id = %s
                  AND student_id = %s
                  AND status = 'in_progress'
                """,
                (
                    attempt_id,
                    student_id
                )
            )

            connection.commit()

        return jsonify({
            "success": True,
            "message": "Copy/paste activity recorded"
        })

    finally:

        connection.close()