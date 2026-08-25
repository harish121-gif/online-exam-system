from models.db import get_connection
from werkzeug.security import generate_password_hash, check_password_hash

password = "admin1234"

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
            UPDATE admin
            SET password_hash = %s
            WHERE id = 2
            """,
            (new_hash,)
        )

        print("ROWS UPDATED:", cursor.rowcount)

        cursor.execute(
            """
            SELECT id, username, name, email, password_hash
            FROM admin
            WHERE id = 2
            """
        )

        admin = cursor.fetchone()

    connection.commit()

    print("ID:", admin["id"])
    print("USERNAME:", admin["username"])
    print("EMAIL:", admin["email"])
    print("HASH TYPE:", admin["password_hash"].split("$")[0])
    print("VERIFY:", check_password_hash(
        admin["password_hash"],
        password
    ))

finally:
    connection.close()