from models.db import get_connection
from services.auth_service import verify_password

connection = get_connection()

try:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, email, password_hash
            FROM student
            WHERE email = %s
            LIMIT 1
            """,
            ("teststudent8@exam.com",)
        )

        student = cursor.fetchone()

    print("STUDENT:", student["id"] if student else None)
    print("EMAIL:", student["email"] if student else None)

    if student:
        print("HASH TYPE:", student["password_hash"].split("$")[0])
        print(
            "PASSWORD VERIFY:",
            verify_password("root1234", student["password_hash"])
        )

finally:
    connection.close()