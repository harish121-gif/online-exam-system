from flask import Blueprint, jsonify, request, session

from models.db import get_connection
from services.auth_service import admin_required


exam_bp = Blueprint(
    "exam",
    __name__,
    url_prefix="/api/exam"
)


# ============================================================
# GET ALL EXAMS
# ============================================================

@exam_bp.route("/", methods=["GET"])
def get_all_exams():

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    title,
                    total_questions,
                    duration_minutes,
                    is_active,
                    created_at
                FROM exam
                ORDER BY id DESC
            """)

            exams = cursor.fetchall()

        return jsonify({
            "success": True,
            "exams": exams
        })

    finally:
        connection.close()


# ============================================================
# GET SINGLE EXAM
# ============================================================

@exam_bp.route("/<int:exam_id>", methods=["GET"])
def get_exam(exam_id):

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    title,
                    total_questions,
                    duration_minutes,
                    is_active,
                    created_at
                FROM exam
                WHERE id = %s
            """, (exam_id,))

            exam = cursor.fetchone()

        if not exam:

            return jsonify({
                "success": False,
                "message": "Exam not found"
            }), 404

        return jsonify({
            "success": True,
            "exam": exam
        })

    finally:
        connection.close()


# ============================================================
# START EXAMINATION
#
# POST /api/exam/<exam_id>/start
# ============================================================

@exam_bp.route("/<int:exam_id>/start", methods=["POST"])
def start_exam(exam_id):

    # --------------------------------------------------------
    # CHECK STUDENT SESSION
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

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # GET EXAM
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
            # CHECK ACTIVE STATUS
            # ------------------------------------------------

            if not exam["is_active"]:

                return jsonify({
                    "success": False,
                    "message": "This examination is currently inactive"
                }), 403

            # ------------------------------------------------
            # CHECK EXISTING ATTEMPT
            # ------------------------------------------------

            cursor.execute("""
                SELECT
                    id,
                    question_set,
                    start_time,
                    status
                FROM exam_attempt
                WHERE student_id = %s
                  AND exam_id = %s
                  AND status = 'in_progress'
                ORDER BY id DESC
                LIMIT 1
            """, (
                student_id,
                exam_id
            ))

            existing_attempt = cursor.fetchone()

            # ------------------------------------------------
            # GET AVAILABLE QUESTION SETS
            # ------------------------------------------------

            cursor.execute("""
                SELECT DISTINCT
                    question_set
                FROM question
                WHERE exam_id = %s
                ORDER BY question_set
            """, (exam_id,))

            set_rows = cursor.fetchall()

            sets = [
                row["question_set"]
                for row in set_rows
            ]

            if not sets:

                return jsonify({
                    "success": False,
                    "message": "No question sets found for this examination"
                }), 404

            # ------------------------------------------------
            # CONTINUE EXISTING ATTEMPT
            # ------------------------------------------------

            if existing_attempt:

                assigned_set = existing_attempt["question_set"]
                attempt_id = existing_attempt["id"]

            else:

                # ------------------------------------------------
                # ASSIGN QUESTION SET
                #
                # Student 1 -> A
                # Student 2 -> B
                # Student 3 -> C
                # Student 4 -> D
                # Student 5 -> A
                # ------------------------------------------------

                set_index = (student_id - 1) % len(sets)

                assigned_set = sets[set_index]

                # ------------------------------------------------
                # CHECK QUESTIONS
                # ------------------------------------------------

                cursor.execute("""
                    SELECT
                        COUNT(*) AS question_count
                    FROM question
                    WHERE exam_id = %s
                      AND question_set = %s
                """, (
                    exam_id,
                    assigned_set
                ))

                question_count = cursor.fetchone()

                if (
                    not question_count
                    or question_count["question_count"] == 0
                ):

                    return jsonify({
                        "success": False,
                        "message": (
                            "No questions found for Set "
                            + str(assigned_set)
                        )
                    }), 404

                # ------------------------------------------------
                # CREATE ATTEMPT
                # ------------------------------------------------

                cursor.execute("""
                    INSERT INTO exam_attempt
                    (
                        student_id,
                        exam_id,
                        question_set,
                        total_questions,
                        start_time,
                        status,
                        score
                    )
                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        %s,
                        NOW(),
                        'in_progress',
                        0
                    )
                """, (
                    student_id,
                    exam_id,
                    assigned_set,
                    exam["total_questions"]
                ))

                connection.commit()

                attempt_id = cursor.lastrowid

            # ------------------------------------------------
            # GET QUESTIONS
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
                ORDER BY id
                LIMIT %s
            """, (
                exam_id,
                assigned_set,
                exam["total_questions"]
            ))

            questions = cursor.fetchall()

        if not questions:

            return jsonify({
                "success": False,
                "message": (
                    "No questions found for Set "
                    + str(assigned_set)
                )
            }), 404

        return jsonify({
            "success": True,
            "message": "Examination started successfully",
            "attempt_id": attempt_id,
            "question_set": assigned_set,
            "exam": exam,
            "questions": questions
        })

    except Exception as error:

        connection.rollback()

        print("START EXAM ERROR:", error)

        return jsonify({
            "success": False,
            "message": "Unable to start examination",
            "error": str(error)
        }), 500

    finally:

        connection.close()


# ============================================================
# GET QUESTIONS
#
# GET /api/exam/<exam_id>/questions?set=A
# ============================================================

@exam_bp.route("/<int:exam_id>/questions", methods=["GET"])
def get_exam_questions(exam_id):

    question_set = request.args.get(
        "set",
        "A"
    ).upper()

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # GET EXAM
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
            # VALIDATE SET
            # ------------------------------------------------

            if question_set not in ["A", "B", "C", "D"]:

                return jsonify({
                    "success": False,
                    "message": "Invalid question set"
                }), 400

            # ------------------------------------------------
            # GET QUESTIONS
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
                ORDER BY id
                LIMIT %s
            """, (
                exam_id,
                question_set,
                exam["total_questions"]
            ))

            questions = cursor.fetchall()

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
# SUBMIT EXAMINATION
#
# POST /api/exam/<exam_id>/submit
# ============================================================

@exam_bp.route("/<int:exam_id>/submit", methods=["POST"])
def submit_exam(exam_id):

    # --------------------------------------------------------
    # CHECK STUDENT SESSION
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

    attempt_id = data.get("attempt_id")
    answers = data.get("answers", {})

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not attempt_id:

        return jsonify({
            "success": False,
            "message": "Attempt ID is required"
        }), 400

    if not isinstance(answers, dict):

        return jsonify({
            "success": False,
            "message": "Answers must be an object"
        }), 400

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # GET ATTEMPT
            # ------------------------------------------------

            cursor.execute("""
                SELECT
                    id,
                    student_id,
                    exam_id,
                    question_set,
                    start_time,
                    total_questions,
                    score,
                    status
                FROM exam_attempt
                WHERE id = %s
                  AND student_id = %s
                  AND exam_id = %s
            """, (
                attempt_id,
                student_id,
                exam_id
            ))

            attempt = cursor.fetchone()

            if not attempt:

                return jsonify({
                    "success": False,
                    "message": "Exam attempt not found"
                }), 404

            # ------------------------------------------------
            # CHECK STATUS
            # ------------------------------------------------

            if attempt["status"] != "in_progress":

                return jsonify({
                    "success": False,
                    "message": (
                        "This examination has already been submitted"
                    ),
                    "score": attempt["score"],
                    "total_questions": attempt["total_questions"],
                    "status": attempt["status"]
                }), 400

            # ------------------------------------------------
            # GET CORRECT ANSWERS
            # ------------------------------------------------

            cursor.execute("""
                SELECT
                    id,
                    correct_option
                FROM question
                WHERE exam_id = %s
                  AND question_set = %s
                ORDER BY id
                LIMIT %s
            """, (
                attempt["exam_id"],
                attempt["question_set"],
                attempt["total_questions"]
            ))

            question_rows = cursor.fetchall()

            score = 0
            answered_count = 0

            # ------------------------------------------------
            # AUTO EVALUATION
            # ------------------------------------------------

            for question in question_rows:

                question_id = str(
                    question["id"]
                )

                selected_answer = answers.get(
                    question_id
                )

                # Support integer keys
                if selected_answer is None:

                    selected_answer = answers.get(
                        question["id"]
                    )

                if selected_answer:

                    answered_count += 1

                    selected_answer = str(
                        selected_answer
                    ).strip().upper()

                    correct_answer = str(
                        question["correct_option"]
                    ).strip().upper()

                    if selected_answer == correct_answer:

                        score += 1

            # ------------------------------------------------
            # CALCULATE PERCENTAGE
            # ------------------------------------------------

            total_questions = attempt[
                "total_questions"
            ]

            percentage = 0

            if total_questions > 0:

                percentage = round(
                    (
                        score
                        / total_questions
                    ) * 100,
                    2
                )

            # ------------------------------------------------
            # UPDATE ATTEMPT
            # ------------------------------------------------

            cursor.execute("""
                UPDATE exam_attempt
                SET
                    score = %s,
                    status = 'submitted',
                    end_time = NOW()
                WHERE id = %s
            """, (
                score,
                attempt_id
            ))

            connection.commit()

        return jsonify({
            "success": True,
            "message": "Examination submitted successfully",
            "attempt_id": attempt_id,
            "student_id": student_id,
            "exam_id": exam_id,
            "question_set": attempt["question_set"],
            "score": score,
            "total_questions": total_questions,
            "percentage": percentage,
            "answered_questions": answered_count,
            "unanswered_questions": (
                total_questions - answered_count
            ),
            "status": "submitted"
        })

    except Exception as error:

        connection.rollback()

        print("SUBMIT EXAM ERROR:", error)

        return jsonify({
            "success": False,
            "message": "Unable to submit examination",
            "error": str(error)
        }), 500

    finally:

        connection.close()


# ============================================================
# GET EXAM RESULT
#
# GET /api/exam/<exam_id>/result
# ============================================================

@exam_bp.route("/<int:exam_id>/result", methods=["GET"])
def get_exam_result(exam_id):

    # --------------------------------------------------------
    # CHECK STUDENT SESSION
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

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    ea.id AS attempt_id,

                    ea.student_id,
                    s.name AS student_name,
                    s.email AS student_email,

                    ea.exam_id,
                    e.title AS exam_title,

                    ea.question_set,

                    ea.total_questions,
                    ea.score,

                    CASE
                        WHEN ea.total_questions > 0
                        THEN ROUND(
                            (
                                ea.score
                                / ea.total_questions
                            ) * 100,
                            2
                        )
                        ELSE 0
                    END AS percentage,

                    ea.status,
                    ea.start_time,
                    ea.end_time,

                    e.duration_minutes

                FROM exam_attempt ea

                INNER JOIN student s
                    ON s.id = ea.student_id

                INNER JOIN exam e
                    ON e.id = ea.exam_id

                WHERE ea.student_id = %s
                  AND ea.exam_id = %s

                ORDER BY ea.id DESC

                LIMIT 1
            """, (
                student_id,
                exam_id
            ))

            result = cursor.fetchone()

        if not result:

            return jsonify({
                "success": False,
                "message": "Exam result not found"
            }), 404

        return jsonify({
            "success": True,
            "result": result
        })

    finally:

        connection.close()


# ============================================================
# CREATE EXAM
#
# ADMIN ONLY
#
# POST /api/exam/
# ============================================================

@exam_bp.route("/", methods=["POST"])
@admin_required
def create_exam():

    data = request.get_json() or {}

    title = data.get(
        "title",
        ""
    ).strip()

    total_questions = data.get(
        "total_questions",
        30
    )

    duration_minutes = data.get(
        "duration_minutes",
        30
    )

    is_active = data.get(
        "is_active",
        1
    )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not title:

        return jsonify({
            "success": False,
            "message": "Exam title is required"
        }), 400

    try:

        total_questions = int(
            total_questions
        )

        duration_minutes = int(
            duration_minutes
        )

        is_active = int(
            is_active
        )

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": (
                "Total questions, duration and active status "
                "must contain valid values"
            )
        }), 400

    if total_questions <= 0:

        return jsonify({
            "success": False,
            "message": "Total questions must be greater than 0"
        }), 400

    if duration_minutes <= 0:

        return jsonify({
            "success": False,
            "message": "Duration must be greater than 0"
        }), 400

    if is_active not in [0, 1]:

        return jsonify({
            "success": False,
            "message": "is_active must be 0 or 1"
        }), 400

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO exam
                (
                    title,
                    total_questions,
                    duration_minutes,
                    is_active
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s
                )
            """, (
                title,
                total_questions,
                duration_minutes,
                is_active
            ))

            new_id = cursor.lastrowid

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Exam created successfully",
            "exam_id": new_id
        }), 201

    except Exception as error:

        connection.rollback()

        print("CREATE EXAM ERROR:", error)

        return jsonify({
            "success": False,
            "message": "Unable to create examination",
            "error": str(error)
        }), 500

    finally:

        connection.close()


# ============================================================
# UPDATE EXAM
#
# ADMIN ONLY
#
# PUT /api/exam/<exam_id>
# ============================================================

@exam_bp.route("/<int:exam_id>", methods=["PUT"])
@admin_required
def update_exam(exam_id):

    data = request.get_json() or {}

    title = data.get(
        "title",
        ""
    ).strip()

    total_questions = data.get(
        "total_questions"
    )

    duration_minutes = data.get(
        "duration_minutes"
    )

    is_active = data.get(
        "is_active"
    )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not title:

        return jsonify({
            "success": False,
            "message": "Exam title is required"
        }), 400

    if total_questions is None:

        return jsonify({
            "success": False,
            "message": "Total questions is required"
        }), 400

    if duration_minutes is None:

        return jsonify({
            "success": False,
            "message": "Duration is required"
        }), 400

    if is_active is None:

        is_active = 1

    try:

        total_questions = int(
            total_questions
        )

        duration_minutes = int(
            duration_minutes
        )

        is_active = int(
            is_active
        )

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": "Invalid exam values"
        }), 400

    if total_questions <= 0:

        return jsonify({
            "success": False,
            "message": "Total questions must be greater than 0"
        }), 400

    if duration_minutes <= 0:

        return jsonify({
            "success": False,
            "message": "Duration must be greater than 0"
        }), 400

    if is_active not in [0, 1]:

        return jsonify({
            "success": False,
            "message": "is_active must be 0 or 1"
        }), 400

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # CHECK EXAM
            # ------------------------------------------------

            cursor.execute("""
                SELECT
                    id
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
            # UPDATE
            # ------------------------------------------------

            cursor.execute("""
                UPDATE exam
                SET
                    title = %s,
                    total_questions = %s,
                    duration_minutes = %s,
                    is_active = %s
                WHERE id = %s
            """, (
                title,
                total_questions,
                duration_minutes,
                is_active,
                exam_id
            ))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Exam updated successfully",
            "exam_id": exam_id
        })

    except Exception as error:

        connection.rollback()

        print("UPDATE EXAM ERROR:", error)

        return jsonify({
            "success": False,
            "message": "Unable to update examination",
            "error": str(error)
        }), 500

    finally:

        connection.close()


# ============================================================
# DELETE EXAM
#
# ADMIN ONLY
#
# DELETE /api/exam/<exam_id>
# ============================================================

@exam_bp.route("/<int:exam_id>", methods=["DELETE"])
@admin_required
def delete_exam(exam_id):

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # ------------------------------------------------
            # CHECK EXAM
            # ------------------------------------------------

            cursor.execute("""
                SELECT
                    id
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
            # CHECK EXISTING ATTEMPTS
            # ------------------------------------------------

            cursor.execute("""
                SELECT
                    COUNT(*) AS attempt_count
                FROM exam_attempt
                WHERE exam_id = %s
            """, (exam_id,))

            attempts = cursor.fetchone()

            if attempts["attempt_count"] > 0:

                return jsonify({
                    "success": False,
                    "message": (
                        "Cannot delete an examination "
                        "that already has student attempts. "
                        "Deactivate it instead."
                    )
                }), 409

            # ------------------------------------------------
            # DELETE QUESTIONS
            # ------------------------------------------------

            cursor.execute("""
                DELETE FROM question
                WHERE exam_id = %s
            """, (exam_id,))

            # ------------------------------------------------
            # DELETE EXAM
            # ------------------------------------------------

            cursor.execute("""
                DELETE FROM exam
                WHERE id = %s
            """, (exam_id,))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Exam deleted successfully",
            "exam_id": exam_id
        })

    except Exception as error:

        connection.rollback()

        print("DELETE EXAM ERROR:", error)

        return jsonify({
            "success": False,
            "message": "Unable to delete examination",
            "error": str(error)
        }), 500

    finally:

        connection.close()