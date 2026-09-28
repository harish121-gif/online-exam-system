from flask import Blueprint, jsonify, request, session
from models.db import get_connection
from services.auth_service import get_current_student_id

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

    student_id = get_current_student_id()

    if not student_id:
        return jsonify({
            "success": False,
            "message": "Student login required"
        }), 401


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
                    status,
                    malpractice_reason
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

    student_id = get_current_student_id()

    if not student_id:
        return jsonify({
            "success": False,
            "message": "Student login required"
        }), 401


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
                    ea.id,
                    ea.student_id,
                    s.name AS student_name,
                    s.email AS student_email,
                    ea.exam_id,
                    e.title AS exam_title,
                    ea.question_set,
                    ea.start_time,
                    ea.end_time,
                    ea.score,
                    ea.total_questions,
                    ea.tab_switch_count,
                    ea.copy_paste_count,
                    ea.status,
                    ea.malpractice_reason
                FROM exam_attempt ea
                LEFT JOIN student s ON ea.student_id = s.id
                LEFT JOIN exam e ON ea.exam_id = e.id
                WHERE ea.id = %s
                  AND ea.student_id = %s
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
            # Prevent duplicate or terminated submission
            # ------------------------------------------------

            if attempt["status"] in ["terminated", "malpractice"]:
                return jsonify({
                    "success": False,
                    "message": "This examination was terminated due to malpractice activity",
                    "status": attempt["status"],
                    "malpractice_reason": attempt.get("malpractice_reason", "Malpractice detected"),
                    "score": 0,
                    "total_questions": attempt["total_questions"]
                }), 403

            if attempt["status"] != "in_progress":

                return jsonify({
                    "success": False,
                    "message": "This examination has already been submitted",
                    "score": attempt["score"],
                    "total_questions": attempt["total_questions"],
                    "status": attempt["status"]
                }), 400

            # ------------------------------------------------
            # MALPRACTICE FLAGGING FOR ADMIN REVIEW
            # ------------------------------------------------
            payload_tab_switches = int(data.get("tab_switches", 0))
            payload_copy_attempts = int(data.get("copy_attempts", 0))
            payload_paste_attempts = int(data.get("paste_attempts", 0))

            total_tab_switches = (attempt.get("tab_switch_count") or 0) + payload_tab_switches
            total_copy_paste = (attempt.get("copy_paste_count") or 0) + payload_copy_attempts + payload_paste_attempts

            malpractice_msg = None
            if total_tab_switches > 0 or total_copy_paste > 0:
                reasons = []
                if total_tab_switches > 0:
                    reasons.append(f"Tab Switching ({total_tab_switches} times)")
                if total_copy_paste > 0:
                    reasons.append(f"Copy/Paste Activity ({total_copy_paste} times)")
                malpractice_msg = "Flagged for Admin Review: " + " & ".join(reasons)

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
            # Determine status & percentage
            # ------------------------------------------------

            status = "submitted"
            total_questions = len(question_rows) or attempt["total_questions"]
            percentage = round((score / total_questions) * 100, 2) if total_questions > 0 else 0

            # ------------------------------------------------
            # Update attempt
            # ------------------------------------------------

            cursor.execute(
                """
                UPDATE exam_attempt
                SET
                    score = %s,
                    end_time = NOW(),
                    status = %s,
                    tab_switch_count = %s,
                    copy_paste_count = %s,
                    malpractice_reason = %s
                WHERE id = %s
                  AND student_id = %s
                """,
                (
                    score,
                    status,
                    total_tab_switches,
                    total_copy_paste,
                    malpractice_msg,
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

            "student_id": student_id,

            "student_name": attempt.get("student_name"),

            "student_email": attempt.get("student_email"),

            "exam_id": attempt.get("exam_id"),

            "exam_title": attempt.get("exam_title"),

            "score": score,

            "total_questions": total_questions,

            "percentage": percentage,

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

    student_id = get_current_student_id()

    if not student_id:
        return jsonify({
            "success": False,
            "message": "Student login required"
        }), 401


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

    student_id = get_current_student_id()

    if not student_id:
        return jsonify({
            "success": False,
            "message": "Student login required"
        }), 401


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


# ============================================================
# TERMINATE ATTEMPT DUE TO MALPRACTICE
# ============================================================

@attempt_bp.route(
    "/<int:attempt_id>/terminate",
    methods=["POST"]
)
def terminate_attempt(attempt_id):

    student_id = get_current_student_id()

    if not student_id:
        return jsonify({
            "success": False,
            "message": "Student login required"
        }), 401

    data = request.get_json() or {}
    reason = data.get("reason", "Malpractice activity detected during examination")

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                UPDATE exam_attempt
                SET status = 'terminated',
                    malpractice_reason = %s,
                    score = 0,
                    end_time = NOW()
                WHERE id = %s
                  AND student_id = %s
                  AND status = 'in_progress'
                """,
                (
                    reason,
                    attempt_id,
                    student_id
                )
            )

            connection.commit()

        return jsonify({
            "success": True,
            "message": "Examination terminated due to malpractice",
            "attempt_id": attempt_id,
            "status": "terminated",
            "reason": reason
        })

    except Exception as error:

        connection.rollback()

        print(
            "TERMINATE EXAM ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to terminate examination",
            "error": str(error)
        }), 500

    finally:

        connection.close()