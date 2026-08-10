import requests


BASE_URL = "http://127.0.0.1:5000"

session = requests.Session()


# =====================================================
# 1. STUDENT LOGIN
# =====================================================

login_response = session.post(
    f"{BASE_URL}/api/student/login",
    json={
        "email": "student1@exam.com",
        "password": "student123"
    }
)

print("\n================ STUDENT LOGIN ================")
print("Status:", login_response.status_code)
print(login_response.json())


if not login_response.ok:
    print("\nStudent login failed.")
    print("Check the student password/hash in MySQL.")
    exit()


# =====================================================
# 2. GET EXAM DETAILS
# =====================================================

exam_response = session.get(
    f"{BASE_URL}/api/exam/1"
)

print("\n================ EXAM DETAILS ================")
print("Status:", exam_response.status_code)
print(exam_response.json())


if not exam_response.ok:
    print("\nUnable to load exam.")
    exit()


# =====================================================
# 3. GET SET A QUESTIONS
# =====================================================

questions_response = session.get(
    f"{BASE_URL}/api/exam/1/questions",
    params={
        "set": "A"
    }
)

print("\n================ EXAM QUESTIONS ================")
print("Status:", questions_response.status_code)
print(questions_response.json())


if not questions_response.ok:
    print("\nUnable to load questions.")
    exit()


questions_data = questions_response.json()

questions = questions_data.get("questions", [])

print("\nNumber of questions received:", len(questions))


# =====================================================
# 4. CHECK SECURITY
# correct_option MUST NOT be visible
# =====================================================

if questions:

    first_question = questions[0]

    print("\n================ FIRST QUESTION ================")
    print(first_question)

    if "correct_option" in first_question:
        print("\nWARNING: correct_option is exposed!")
    else:
        print("\nGOOD: correct_option is NOT exposed.")


# =====================================================
# 5. SUBMIT TEST ANSWERS
# =====================================================

answers = {}

for question in questions:

    question_id = str(question["id"])

    # For testing only:
    # Select option B for every question.
    answers[question_id] = "B"


submit_response = session.post(
    f"{BASE_URL}/api/exam/1/submit",
    json={
        "question_set": "A",
        "answers": answers
    }
)

print("\n================ EXAM SUBMISSION ================")
print("Status:", submit_response.status_code)
print(submit_response.json())