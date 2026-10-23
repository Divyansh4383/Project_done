# SprintForge Operations Guide

This guide covers the practical lifecycle of SprintForge: starting it locally, using the application, developing and testing changes, and publishing the source to a new Git repository.

## 1. What you need

The simplest way to run the complete application is Docker Compose. Install:

- Git, if you are cloning or publishing the repository.
- Docker Desktop (Windows/macOS) or Docker Engine with the Compose plugin (Linux).
- A browser.

Docker builds the React frontend and Java application and starts PostgreSQL and Redis. You do not need Java, Node.js, or a local PostgreSQL installation for this option.

For development without Docker, install Java 21, Node.js 22 with npm, and PostgreSQL 17. Docker is still needed to run the PostgreSQL Testcontainers integration tests.

## 2. Start the application with Docker Compose

Open PowerShell in the repository root (the directory containing `compose.yaml`) and run:

```powershell
docker compose up --build -d
docker compose ps
```

The first build can take a few minutes. Compose builds the frontend assets into the Spring Boot application, starts the database and Redis, waits for their health checks, and starts the API. Flyway applies database migrations automatically.

Open:

- Application: <http://localhost:8080>
- Health: <http://localhost:8080/actuator/health>
- API documentation: <http://localhost:8080/docs>
- OpenAPI JSON: <http://localhost:8080/v3/api-docs>

Register an account in the UI, create a project, then use its navigation to add members, plan sprints, and manage work on the Kanban board. Project access is controlled by membership and role. The admin console requires the global `ADMIN` role.

### Stop and restart

```powershell
docker compose stop
docker compose start
```

To stop and remove the containers and network while keeping your database and Redis data:

```powershell
docker compose down
```

To rebuild after changing code:

```powershell
docker compose up --build -d
```

**Avoid `docker compose down -v` unless you deliberately want to delete the local database and Redis volumes and all data stored in them.**

### Local Compose configuration

The checked-in `compose.yaml` contains convenience-only local database credentials and a local JWT secret. They are not suitable for a public or production deployment. The `.env.example` file documents application environment variables; Compose does not automatically pass every variable in that file into the API container. For a customized Compose environment, explicitly wire the desired variables into the `api.environment` section of `compose.yaml` or a Compose `env_file`.

## 3. Run components separately for development

### Start the backend

Start PostgreSQL 17 and create a database and user matching the values below, or set these variables to your own database credentials. In PowerShell, from the repository root:

```powershell
$env:DATABASE_URL = "jdbc:postgresql://localhost:5432/sprintforge"
$env:DATABASE_USERNAME = "sprintforge"
$env:DATABASE_PASSWORD = "sprintforge"
$env:JWT_SECRET = "replace-with-a-random-secret-of-at-least-32-characters"
$env:CACHE_TYPE = "simple"
$env:REDIS_HEALTH_ENABLED = "false"
.\mvnw.cmd spring-boot:run
```

The backend defaults to port 8080. Flyway migrates the database on startup. These PowerShell environment variables apply only to the current terminal session.

### Start the frontend dev server

In a second terminal:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` and `/actuator` requests to the backend at `localhost:8080`. Use the Vite server for frontend development; the packaged frontend is served by Spring Boot on port 8080.

### Build the frontend

```powershell
Set-Location frontend
npm ci
npm run build
```

The production assets are written to `frontend/dist/`. Docker copies these generated assets into the backend image during its build; they should not be committed.

## 4. Test and build

Run the backend tests and verification from the repository root:

```powershell
.\mvnw.cmd clean verify
```

The PostgreSQL migration integration test uses Testcontainers, so Docker must be available. JaCoCo coverage output is generated under `target/site/jacoco/`.

The production Docker image can be built and run with:

```powershell
docker compose build api
docker compose up -d
```

For frontend changes, also run `npm ci` and `npm run build` in `frontend/`. CI runs Maven verification, builds the Docker image, and scans it with Trivy.

## 5. Configuration and operational notes

`.env.example` is a reference list, not a ready-to-use production secrets file. Never commit real passwords, SMTP credentials, or JWT secrets. `.env` is ignored by Git; keep local credentials there or in your deployment platform's secret manager.

Important settings include:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | PostgreSQL connection |
| `JWT_SECRET` | Signs access tokens; use a strong unique secret outside local development |
| `CACHE_TYPE` | Selects simple local caching or Redis-backed caching |
| `EMAIL_NOTIFICATIONS_ENABLED` | Enables outbound notification email |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP settings when email is enabled |
| `BOOTSTRAP_ADMIN_ENABLED` | Opt-in initial admin provisioning |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_NAME` | Initial admin credentials and display name |
| `PORT` | HTTP port; defaults to 8080 |

Bootstrap admin creation is disabled by default. When you need an initial admin, configure the bootstrap settings in the runtime environment before first startup, and use a unique strong password. Do not enable a default admin password on an internet-facing deployment.

The login limiter is in-memory and per application process. It is useful for a single instance but does not share counters across multiple replicas. Plan a shared gateway or distributed limiter before horizontally scaling.

## 6. Common tasks in the application

1. Register and sign in at `/login`.
2. Create a project from the Projects page.
3. Open the project to see its overview.
4. Use the board to create work items, change status, search, and open comments.
5. Use Sprints to create a delivery window and change its status.
6. Use Members to view or add registered users (subject to project permissions).
7. Use Audit history to review recorded project changes.
8. Admins can inspect notification outbox events, replay dead-lettered events, and change user roles in the Admin console.

The REST API is rooted at `/api/v1`. Interactive endpoint details are available at `/docs`.

## 7. Troubleshooting

| Symptom | What to check |
| --- | --- |
| Port 8080, 5432, or 5173 is already in use | Stop the other service or change the corresponding port configuration. |
| API is unhealthy immediately after startup | Wait for database migrations and startup to finish, then inspect `docker compose logs api`. |
| Database connection fails | Check `docker compose ps`, PostgreSQL health, and the datasource URL/user/password. |
| Frontend API requests fail in development | Confirm the backend is listening on port 8080 and restart Vite after changing its proxy configuration. |
| Admin console is unavailable | Sign in as an account with the `ADMIN` role; ordinary registered accounts are not admins. |
| PostgreSQL integration test cannot start | Start Docker Desktop/Engine and rerun `.\mvnw.cmd clean verify`. |
| Need more runtime details | Run `docker compose logs -f api` or `docker compose logs -f postgres`. Press Ctrl+C to stop following logs. |

## 8. Publish the code to a new repository with one commit and no old history

Yes. Git can publish the complete current source tree as a **new root commit**, without transferring the existing commit history. A safe approach is to copy the working files to a separate folder while excluding the current `.git` directory, initialize Git there, and push that snapshot to an empty repository you created on GitHub (or another Git host).

This preserves the existing repository and its history. It also includes the current uncommitted changes in the copied working tree. Do not use this process if you want to preserve branches, tags, contributors, or old commits in the new repository.

In PowerShell, replace the example paths and remote URL with your own. The destination directory must not already exist:

```powershell
$source = "C:\path\to\Project_scheduler"
$destination = "C:\path\to\SprintForge-clean"

if (Test-Path $destination) {
    throw "Destination already exists. Choose a new, empty destination path."
}

robocopy $source $destination /E /XD .git target node_modules dist
if ($LASTEXITCODE -ge 8) {
    throw "Copy failed; robocopy exit code: $LASTEXITCODE"
}

Set-Location $destination
git init
git branch -M main
git status --short
```

Before staging, inspect the copied files and ensure no credentials or personal data are present. `.env` files are ignored; `.env.example` is intentionally included. Then create exactly one commit and push:

```powershell
git add -A
git status
git diff --cached --stat
git commit -m "Initial SprintForge import"
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-NEW-REPO.git
git push -u origin main
```

Create the destination Git repository empty (do not initialize it with a README, license, or `.gitignore`), so the push does not need unrelated-history reconciliation. After pushing, `git log --oneline` in the new folder should show the single initial commit.

This changes only the new copy. It does not delete or rewrite history in the original repository. If you later want a clean one-commit version in the existing folder instead, stop and decide carefully first: rewriting the current branch would discard its visible history and may affect anyone else using it.
