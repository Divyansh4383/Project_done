# SprintForge — Simplification & Improvement Plan

This plan covers all changes across Steps 0–10. **No code will be touched until you approve.**  
Branch: `simplify-and-improve` (will be created first, before any file change).

---

## Proposed Changes

### Pre-step — Create branch

```bash
git checkout -b simplify-and-improve
```

---

### Step 0 — Rename package `dev.sreedaya` → `dev.divyansh`

**Why:** The package contains someone else's name. This is your fork, your identity.

#### [MODIFY] [pom.xml](file:///C:/Users/VICTUS/Desktop/Project1/pom.xml)
- Change `<groupId>dev.sreedaya</groupId>` → `<groupId>dev.divyansh</groupId>`

#### [MODIFY] All 51 main Java files + 9 test Java files
- Every `package dev.sreedaya.sprintforge` declaration → `package dev.divyansh.sprintforge`
- Every `import dev.sreedaya.sprintforge.*` → `import dev.divyansh.sprintforge.*`
- Physical folders: rename `src/main/java/dev/sreedaya/` → `src/main/java/dev/divyansh/`
  and `src/test/java/dev/sreedaya/` → `src/test/java/dev/divyansh/`

#### [MODIFY] [spotbugs-exclude.xml](file:///C:/Users/VICTUS/Desktop/Project1/spotbugs-exclude.xml)
- Replace any `dev.sreedaya` references → `dev.divyansh` *(will be deleted in Step 5, but must compile until then)*

**Do NOT touch:** `LICENSE` (contains original author's name — must stay as-is per Rule 6)

---

### Step 1 — Remove S3 presigned attachment module

**Why:** S3 is disabled by default, adds heavy AWS SDK dependency, and you can't explain it in an interview without an AWS account.

#### [MODIFY] [pom.xml](file:///C:/Users/VICTUS/Desktop/Project1/pom.xml)
- Remove `<artifactId>s3</artifactId>` dependency block
- Remove `<aws.sdk.version>` property

#### [MODIFY] [application.properties](file:///C:/Users/VICTUS/Desktop/Project1/src/main/resources/application.properties)
- Remove lines 38–41: `app.storage.s3.enabled`, `app.storage.s3.bucket`, `app.storage.s3.region`, `app.storage.s3.upload-ttl`

#### [MODIFY] [.env.example](file:///C:/Users/VICTUS/Desktop/Project1/.env.example)
- Remove lines 18–20: `S3_ENABLED`, `S3_BUCKET`, `AWS_REGION`

#### [DELETE] `src/main/java/dev/divyansh/sprintforge/attachment/Attachment.java`
#### [DELETE] `src/main/java/dev/divyansh/sprintforge/attachment/AttachmentController.java`
#### [DELETE] `src/main/java/dev/divyansh/sprintforge/attachment/AttachmentRepository.java`
#### [DELETE] `src/main/java/dev/divyansh/sprintforge/attachment/AttachmentStorage.java`
#### [DELETE] `src/main/java/dev/divyansh/sprintforge/attachment/S3AttachmentStorage.java`
#### [DELETE] `src/main/java/dev/divyansh/sprintforge/attachment/UnavailableAttachmentStorage.java`

#### [NEW] `src/main/resources/db/migration/V6__drop_attachments.sql`
```sql
DROP TABLE IF EXISTS attachment;
DROP INDEX IF EXISTS idx_attachment_work_item;
```

#### [MODIFY] `PostgresMigrationIntegrationTest.java`
- Remove any assertion about the `attachment` table

#### [MODIFY] `docs/architecture.md`, `README.md`
- Remove attachment/S3 section

---

### Step 2 — Remove WebSocket / STOMP realtime

**Why:** WebSockets add complexity (connection management, auth interceptor) with no frontend to consume them. Easier to explain REST-only design.

#### [DELETE] `src/main/java/dev/divyansh/sprintforge/config/WebSocketConfig.java`
#### [DELETE] `src/main/java/dev/divyansh/sprintforge/realtime/ProjectEventPublisher.java`

#### [MODIFY] [pom.xml](file:///C:/Users/VICTUS/Desktop/Project1/pom.xml)
- Remove `<artifactId>spring-boot-starter-websocket</artifactId>` dependency block

#### [MODIFY] [SecurityConfig.java](file:///C:/Users/VICTUS/Desktop/Project1/src/main/java/dev/sreedaya/sprintforge/config/SecurityConfig.java)
- Remove `"/ws/**"` from the `permitAll()` list (line 87)

#### [MODIFY] [ProjectController.java](file:///C:/Users/VICTUS/Desktop/Project1/src/main/java/dev/sreedaya/sprintforge/project/ProjectController.java)
- Remove `ProjectEventPublisher events` field, constructor parameter, and all `events.publish(...)` calls (lines 8, 43, 51, 57, 153, 167)

#### [MODIFY] [SprintService.java](file:///C:/Users/VICTUS/Desktop/Project1/src/main/java/dev/sreedaya/sprintforge/sprint/SprintService.java)
- Remove `ProjectEventPublisher events` field, constructor parameter, and `events.publish(...)` at lines 10, 33, 40, 46, 80, 107

#### [MODIFY] `WorkItemController.java` — remove `events.publish(...)` calls and the `ProjectEventPublisher` constructor param
#### [MODIFY] `WorkItemCommentController.java` — same

#### [MODIFY] [SprintServiceTest.java](file:///C:/Users/VICTUS/Desktop/Project1/src/test/java/dev/sreedaya/sprintforge/sprint/SprintServiceTest.java)
- Remove `mock(ProjectEventPublisher.class)` constructor arg (line 17) since that param is deleted
- Remove the import

#### [MODIFY] `docs/architecture.md`, `README.md` — remove WebSocket section

---

### Step 3 — Remove Prometheus / Grafana / observability; keep Actuator health

**Why:** Grafana + Prometheus double the Docker compose footprint and require a metrics-key security layer. Actuator `/health` is all you need for deployment health checks.

#### [DELETE] `observability/` folder (contains `prometheus.yml`, `grafana/` provisioning)

#### [MODIFY] [compose.yaml](file:///C:/Users/VICTUS/Desktop/Project1/compose.yaml)
- Remove `prometheus` service (lines 37–43)
- Remove `grafana` service (lines 44–55)
- Remove `grafana-data:` volume (line 59)
- Remove `METRICS_KEY: local-prometheus-key` env var from `api` service (line 23)

#### [MODIFY] [pom.xml](file:///C:/Users/VICTUS/Desktop/Project1/pom.xml)
- Remove `<artifactId>micrometer-registry-prometheus</artifactId>` block (lines 112–115)

#### [MODIFY] [application.properties](file:///C:/Users/VICTUS/Desktop/Project1/src/main/resources/application.properties)
- Line 19: change `health,info,metrics,prometheus` → `health,info`
- Remove line 20: `management.prometheus.metrics.export.enabled=true`
- Remove line 23: `management.metrics.distribution.percentiles-histogram.http.server.requests=true`
- Remove line 22: `management.metrics.tags.application=...`
- Remove line 28: `app.metrics.key=...`

#### [MODIFY] [SecurityConfig.java](file:///C:/Users/VICTUS/Desktop/Project1/src/main/java/dev/sreedaya/sprintforge/config/SecurityConfig.java)
- Remove `@Value("${app.metrics.key}") String metricsKey` parameter from `securityFilterChain`
- Remove `.requestMatchers("/actuator/prometheus").access(...)` block
- Remove `constantTimeEquals(...)` and `metricsKeyMatches(...)` private methods
- Remove `java.security.MessageDigest` import

#### [MODIFY] [.env.example](file:///C:/Users/VICTUS/Desktop/Project1/.env.example)
- Remove `METRICS_KEY=...` line (line 6)

#### [MODIFY] [render.yaml](file:///C:/Users/VICTUS/Desktop/Project1/render.yaml)
- Remove `METRICS_KEY: { generateValue: true }` block (lines 24–25)

#### [DELETE] `NotificationOutboxMetrics.java`

#### [MODIFY] [SprintService.java](file:///C:/Users/VICTUS/Desktop/Project1/src/main/java/dev/sreedaya/sprintforge/sprint/SprintService.java)
- Remove `MeterRegistry meterRegistry` constructor param
- Remove `sprintCreated`, `sprintStatusChanged` Counter fields and their `.increment()` calls
- Remove `import io.micrometer.*` lines

#### [MODIFY] `NotificationOutboxProcessor.java`
- Remove counter fields and their `.increment()` calls (keep all email-sending logic)
- Remove `MeterRegistry` constructor param

#### [MODIFY] `NotificationOutboxProcessorTest.java`
- Remove assertions/mocks related to metrics counters

#### [MODIFY] [AuthFlowIntegrationTest.java](file:///C:/Users/VICTUS/Desktop/Project1/src/test/java/dev/sreedaya/sprintforge/AuthFlowIntegrationTest.java)
- Delete the `exposesPrometheusMetricsToAuthenticatedClients()` test method entirely (lines 55–85)

---

### Step 4 — k6: remove stress profile

#### [MODIFY] `performance/k6/sprintforge.js`
- Delete the `stress` export / scenario block

#### [MODIFY] [.github/workflows/performance.yml](file:///C:/Users/VICTUS/Desktop/Project1/.github/workflows/performance.yml)
- Line 11: change `options: [smoke, load, stress]` → `options: [smoke, load]`

#### [MODIFY] `docs/performance.md`
- Remove the stress profile description

---

### Step 5 — Remove SonarCloud, SpotBugs, OWASP; keep Trivy

#### [DELETE] `.github/workflows/sonarcloud.yml`
#### [DELETE] `spotbugs-exclude.xml`
#### [DELETE] `owasp-suppressions.xml`
#### [DELETE] `.github/workflows/dependency-review.yml`

#### [MODIFY] [pom.xml](file:///C:/Users/VICTUS/Desktop/Project1/pom.xml)
- Remove `spotbugs-maven-plugin` plugin block (lines 196–205)
- Remove `dependency-check-maven` plugin block (lines 206–216)
- Remove `<spotbugs.version>` property (line 36)
- Remove `<dependency-check.version>` property (line 37)

#### [MODIFY] [.github/workflows/ci.yml](file:///C:/Users/VICTUS/Desktop/Project1/.github/workflows/ci.yml)
- Remove the `SpotBugs static analysis` step (lines 20–21)
- Remove `security-events: write` permission (no longer needed for SpotBugs; Trivy still uses it — **keep it**)

---

### Step 6 — Email outbox: verify docs only

No Java changes. Confirm that `.env.example`, `docs/architecture.md`, and `README.md` clearly describe:
- Transactional outbox pattern
- `FOR UPDATE SKIP LOCKED`
- Idempotency key
- Exponential backoff
- Dead-letter state
- Admin replay endpoints (`POST /api/v1/admin/outbox/{id}/replay`)

Add missing descriptions if any.

---

### Step 7 — Fix 7 loose points (each backed by a test)

#### 7.1 — Fix `PUT /work-items/{id}` status reset
**File:** `WorkItemController.java` or `WorkItem` update logic  
**Change:** When `status` is absent/null in the request body, keep the existing value instead of defaulting to `BACKLOG`.  
**Test:** New unit/integration test asserting that updating title only does not change status.

#### 7.2 — Fix refresh token error message
**File:** `AuthController.java` (refresh endpoint)  
**Change:** Return `"Refresh token is invalid or expired"` instead of `"Invalid email or password"`.  
**Test:** New assertion in `AuthFlowIntegrationTest` checking the message body.

#### 7.3 — Prod-profile JWT secret guard
**File:** New `ProdSecretGuard.java` or `@EventListener(ApplicationReadyEvent)` in `SecurityConfig`  
**Change:** If active profile contains `prod` and `app.jwt.secret` equals the default value, throw `IllegalStateException` and refuse to start.  
**Test:** New `@SpringBootTest(properties={"spring.profiles.active=prod","app.jwt.secret=change-this..."})` test asserting startup failure.

#### 7.4 — ARCHIVED project write guard
**File:** `ProjectAccessService.java` — add a `requireWritable(Project)` helper that throws `ConflictException("Project is archived")` if `status == ARCHIVED`.  
**Change:** Call it from `SprintController` before creating a sprint, and `WorkItemController` before creating a work item.  
**Test:** New test cases in `ProjectAccessServiceTest`.

#### 7.5 — `GET /api/v1/projects/{id}/members`
**File:** `ProjectController.java` — add a new `@GetMapping("/{id}/members")` endpoint returning list of `{id, email, displayName}`.  
**Test:** New slice test asserting the endpoint returns the correct list.

#### 7.6 — `GET /api/v1/auth/me`
**File:** `AuthController.java` — add a new `@GetMapping("/me")` endpoint returning the authenticated user's profile.  
**Test:** New test asserting the endpoint returns correct user data.

#### 7.7 — Document `app.bootstrap-admin.*`
**File:** `.env.example` and `README.md`  
**Change:** Add `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_NAME` with descriptions.

> **Note on rate limiting (Step 7Q):** The plan includes asking you whether you want simple in-memory login rate limiting (no new dependency, using `ConcurrentHashMap` + timestamps, returns `429 Too Many Requests`). I will ask this before implementing Step 7.

---

### Step 8 — Frontend (React + Vite, plain JavaScript)

#### [NEW] `frontend/` directory
- Vite + React, `.jsx` files, no TypeScript
- `react-router-dom` for routing
- No heavy UI library (plain CSS, AWS Console-inspired)

**Pages:**
| Page | Route |
|------|-------|
| Login / Register | `/login` |
| Projects list | `/projects` |
| Project overview | `/projects/:id` |
| Kanban board | `/projects/:id/board` |
| Sprints | `/projects/:id/sprints` |
| Work-item drawer | inside board |
| Audit log | `/projects/:id/audit` |
| Members | `/projects/:id/members` |
| Admin | `/admin` |

**Structure:** `api/`, `components/`, `pages/`, `context/`  
**Vite dev proxy:** `/api` → `http://localhost:8080`, `/actuator` → same.

#### [MODIFY] [Dockerfile](file:///C:/Users/VICTUS/Desktop/Project1/Dockerfile)
- Multi-stage: `node` stage → `mvn package` stage → final `jre` stage
- Built frontend assets copied to `src/main/resources/static/` before Maven build

#### [MODIFY] `SecurityConfig.java`
- Permit `GET /` and all static asset paths (`/assets/**`, `*.js`, `*.css`, `*.ico`)
- Add SPA fallback: any unmatched `GET` that doesn't start with `/api` or `/actuator` serves `index.html`

---

### Step 9 — Update README.md

- Features list (post-removal)
- Full API endpoint table
- Architecture diagram (Mermaid)
- ER diagram (Mermaid)
- Tech stack table
- Env vars table (from updated `.env.example`)
- Run instructions (Maven, Docker, frontend)
- CI pipeline description
- **Keep** license section + add `"Based on SprintForge by Goureesankar S Nair (MIT License)"`

---

### Step 10 — New `docs/PROJECT_GUIDE.md`

A beginner-friendly guide with:
- What changed (removed/added/why)
- What each technology does
- High-level architecture Mermaid diagram
- Request-flow walkthrough (filter → controller → service → repository → DB)
- Data model (Mermaid ER)
- Auth flow (JWT + refresh rotation)
- Outbox workflow
- CI pipeline explanation
- Frontend structure
- Glossary
- 15 likely interview Q&A

---

## Verification Plan

### Automated Tests (after every Java step)
```bash
# Run from C:\Users\VICTUS\Desktop\Project1
./mvnw clean verify
```
This runs unit tests, integration tests (Testcontainers PostgreSQL), and JaCoCo coverage.

### Per-step checks
| Step | Extra verification |
|------|--------------------|
| 0 | `grep -r "dev.sreedaya" src/` must return nothing |
| 1 | `grep -r "attachment\|S3\|aws" src/` must return nothing (except LICENSE) |
| 2 | `grep -r "WebSocket\|STOMP\|ProjectEventPublisher" src/` must return nothing |
| 3 | `grep -r "prometheus\|MeterRegistry\|metricsKey" src/` must return nothing (except comments/docs) |
| 5 | `grep -r "spotbugs\|sonar\|owasp" pom.xml .github/` must return nothing |
| 7 | New tests added, all pass under `./mvnw test` |
| 8 | `npm run build` in `frontend/`, then `docker compose up`, then manual smoke-test each page |
