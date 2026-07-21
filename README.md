# Bouguedima Studio — DevOps Setup & Architecture

A complete, production-ready DevOps infrastructure for the Bouguedima Studio application, featuring a FastAPI (Python 3.12) backend, React.js (Vite) frontend, PostgreSQL database integration, and automated GitHub Actions CI/CD with security scanning (Trivy).

---

## 🏗️ Project Architecture

```
                       +-------------------+
                       |    User Browser   |
                       +---------+---------+
                                 |
                                 v  (Port 3000 / 8080)
                       +---------+---------+
                       |  Nginx Frontend   |
                       +---------+---------+
                                 |
                                 |  /api/ (Proxy Pass)
                                 v
                       +---------+---------+
                       |  FastAPI Backend  |
                       +----+---------+----+
                            |         |
      (Port 5432) Read/Write|         | Log Rotation
                            v         v
                     +------+---+   +-+--------+
                     | Postgres |   | Log Files|
                     +----------+   +----------+
```

---

## 🛠️ Technology Stack

* **Backend**: FastAPI, Python 3.12, Uvicorn, Psycopg 3, Alembic.
* **Frontend**: React.js (Vite), Nginx (Production Static Server).
* **Database**: PostgreSQL 16.
* **Security & Quality**: Black, Ruff, MyPy, ESLint, Prettier, pre-commit, Trivy.
* **Orchestration**: Docker, Docker Compose.
* **CI/CD**: GitHub Actions.

---

## 📂 Project Structure

```
├── .github/
│   └── workflows/
│       ├── ci.yml               # CI Pipeline (Lints, Pytest, Alembic test, Trivy scan)
│       └── cd.yml               # CD Pipeline (Builds, tags, pushes to GHCR, deploy trigger)
├── backend/
│   ├── alembic/                 # Alembic migration scripts
│   ├── alembic.ini              # Alembic config
│   ├── Dockerfile               # Optimized multi-stage Backend image
│   ├── .dockerignore            # Excludes caches, venvs, and local secrets
│   ├── db.py                    # PostgreSQL database connection wrapper
│   ├── main.py                  # FastAPI server application bootstrap
│   ├── logging_config.py        # Rotating JSON structured logger setup
│   ├── requirements.txt         # Production dependencies
│   ├── requirements-dev.txt     # Development and testing dependencies
│   └── test_main.py             # Pytest suite with mock database transactions
├── frontend/
│   ├── Dockerfile               # Production Nginx server setup (runs as non-root on 8080)
│   ├── .dockerignore            # Excludes node_modules and local builds
│   ├── nginx.conf               # Custom Nginx server configuration (SPA routing and proxying)
│   ├── package.json             # Scripts, dependencies, and code quality configurations
│   └── eslint.config.js         # ESLint 9 configuration file
├── docker-compose.yml           # Production Docker Compose orchestration file
├── .gitignore                   # Workspace root-level git rules
└── .pre-commit-config.yaml      # Pre-commit hook definitions for Black, Ruff, ESLint, Prettier
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and configure:

* `DATABASE_URL`: PostgreSQL connection string (`postgresql://postgres:postgres@localhost:5432/studio`).
* `SECRET_KEY`: Long random string for JWT token generation.
* `ADMIN_PASSWORD_HASH`: Bcrypt hash of the administrator password.
* `STUDIO_ADMIN_USER`: Username of the administrator user (defaults to `admin`).
* `LOG_LEVEL`: Logger level (e.g. `INFO`, `ERROR`).
* `LOG_FORMAT`: Format style for logs (`json` or `plain`).

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

* `VITE_API_URL`: Path prefix for the proxy pass API calls (defaults to `/api`).

---

## 💻 Local Development

### 1. Database (PostgreSQL)

You can run a local PostgreSQL instance easily using Docker:

```bash
docker run --name studio-postgres-dev -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=studio -p 5432:5432 -d postgres:16-alpine
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements-dev.txt

# Run migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🐳 Docker Compose Usage

To build and launch the complete production environment locally:

```bash
docker compose up --build -d
```

Containers:
* `studio-postgres`: PostgreSQL database with health check and persisted data volume.
* `studio-backend`: FastAPI backend server running as non-root user `studio` (Port `8000`).
* `studio-frontend`: Nginx serving compiled React assets, running as non-root user `app` (Port `3000` mapped to Nginx `8080`).

---

## 🧪 Testing & Code Quality

### Pre-Commit Hooks

Install hooks to validate formatting and syntax before committing:

```bash
pip install pre-commit
pre-commit install
```

### Backend Lints and Tests

```bash
cd backend
# Format checking
black --check .
ruff check .
# Type checking
mypy . --ignore-missing-imports
# Run test suite
pytest -v --cov=.
```

### Frontend Lints

```bash
cd frontend
# Linting
npm run lint
# Formatting check
npm run format
```

---

## 🔄 GitHub Actions CI/CD Pipeline

```
  Push / PR
     │
     ▼
┌──────────────┐      ┌─────────────────────────┐
│  CI Pipeline │ ---> │  Backend Lint, Test,    │
└──────────────┘      │  Migrations, Trivy Scan │
     │                └─────────────────────────┘
     ▼ (Merge to main)
┌──────────────┐      ┌─────────────────────────┐
│  CD Pipeline │ ---> │  GHCR Build & Push,     │
└──────────────┘      │  Trigger deploy (VPS/etc)│
                      └─────────────────────────┘
```

1. **CI Pipeline (`ci.yml`)**:
   * Runs on every push and pull request.
   * Caches pip and npm dependencies for high performance.
   * Runs Black, Ruff, and MyPy on the Backend.
   * Spins up a PostgreSQL service container in GHA to validate Alembic migrations (`alembic upgrade head`).
   * Runs Pytest.
   * Compiles the React SPA.
   * Builds both Docker images and scans them using **Trivy** for vulnerabilities (fails if critical/high are found).

2. **CD Pipeline (`cd.yml`)**:
   * Runs only on pushes to the `main` branch.
   * Transforms GitHub registry paths to lowercase automatically to prevent push errors for capital usernames.
   * Builds, tags, and pushes images to **GitHub Container Registry (GHCR)** with tags `latest` and `sha-XXXX`.
   * Automatically triggers deployment based on configured secrets.

---

## 🚀 Deployment Instructions

### 1. VPS via Docker Compose (Recommended)
This workflow automates logging in to GHCR on your remote server, pulling images, and restarting containers.

* Set up the following GitHub Repository Secrets:
  * `VPS_HOST`: IP address of the target server.
  * `VPS_USER`: SSH username (e.g. `root`, `ubuntu`).
  * `VPS_SSH_KEY`: Private SSH Key.
* Ensure `docker-compose.yml` is present in `/opt/studio` on the VPS.

### 2. Render / Railway / Coolify
Webhooks trigger builds automatically once new images are pushed.

* Render: Set the Webhook hook secret as `RENDER_DEPLOY_HOOK_URL`.
* Railway: Set the Railway webhook URL as `RAILWAY_DEPLOY_HOOK_URL`.
* Coolify: Set the deployment webhook URL as `COOLIFY_DEPLOY_WEBHOOK`.

---

## 🛑 Troubleshooting

* **Permission Denied binding 80**: Nginx runs as non-root user `app` and cannot bind to ports below 1024. Nginx is configured to listen on port `8080`.
* **Database Connection Issues**: Make sure `DATABASE_URL` uses the correct PostgreSQL hostname (inside Docker Compose, the database hostname is `postgres`).
* **Migrations fail at startup**: Verify the PostgreSQL container is fully healthy before the backend boots up. The compose configuration enforces `postgres: condition: service_healthy`.
