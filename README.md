# 🎓 StudentHub - Student Management CRUD Application

A modern, high-performance Full-Stack CRUD Application built with **FastAPI**, **Motor (Async MongoDB)**, **Loguru Terminal Logging**, and a responsive **Vanilla HTML/CSS/JavaScript (ES6 Modules)** frontend with real-time toast notifications.

---

## 🚀 Features

- **7+ Student Attributes**:
  - Student Roll ID (e.g. `STU-2024-001`)
  - Full Name
  - Email Address (validated)
  - Age
  - Contact Phone Number
  - Major / Program of Study
  - GPA (0.00 – 4.00 scale with color highlights)
  - Enrollment Status (`Active`, `Graduated`, `On Leave`, `Probation`)
- **Real-Time Terminal Logging**:
  - Colorized terminal logs powered by `Loguru` for all CRUD actions: `[CREATE]`, `[READ]`, `[UPDATE]`, `[DELETE]`, `[SEED]`, `[STATS]`.
  - HTTP middleware logging with millisecond latency tracking and status codes.
- **Modern Dark Glassmorphic UI**:
  - Top navigation bar with live **MongoDB Connection Status Pill**.
  - Animated **Toast Notifications** (Success, Error, Warning, Info) with auto-dismiss timers.
  - Live statistics dashboard (Total Students, Active Enrolled, Average GPA, Graduated).
  - Real-time search by name, student roll ID, email, or major.
  - Status pill filtering and sorting (by name, GPA, creation date).
  - Pre-populated **"Seed Dummy Data"** button to load 8 sample student records instantly.
  - Interactive modals for adding, editing, and deleting records.
  - Built-in MongoDB Connection Modal to test or update the connection string without restarting the app.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.13+, FastAPI, Motor (Async MongoDB Driver), Pydantic v2, Uvicorn, Loguru
- **Package Manager**: [uv](https://github.com/astral-sh/uv) (Astral's lightning-fast Python package and project manager)
- **Database**: MongoDB (Local `mongodb://localhost:27017` or MongoDB Atlas `mongodb+srv://...`)
- **Frontend**: HTML5, Vanilla CSS3 (Custom design system), Vanilla JavaScript (ES6 Modules)

---

## 📁 Project Structure

```
crud-operation backend/
├── .env.example               # Template environment configuration (safe to commit)
├── .gitignore                 # Configured to ignore .env and .venv
├── pyproject.toml             # Project dependencies and configuration
├── uv.lock                    # Locked dependency versions
├── main.py                    # Lean FastAPI entrypoint and static file mounting
├── app/
│   ├── config.py              # Environment configuration loader
│   ├── database.py            # Motor async MongoDB client & health check
│   ├── logger.py              # Colorized terminal logging configuration
│   ├── seed_data.py           # Realistic dummy student records
│   ├── schemas/               # Pydantic validation schemas
│   │   ├── __init__.py
│   │   └── student.py         # Request & response models
│   ├── services/              # Business logic & MongoDB operations layer
│   │   ├── __init__.py
│   │   └── student_service.py # Decoupled query and validation methods
│   └── routes/                # FastAPI routing controllers
│       ├── __init__.py
│       ├── students.py        # /api/students endpoints
│       └── system.py          # /api/health and /api/update-mongo-uri
└── static/
    ├── index.html             # Single-page frontend dashboard
    ├── css/
    │   └── styles.css         # Glassmorphic dark theme & animations
    └── js/
        ├── app.js             # Master frontend controller
        └── modules/           # Reusable ES6 frontend modules
            ├── api.js         # Backend fetch client
            ├── modals.js      # Modal window controllers
            ├── state.js       # Application state store
            ├── toast.js       # Toast notification engine
            └── ui.js          # DOM rendering & metric updates
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and set your MongoDB connection URL:
```ini
# Local MongoDB
MONGODB_URL=mongodb://localhost:27017

# OR MongoDB Atlas
# MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority

DATABASE_NAME=student_management_db
COLLECTION_NAME=students
HOST=127.0.0.1
PORT=8000
```

> **Security Note**: Never commit your `.env` file to version control. It is already added to `.gitignore`.

### 3. Install Dependencies with `uv`
Ensure [`uv`](https://docs.astral.sh/uv/) is installed on your system:
```bash
uv sync
```

### 4. Run the Development Server
```bash
uv run uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Open your browser and visit:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students` | Get all students (supports `search`, `status`, `sort_by`, `order`) |
| `GET` | `/api/students/{id}` | Get student details by MongoDB ID |
| `POST` | `/api/students` | Create a new student |
| `PUT` | `/api/students/{id}` | Update student details |
| `DELETE` | `/api/students/{id}` | Delete student by ID |
| `POST` | `/api/students/seed` | Populate database with realistic dummy students |
| `GET` | `/api/students/stats` | Aggregated dashboard metrics |
| `GET` | `/api/health` | Check live MongoDB connection health |
| `POST` | `/api/update-mongo-uri` | Dynamically update connection string |
