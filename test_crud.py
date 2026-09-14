"""
Automated Test Suite for Course Registration System.
Tests all CRUD operations and validation rules against the Flask REST API.
"""

import os
import sys
import unittest

# Ensure the app module can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, get_db_connection, init_db


class CourseRegistrationTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

        # Clear any prior test entries to ensure clean test state
        with get_db_connection() as conn:
            conn.execute("DELETE FROM registrations WHERE email LIKE '%@testcollege.edu'")
            conn.commit()

    def tearDown(self):
        # Clean up test entries
        with get_db_connection() as conn:
            conn.execute("DELETE FROM registrations WHERE email LIKE '%@testcollege.edu'")
            conn.commit()

    def test_01_index_route(self):
        """Test that the homepage serves HTML correctly."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Course Registration System", response.data)

    def test_02_read_all_empty_or_existing(self):
        """Test GET /api/registrations returns 200 and a list."""
        response = self.client.get("/api/registrations")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertIsInstance(data.get("data"), list)

    def test_03_create_registration_validation(self):
        """Test POST /api/registrations validation failures."""
        # Missing fields
        incomplete_payload = {
            "student_id": "STU-999",
            "student_name": "Incomplete Student"
            # Missing other required fields
        }
        res = self.client.post("/api/registrations", json=incomplete_payload)
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json().get("success"))

        # Invalid email format
        invalid_email_payload = {
            "student_id": "STU-999",
            "student_name": "Alice Tester",
            "email": "not-an-email",
            "department": "Computer Science",
            "year": "2nd Year",
            "course_name": "Algorithms",
            "course_code": "CS201",
        }
        res = self.client.post("/api/registrations", json=invalid_email_payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("valid email", res.get_json().get("error", "").lower())

    def test_04_full_crud_lifecycle(self):
        """Test full CREATE -> READ -> UPDATE -> DELETE cycle."""
        # 1. CREATE
        new_record = {
            "student_id": "STU-2026-001",
            "student_name": "Alice Morgan",
            "email": "alice.morgan@testcollege.edu",
            "department": "Computer Science",
            "year": "3rd Year",
            "course_name": "Database Systems",
            "course_code": "CS304",
        }
        create_res = self.client.post("/api/registrations", json=new_record)
        self.assertEqual(create_res.status_code, 201)
        create_data = create_res.get_json()
        self.assertTrue(create_data.get("success"))
        self.assertIn("data", create_data)
        reg_id = create_data["data"]["id"]
        self.assertIsNotNone(reg_id)
        self.assertEqual(create_data["data"]["student_id"], "STU-2026-001")
        self.assertEqual(create_data["data"]["course_code"], "CS304")

        # 2. READ (SINGLE)
        get_res = self.client.get(f"/api/registrations/{reg_id}")
        self.assertEqual(get_res.status_code, 200)
        get_data = get_res.get_json()
        self.assertTrue(get_data.get("success"))
        self.assertEqual(get_data["data"]["student_name"], "Alice Morgan")

        # 3. UPDATE (PUT)
        update_payload = {
            "student_id": "STU-2026-001",
            "student_name": "Alice Morgan (Honor Roll)",
            "email": "alice.morgan@testcollege.edu",
            "department": "Computer Science",
            "year": "4th Year",
            "course_name": "Advanced Operating Systems",
            "course_code": "CS401",
        }
        put_res = self.client.put(f"/api/registrations/{reg_id}", json=update_payload)
        self.assertEqual(put_res.status_code, 200)
        put_data = put_res.get_json()
        self.assertTrue(put_data.get("success"))
        self.assertEqual(put_data["data"]["student_name"], "Alice Morgan (Honor Roll)")
        self.assertEqual(put_data["data"]["year"], "4th Year")
        self.assertEqual(put_data["data"]["course_code"], "CS401")

        # 4. DELETE
        del_res = self.client.delete(f"/api/registrations/{reg_id}")
        self.assertEqual(del_res.status_code, 200)
        del_data = del_res.get_json()
        self.assertTrue(del_data.get("success"))

        # 5. READ AFTER DELETE (should be 404)
        verify_del_res = self.client.get(f"/api/registrations/{reg_id}")
        self.assertEqual(verify_del_res.status_code, 404)
        self.assertFalse(verify_del_res.get_json().get("success"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
