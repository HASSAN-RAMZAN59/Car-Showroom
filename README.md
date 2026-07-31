# Car Showroom ERP API Backend

Modular Python FastAPI backend for a Used Car Showroom ERP system built with SQLAlchemy 2.0 (async), Pydantic v2, PostgreSQL, and JWT Role-Based Access Control (RBAC).

## Features

- **FastAPI**: Modern, high-performance web framework for Python.
- **Async SQLAlchemy 2.0**: Asynchronous ORM utilizing `asyncpg`.
- **JWT Authentication & Security**: Password hashing with `bcrypt`/`passlib` and JWT access token issuance/verification with `PyJWT`.
- **Role-Based Access Control (RBAC)**: Support for `ADMIN`, `MANAGER`, and `EMPLOYEE` roles.
- **Pydantic v2 Settings**: Type-safe configuration management reading `.env` files.
- **Modular Directory Architecture**: Clean separation into `core/`, `models/`, `schemas/`, and `api/`.

## Directory Structure

```
/app
  ├── core/
  │     ├── config.py         # Environment variables & Pydantic Settings
  │     ├── database.py       # Async SQLAlchemy engine & Base model
  │     └── security.py       # Password hashing & JWT generation
  ├── models/
  │     └── user.py           # SQLAlchemy User model & UserRole Enum
  ├── schemas/
  │     └── user.py           # Pydantic validation schemas
  ├── api/
  │     ├── deps.py           # Auth dependencies & RBAC permission enforcement
  │     └── v1/
  │           └── auth.py     # Login, Register & Profile endpoints
  └── main.py                 # FastAPI application entry point with CORS
```

## Setup & Running

### 1. Prerequisites
- Python 3.10+
- PostgreSQL database instance (or SQLite for local testing)

### 2. Environment Configuration
Copy the `.env.example` file to `.env` and adjust settings as needed:
```bash
cp .env.example .env
```

### 3. Installation
Create a virtual environment and install dependencies:
```bash
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Running the Development Server
Start the server using `uvicorn`:
```bash
uvicorn app.main:app --reload
```

### 5. API Documentation
Once running, interactive API docs are available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Register a new user | No |
| `POST` | `/api/v1/auth/login` | Login with email & password (JSON) | No |
| `POST` | `/api/v1/auth/login/form` | OAuth2 form login (for Swagger UI) | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Yes (Bearer Token) |
