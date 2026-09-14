# Course Registration System

A full-stack, responsive web application built for a college CRUD activity. The system allows students and academic administrators to seamlessly register for courses, inspect existing registrations, update course records, and delete registrations with instant data persistence.

---

##  Problem Statement

In academic environments, course enrollments can be chaotic and error-prone when handled via manual paperwork or fragmented spreadsheets. Institutions require a centralized, lightweight, reliable, and user-friendly digital system to manage student course enrollments, validate data integrity, and provide immediate real-time feedback.

---

##  Objectives

- Provide an intuitive single-page interface for course registration.
- Implement end-to-end CRUD (Create, Read, Update, Delete) data operations.
- Ensure strict client-side and server-side data validation.
- Decouple the client and server through a RESTful JSON API.
- Persist all records reliably in a lightweight SQLite database without manual setup overhead.

---

##  Features

- **Responsive Dashboard**: Academic collegiate theme optimized for desktops, tablets, and mobile screens.
- **Full CRUD Workflow**:
  - **Create**: Add new student course enrollments with real-time feedback.
  - **Read**: View all registered records in a structured data table.
  - **Update**: Edit any existing registration in-place without page reload.
  - **Delete**: Safe deletion protected by a confirmation modal dialog.
- **Client & Server Validation**:
  - Strict non-empty checks for all fields.
  - Regex-based format verification for college email addresses.
  - Clear, user-friendly inline error hints and auto-dismissing notification banners.
- **Live Search & Filter**: Instant client-side search across student names, IDs, departments, course names, and course codes.
- **Automatic Database Provisioning**: Database schema and tables auto-generate upon starting the Flask server.

---

##  Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Modern CSS3 (CSS Variables, Flexbox, CSS Grid), Vanilla JavaScript (ES6+, Fetch API) |
| **Backend** | Python Flask (REST API) |
| **Database** | SQLite3 (`course_registration.db`) |
| **Data Protocol** | JSON over HTTP |

---

## CRUD Operations

| Operation | Action in UI | HTTP Method | Endpoint | Description |
|---|---|---|---|---|
| **CREATE** | Fill out registration form and click "Register Course" | `POST` | `/api/registrations` | Validates payload, inserts row into SQLite, and returns the newly created record with `201 Created`. |
| **READ** | Table loads automatically; or search | `GET` | `/api/registrations` / `/api/registrations/<id>` | Fetches all registrations or a specific record by ID with `200 OK`. |
| **UPDATE** | Click "Edit" on a table row, edit form, click "Update Registration" | `PUT` | `/api/registrations/<id>` | Validates modified fields, updates record in SQLite, and returns updated record with `200 OK`. |
| **DELETE** | Click "Delete" on a row, confirm in modal | `DELETE` | `/api/registrations/<id>` | Confirms deletion, removes row from SQLite, and returns confirmation with `200 OK`. |

---

## REST API Endpoints

### 1. Retrieve All Registrations
- **Endpoint**: `GET /api/registrations`
- **Response**: `200 OK`
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "student_id": "STU-101",
      "student_name": "Gayathri",
      "email": "gayathri@gmail.com",
      "department": "Computer Science",
      "year": "2nd Year",
      "course_name": "Data Structures & Algorithms",
      "course_code": "CS301",
      "created_at": "2026-09-13 16:35:00"
    }
  ]
}
```

### 2. Retrieve Single Registration
- **Endpoint**: `GET /api/registrations/<id>`
- **Response**: `200 OK` or `404 Not Found`

### 3. Create Course Registration
- **Endpoint**: `POST /api/registrations`
- **Request Body**:
```json
{
  "student_id": "STU-101",
  "student_name": "Jane Doe",
  "email": "jane.doe@college.edu",
  "department": "Computer Science",
  "year": "3rd Year",
  "course_name": "Data Structures & Algorithms",
  "course_code": "CS301"
}
```
- **Response**: `201 Created`

### 4. Update Course Registration
- **Endpoint**: `PUT /api/registrations/<id>`
- **Request Body**: Same fields as `POST`.
- **Response**: `200 OK` or `404 Not Found`

### 5. Delete Course Registration
- **Endpoint**: `DELETE /api/registrations/<id>`
- **Response**: `200 OK` or `404 Not Found`

---

## Database Details

The database is managed via SQLite (`course_registration.db`).

### Table: `registrations`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier |
| `student_id` | `TEXT` | `NOT NULL` | Student institutional ID |
| `student_name` | `TEXT` | `NOT NULL` | Full student name |
| `email` | `TEXT` | `NOT NULL` | Valid email address |
| `department` | `TEXT` | `NOT NULL` | Department name |
| `year` | `TEXT` | `NOT NULL` | Academic year |
| `course_name` | `TEXT` | `NOT NULL` | Name of registered course |
| `course_code` | `TEXT` | `NOT NULL` | Official course catalog code |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp of enrollment |

---

## How to Run the Application

### Prerequisites
- Python 3.8+ installed (Python 3.14 recommended)
- Flask installed:
  ```bash
  pip install Flask
  ```

### Step 1: Navigate to the Project Directory
```bash
cd "course-registration-system"
```

### Step 2: Start the Flask Server
```bash
python app.py
```
*(On Windows systems with Python launcher, you can also use `py -3 app.py`)*

### Step 3: Open in Browser
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

The database `course_registration.db` will automatically initialize on the first run.

---

## Testing Information

An automated test script `test_crud.py` is provided to verify all CRUD endpoints and validation rules.

To run the automated test suite:
```bash
python test_crud.py
```
## Live Demo
[Course Registration System - Live Website](https://course-registration-system-3-e66z.onrender.com)

### Test Cases Covered:
1. **Initial READ**: Ensures `GET /api/registrations` responds with 200 OK.
2. **Backend Validation**:
   - Rejects empty payloads (returns `400 Bad Request`).
   - Rejects invalid email formats (returns `400 Bad Request`).
3. **CREATE (POST)**: Successfully registers a student and returns `201 Created`.
4. **READ SINGLE (GET)**: Fetches the newly registered record by its ID.
5. **UPDATE (PUT)**: Updates the course and student details, returning `200 OK`.
6. **DELETE (DELETE)**: Removes the record and verifies that subsequent lookups return `404 Not Found`.
