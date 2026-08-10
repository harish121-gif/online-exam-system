from flask import Blueprint, jsonify, request, session

from models.db import get_connection


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
# START EXAM
#
# Student 1 -> A
# Student 2 -> B
# Student 3 -> C
# Student 4 -> D
# Student 5 -> A
# Student 6 -> B
# ...
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

            if not exam["is_active"]:

                return jsonify({
                    "success": False,
                    "message": "This examination is not active"
                }), 400


            # ------------------------------------------------
            # CHECK EXISTING ATTEMPT
            # ------------------------------------------------

            cursor.execute("""
                SELECT
                    id,
                    question_set,
                    start_time,
                    status,
                    score,
                    total_questions
                FROM exam_attempt
                WHERE student_id = %s
                  AND exam_id = %s
                ORDER BY id DESC
                LIMIT 1
            """, (
                student_id,
                exam_id
            ))

            existing_attempt = cursor.fetchone()


            # ------------------------------------------------
            # CONTINUE CURRENT ATTEMPT
            # ------------------------------------------------

            if (
                existing_attempt
                and existing_attempt["status"] == "in_progress"
            ):

                assigned_set = existing_attempt["question_set"]
                attempt_id = existing_attempt["id"]


            # ------------------------------------------------
            # CREATE NEW ATTEMPT
            # ------------------------------------------------

            else:

                sets = ["A", "B", "C", "D"]

                assigned_set = sets[
                    (student_id - 1) % 4
                ]

                cursor.execute("""
                    INSERT INTO exam_attempt
                    (
                        student_id,
                        exam_id,
                        question_set,
                        start_time,
                        score,
                        total_questions,
                        tab_switch_count,
                        copy_paste_count,
                        status
                    )
                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        NOW(),
                        0,
                        %s,
                        0,
                        0,
                        'in_progress'
                    )
                """, (
                    student_id,
                    exam_id,
                    assigned_set,
                    exam["total_questions"]
                ))

                attempt_id = cursor.lastrowid

                connection.commit()


            # ------------------------------------------------
            # GET QUESTIONS
            #
            # IMPORTANT:
            # correct_option is NOT sent to frontend.
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


        # ----------------------------------------------------
        # VERIFY QUESTION COUNT
        # ----------------------------------------------------

        if len(questions) < exam["total_questions"]:

            return jsonify({
                "success": False,
                "message": (
                    f"Only {len(questions)} questions found "
                    f"for Set {assigned_set}. "
                    f"Expected {exam['total_questions']}."
                )
            }), 400


        # ----------------------------------------------------
        # SUCCESS
        # ----------------------------------------------------

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
# GET QUESTIONS BY SET
#
# Testing endpoint
#
# /api/exam/1/questions?set=A
# ============================================================

@exam_bp.route("/<int:exam_id>/questions", methods=["GET"])
def get_questions(exam_id):

    question_set = request.args.get(
        "set",
        "A"
    ).upper()


    if question_set not in ["A", "B", "C", "D"]:

        return jsonify({
            "success": False,
            "message": "Invalid question set"
        }), 400


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
                    category,
                    difficulty
                FROM question
                WHERE exam_id = %s
                  AND question_set = %s
                ORDER BY id
            """, (
                exam_id,
                question_set
            ))

            questions = cursor.fetchall()


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


        return jsonify({

            "success": True,

            "exam": exam,

            "question_set": question_set,

            "total_questions": len(questions),

            "questions": questions

        })


    finally:

        connection.close()


# ============================================================
# SUBMIT EXAMINATION
#
# POST /api/exam/<exam_id>/submit
#
# Request body:
#
# {
#     "attempt_id": 1,
#     "answers": {
#         "101": "A",
#         "102": "C",
#         "103": "B"
#     }
# }
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


    # --------------------------------------------------------
    # GET REQUEST DATA
    # --------------------------------------------------------

    data = request.get_json() or {}

    attempt_id = data.get("attempt_id")
    answers = data.get("answers", {})


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
                    end_time,
                    score,
                    total_questions,
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
            # PREVENT DOUBLE SUBMISSION
            # ------------------------------------------------

            if attempt["status"] != "in_progress":

                return jsonify({
                    "success": False,
                    "message": "This examination has already been submitted",
                    "score": attempt["score"],
                    "status": attempt["status"]
                }), 400


            assigned_set = attempt["question_set"]


            # ------------------------------------------------
            # GET CORRECT ANSWERS
            #
            # These answers stay on the backend.
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
                exam_id,
                assigned_set,
                attempt["total_questions"]
            ))

            questions = cursor.fetchall()


            # ------------------------------------------------
            # CALCULATE SCORE
            # ------------------------------------------------

            score = 0
            answered_count = 0


            for question in questions:

                question_id = str(question["id"])

                submitted_answer = answers.get(question_id)

                if submitted_answer:

                    answered_count += 1

                    submitted_answer = str(
                        submitted_answer
                    ).upper().strip()

                    correct_answer = str(
                        question["correct_option"]
                    ).upper().strip()

                    if submitted_answer == correct_answer:

                        score += 1


            # ------------------------------------------------
            # UPDATE ATTEMPT
            # ------------------------------------------------

            cursor.execute("""
                UPDATE exam_attempt
                SET
                    end_time = NOW(),
                    score = %s,
                    status = 'submitted'
                WHERE id = %s
                  AND student_id = %s
                  AND exam_id = %s
            """, (
                score,
                attempt_id,
                student_id,
                exam_id
            ))


            connection.commit()


        # ----------------------------------------------------
        # RESULT
        # ----------------------------------------------------

        total_questions = len(questions)

        percentage = 0

        if total_questions > 0:

            percentage = round(
                (score / total_questions) * 100,
                2
            )


        return jsonify({

            "success": True,

            "message": "Examination submitted successfully",

            "attempt_id": attempt_id,

            "student_id": student_id,

            "exam_id": exam_id,

            "question_set": assigned_set,

            "score": score,

            "total_questions": total_questions,

            "answered_questions": answered_count,

            "unanswered_questions": (
                total_questions - answered_count
            ),

            "percentage": percentage,

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
def get_result(exam_id):

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
                    ea.exam_id,
                    ea.question_set,
                    ea.start_time,
                    ea.end_time,
                    ea.score,
                    ea.total_questions,
                    ea.status,
                    s.name AS student_name,
                    s.email AS student_email,
                    e.title AS exam_title,
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

                "message": "No examination attempt found"

            }), 404


        percentage = 0

        if result["total_questions"] > 0:

            percentage = round(
                (
                    result["score"]
                    / result["total_questions"]
                ) * 100,
                2
            )


        return jsonify({

            "success": True,

            "result": {

                "attempt_id": result["attempt_id"],

                "student_id": result["student_id"],

                "student_name": result["student_name"],

                "student_email": result["student_email"],

                "exam_id": result["exam_id"],

                "exam_title": result["exam_title"],

                "question_set": result["question_set"],

                "start_time": result["start_time"],

                "end_time": result["end_time"],

                "score": result["score"],

                "total_questions": result["total_questions"],

                "percentage": percentage,

                "status": result["status"],

                "duration_minutes": result["duration_minutes"]

            }

        })


    finally:

        connection.close()


# ============================================================
# CREATE EXAM
# ============================================================

@exam_bp.route("/", methods=["POST"])
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


    if not title:

        return jsonify({

            "success": False,

            "message": "Exam title is required"

        }), 400


    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO exam
                (
                    title,
                    total_questions,
                    duration_minutes
                )
                VALUES
                (
                    %s,
                    %s,
                    %s
                )
            """, (
                title,
                total_questions,
                duration_minutes
            ))


            connection.commit()

            new_id = cursor.lastrowid


        return jsonify({

            "success": True,

            "message": "Exam created successfully",

            "exam_id": new_id

        }), 201


    finally:

        connection.close()