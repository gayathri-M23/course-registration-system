import os
import re
import sqlite3
from contextlib import contextmanager
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "course_registration.db")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


@contextmanager
def get_db_connection():
    """Yields a SQLite database connection and ensures it is properly closed."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()



def init_db():
    """Initializes the database and creates the registrations table if it does not exist."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                student_name TEXT NOT NULL,
                email TEXT NOT NULL,
                department TEXT NOT NULL,
                year TEXT NOT NULL,
                course_name TEXT NOT NULL,
                course_code TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


def validate_registration_data(data):
    """Validates the registration input payload. Returns (is_valid, error_message)."""
    if not isinstance(data, dict):
        return False, "Invalid payload format. Expected JSON object."

    required_fields = [
        "student_id",
        "student_name",
        "email",
        "department",
        "year",
        "course_name",
        "course_code",
    ]

    for field in required_fields:
        val = data.get(field)
        if val is None or not str(val).strip():
            readable_name = field.replace("_", " ").title()
            return False, f"{readable_name} is required and cannot be empty."

    email = str(data.get("email", "")).strip()
    if not EMAIL_REGEX.match(email):
        return False, "Please enter a valid email address."

    return True, None


@app.route("/")
def index():
    """Serves the main application web page."""
    return render_template("index.html")


@app.route("/api/registrations", methods=["GET"])
def get_registrations():
    """Retrieve all course registrations."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, student_id, student_name, email, department, year, course_name, course_code, created_at
                FROM registrations
                ORDER BY id DESC
                """
            )
            rows = cursor.fetchall()
            registrations = [dict(row) for row in rows]
            return jsonify({"success": True, "count": len(registrations), "data": registrations}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to fetch registrations: {str(e)}"}), 500


@app.route("/api/registrations/<int:reg_id>", methods=["GET"])
def get_registration(reg_id):
    """Retrieve a single course registration by ID."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, student_id, student_name, email, department, year, course_name, course_code, created_at
                FROM registrations
                WHERE id = ?
                """,
                (reg_id,),
            )
            row = cursor.fetchone()
            if row is None:
                return jsonify({"success": False, "error": f"Registration with ID {reg_id} not found."}), 404
            return jsonify({"success": True, "data": dict(row)}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to retrieve registration: {str(e)}"}), 500


@app.route("/api/registrations", methods=["POST"])
def create_registration():
    """Register a new course registration."""
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"success": False, "error": "Request body must be valid JSON."}), 400

    is_valid, error_msg = validate_registration_data(data)
    if not is_valid:
        return jsonify({"success": False, "error": error_msg}), 400

    student_id = str(data["student_id"]).strip()
    student_name = str(data["student_name"]).strip()
    email = str(data["email"]).strip().lower()
    department = str(data["department"]).strip()
    year = str(data["year"]).strip()
    course_name = str(data["course_name"]).strip()
    course_code = str(data["course_code"]).strip().upper()

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO registrations (student_id, student_name, email, department, year, course_name, course_code)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (student_id, student_name, email, department, year, course_name, course_code),
            )
            conn.commit()
            new_id = cursor.lastrowid

            cursor.execute("SELECT * FROM registrations WHERE id = ?", (new_id,))
            created_row = dict(cursor.fetchone())

            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Course registration successfully created!",
                        "data": created_row,
                    }
                ),
                201,
            )
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to save registration: {str(e)}"}), 500


@app.route("/api/registrations/<int:reg_id>", methods=["PUT"])
def update_registration(reg_id):
    """Update an existing course registration."""
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"success": False, "error": "Request body must be valid JSON."}), 400

    is_valid, error_msg = validate_registration_data(data)
    if not is_valid:
        return jsonify({"success": False, "error": error_msg}), 400

    student_id = str(data["student_id"]).strip()
    student_name = str(data["student_name"]).strip()
    email = str(data["email"]).strip().lower()
    department = str(data["department"]).strip()
    year = str(data["year"]).strip()
    course_name = str(data["course_name"]).strip()
    course_code = str(data["course_code"]).strip().upper()

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM registrations WHERE id = ?", (reg_id,))
            existing = cursor.fetchone()
            if existing is None:
                return jsonify({"success": False, "error": f"Registration with ID {reg_id} not found."}), 404

            cursor.execute(
                """
                UPDATE registrations
                SET student_id = ?, student_name = ?, email = ?, department = ?, year = ?, course_name = ?, course_code = ?
                WHERE id = ?
                """,
                (student_id, student_name, email, department, year, course_name, course_code, reg_id),
            )
            conn.commit()

            cursor.execute("SELECT * FROM registrations WHERE id = ?", (reg_id,))
            updated_row = dict(cursor.fetchone())

            return (
                jsonify(
                    {
                        "success": True,
                        "message": f"Registration #{reg_id} successfully updated!",
                        "data": updated_row,
                    }
                ),
                200,
            )
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to update registration: {str(e)}"}), 500


@app.route("/api/registrations/<int:reg_id>", methods=["DELETE"])
def delete_registration(reg_id):
    """Delete an existing course registration."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, student_name, course_code FROM registrations WHERE id = ?", (reg_id,))
            existing = cursor.fetchone()
            if existing is None:
                return jsonify({"success": False, "error": f"Registration with ID {reg_id} not found."}), 404

            cursor.execute("DELETE FROM registrations WHERE id = ?", (reg_id,))
            conn.commit()

            return (
                jsonify(
                    {
                        "success": True,
                        "message": f"Registration #{reg_id} ({existing['course_code']} for {existing['student_name']}) was deleted successfully.",
                    }
                ),
                200,
            )
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to delete registration: {str(e)}"}), 500


# Ensure database and table exist at startup
init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
