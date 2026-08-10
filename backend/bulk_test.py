import requests


BASE_URL = "http://127.0.0.1:5000"

session = requests.Session()


# ADMIN LOGIN
login = session.post(
    f"{BASE_URL}/api/admin/login",
    json={
        "username": "admin",
        "password": "admin123"
    }
)

print("LOGIN:", login.status_code)
print(login.json())


if not login.ok:
    exit()


# BULK QUESTIONS
data = {
    "questions": [
        {
            "exam_id": 1,
            "question_set": "A",
            "question_text": "What is 10 + 20?",
            "option_a": "20",
            "option_b": "30",
            "option_c": "40",
            "option_d": "50",
            "correct_option": "B",
            "category": "Quantitative Aptitude"
        },
        {
            "exam_id": 1,
            "question_set": "A",
            "question_text": "If all cats are animals and some animals are pets, which statement is valid?",
            "option_a": "All cats are pets",
            "option_b": "Some animals may be cats",
            "option_c": "No cats are animals",
            "option_d": "All pets are cats",
            "correct_option": "B",
            "category": "Logical Reasoning"
        },
        {
            "exam_id": 1,
            "question_set": "A",
            "question_text": "Choose the synonym of 'Rapid'.",
            "option_a": "Slow",
            "option_b": "Fast",
            "option_c": "Weak",
            "option_d": "Late",
            "correct_option": "B",
            "category": "Verbal Ability"
        }
    ]
}


response = session.post(
    f"{BASE_URL}/api/admin/questions/bulk",
    json=data
)

print("\nBULK IMPORT:")
print("Status:", response.status_code)
print(response.json())