import requests
import json

BASE_URL = "http://127.0.0.1:5000"
session = requests.Session()

# 1. STUDENT LOGIN
login_response = session.post(
    f"{BASE_URL}/api/student/login",
    json={
        "email": "harishpro14@gmail.com",

        "password": "student123"
    }
)

print("\n================ STUDENT LOGIN ================")
print("Status:", login_response.status_code)
print(json.dumps(login_response.json(), ensure_ascii=True))

if not login_response.ok:
    print("\nStudent login failed.")
    exit()

# 2. START EXAM
start_response = session.post(
    f"{BASE_URL}/api/exam/2/start"
)

print("\n================ START EXAM ================")
print("Status:", start_response.status_code)
print(json.dumps(start_response.json(), ensure_ascii=True)[:300])

if not start_response.ok:
    print("\nUnable to start exam.")
    exit()

start_data = start_response.json()
attempt_id = start_data.get("attempt_id")
questions = start_data.get("questions", [])

print(f"\nAttempt ID: {attempt_id}, Questions: {len(questions)}")

# 3. CHECK SECURITY
if questions:
    first_q = questions[0]
    if "correct_option" in first_q:
        print("\nWARNING: correct_option is exposed!")
    else:
        print("\nGOOD: correct_option is NOT exposed to student.")

# 4. SUBMIT ANSWERS
answers = {str(q["id"]): "B" for q in questions}

submit_response = session.post(
    f"{BASE_URL}/api/exam/2/submit",
    json={
        "attempt_id": attempt_id,
        "answers": answers
    }
)

print("\n================ EXAM SUBMISSION ================")
print("Status:", submit_response.status_code)
print(json.dumps(submit_response.json(), ensure_ascii=True))