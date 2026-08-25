from models.db import get_connection
from werkzeug.security import generate_password_hash, check_password_hash

password = "root1234"

new_hash = generate_password_hash(
    password,
    method="pbkdf2:sha256",
    salt_length=16
)

connection = get_connection()

try:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE student
            SET password_hash = %s
            WHERE id = 14
            """,
            (new_hash,)
        )

        print("ROWS UPDATED:", cursor.rowcount)

        cursor.execute(
            """
            SELECT id, email, password_hash
            FROM student
            WHERE id = 14
            """
        )

        student = cursor.fetchone()

    connection.commit()

    print("ID:", student["id"])
    print("EMAIL:", student["email"])
    print("HASH TYPE:", student["password_hash"].split("$")[0])
    print(
        "VERIFY:",
        check_password_hash(student["password_hash"], password)
    )

finally:
    connection.close()