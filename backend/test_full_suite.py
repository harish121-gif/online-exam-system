import json
import os
import sys

from app import create_app

app = create_app()
client = app.test_client()

def test_full_flow():
    print("==========================================")
    print("1. HEALTH & DB CHECKS")
    print("==========================================")
    r = client.get("/api/health")
    print("Health:", r.status_code, r.get_json())
    assert r.status_code == 200

    r = client.get("/api/db-test")
    print("DB Test:", r.status_code, r.get_json().get("message"))
    assert r.status_code == 200

    print("\n==========================================")
    print("2. ADMIN LOGIN & DASHBOARD")
    print("==========================================")
    r = client.post("/api/admin/login", json={"username": "admin", "password": "admin123"})
    print("Admin Login:", r.status_code, r.get_json().get("user", {}).get("name"))
    assert r.status_code == 200
    admin_user = r.get_json()["user"]

    admin_headers = {
        "X-User-Id": str(admin_user["id"]),
        "X-User-Role": "admin",
        "X-User-Name": admin_user["name"],
        "X-User-Email": admin_user["email"]
    }

    r = client.get("/api/admin/dashboard", headers=admin_headers)
    print("Admin Dashboard Stats:", r.status_code, r.get_json().get("statistics"))
    assert r.status_code == 200

    print("\n==========================================")
    print("3. STUDENT LOGIN & EXAM START")
    print("==========================================")
    r = client.post("/api/student/login", json={"email": "harishpro14@gmail.com", "password": "student123"})
    print("Student Login:", r.status_code, r.get_json().get("user", {}).get("name"))
    assert r.status_code == 200
    student_user = r.get_json()["user"]

    student_headers = {
        "X-User-Id": str(student_user["id"]),
        "X-User-Role": "student",
        "X-User-Name": student_user["name"],
        "X-User-Email": student_user["email"]
    }

    r = client.get("/api/exam/", headers=student_headers)
    print("Get Exams List:", r.status_code, len(r.get_json().get("exams", [])))
    assert r.status_code == 200

    exams = r.get_json()["exams"]
    exam_id = exams[0]["id"] if exams else 2

    # Clear any leftover disqualified/in_progress attempt for test student so test runs cleanly
    from models.db import get_connection
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM exam_attempt WHERE student_id = %s AND exam_id = %s", (student_user["id"], exam_id))
        conn.commit()
    conn.close()

    r = client.post(f"/api/exam/{exam_id}/start", headers=student_headers)
    print(f"Start Exam {exam_id}:", r.status_code, r.get_json().get("message"))
    assert r.status_code == 200
    start_data = r.get_json()
    attempt_id = start_data["attempt_id"]
    questions = start_data["questions"]
    print(f"Assigned Set: {start_data.get('question_set')}, Questions fetched: {len(questions)}")

    print("\n==========================================")
    print("4. SUBMIT EXAM WITH CLEAN ATTEMPT (1 MINOR TAB SWITCH)")
    print("==========================================")
    answers = {}
    for q in questions:
        answers[str(q["id"])] = "A"

    submit_payload = {
        "attempt_id": attempt_id,
        "answers": answers,
        "tab_switches": 1,
        "copy_attempts": 0,
        "paste_attempts": 0
    }

    r = client.post(f"/api/exam/{exam_id}/submit", headers=student_headers, json=submit_payload)
    sub_data = r.get_json()
    print("Submit Exam Response:", r.status_code, "Status:", sub_data.get("status"), "Score:", sub_data.get("score"), "Percentage:", sub_data.get("percentage"))
    assert r.status_code == 200
    assert sub_data.get("status") == "submitted"

    print("\n==========================================")
    print("5. GET RESULT")
    print("==========================================")
    r = client.get(f"/api/exam/{exam_id}/result", headers=student_headers)
    res_data = r.get_json()
    print("Fetch Result:", r.status_code, res_data.get("result", {}).get("status"), "Percentage:", res_data.get("result", {}).get("percentage"))
    assert r.status_code == 200

    print("\nSUCCESS: All endpoints and flow verified!")

if __name__ == "__main__":
    test_full_flow()
