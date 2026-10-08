import requests


BASE_URL = "http://127.0.0.1:5000"

session = requests.Session()


# ---------------------------------------
# ADMIN LOGIN
# ---------------------------------------
login_response = session.post(
    f"{BASE_URL}/api/admin/login",
    json={
        "username": "admin",
        "password": "admin123"
    }
)

print("\nADMIN LOGIN")
print("Status:", login_response.status_code)
print(login_response.json())


if not login_response.ok:
    print("\nLogin failed. Stop here.")
    exit()


# ---------------------------------------
# GET QUESTIONS
# ---------------------------------------
questions_response = session.get(
    f"{BASE_URL}/api/exam/2/admin/questions"
)


import json

print("\nGET QUESTIONS")
print("Status:", questions_response.status_code)
print(json.dumps(questions_response.json(), ensure_ascii=True, indent=2)[:500])



# ---------------------------------------
# CREATE QUESTION
# ---------------------------------------
question_data = {
    "exam_id": 1,
    "question_set": "A",
    "question_text": "What is 10 + 20?",
    "option_a": "20",
    "option_b": "30",
    "option_c": "40",
    "option_d": "50",
    "correct_option": "B",
    "category": "Quantitative Aptitude"
}

create_response = session.post(
    f"{BASE_URL}/api/exam/2/admin/questions",
    json=question_data
)

print("\nCREATE QUESTION")
print("Status:", create_response.status_code)
print(json.dumps(create_response.json(), ensure_ascii=True))


# ---------------------------------------
# GET QUESTIONS AGAIN
# ---------------------------------------
questions_response = session.get(
    f"{BASE_URL}/api/exam/2/admin/questions",
    params={
        "set": "A"
    }
)


print("\nQUESTIONS - SET A")
print("Status:", questions_response.status_code)
print(json.dumps(questions_response.json(), ensure_ascii=True)[:500])