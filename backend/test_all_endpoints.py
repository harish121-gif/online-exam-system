import os
import sys

from app import create_app

app = create_app()
client = app.test_client()

print("--- TESTING HEALTH ENDPOINT ---")
res = client.get("/api/health")
print("Status:", res.status_code)
print("Data:", res.get_json())

print("\n--- TESTING DB TEST ENDPOINT ---")
res = client.get("/api/db-test")
print("Status:", res.status_code)
print("Data:", res.get_json())

print("\n--- TESTING ADMIN LOGIN ---")
res = client.post("/api/admin/login", json={"username": "admin", "password": "admin123"})
print("Status:", res.status_code)
print("Data:", res.get_json())

print("\n--- TESTING STUDENT LOGIN ---")
res = client.post("/api/auth/student/login", json={"email": "harishpro14@gmail.com", "password": "student123"})
print("Status:", res.status_code)

if res.get_json() is None:
    res = client.post("/api/student/login", json={"email": "harishpro14@gmail.com", "password": "student123"})
    print("Status (alt):", res.status_code)
print("Data:", res.get_json())

