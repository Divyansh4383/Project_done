# SprintForge Simplification Task

## Phase 0 — Repo scan and plan
- [x] Scan repo structure and all key source files
- [x] Write implementation_plan.md and get user approval
- [x] Create branch `simplify-and-improve`

## Step 0 — Rename package ✅
- [x] Move source tree from `dev/sreedaya/sprintforge` → `dev/divyansh/sprintforge`
- [x] Update `groupId` in `pom.xml`
- [x] Update all `package` / `import` lines in 51 main + 9 test files
- [x] Update `spotbugs-exclude.xml`
- [x] Run `./mvnw clean compile`, commit

## Step 1 — Remove S3 attachment module
- [ ] Delete `attachment/` package (5 files)
- [ ] Remove AWS S3 dependency + `aws.sdk.version` from `pom.xml`
- [ ] Remove `app.storage.s3.*` lines from `application.properties`
- [ ] Remove `S3_ENABLED`, `S3_BUCKET`, `AWS_REGION` from `.env.example`
- [ ] Add `V6__drop_attachments.sql`
- [ ] Update `PostgresMigrationIntegrationTest` and docs
- [ ] Run `./mvnw clean verify`, commit

## Step 2 — Remove WebSocket/STOMP
- [ ] Delete `config/WebSocketConfig.java`
- [ ] Delete `realtime/ProjectEventPublisher.java`
- [ ] Remove `spring-boot-starter-websocket` from `pom.xml`
- [ ] Remove `/ws/**` from `SecurityConfig`
- [ ] Remove `events.publish(...)` calls + constructor param in `ProjectController`, `SprintService`, `WorkItemController`, `WorkItemCommentController`
- [ ] Fix `SprintServiceTest` (remove mock of `ProjectEventPublisher`)
- [ ] Run `./mvnw clean verify`, commit

## Step 3 — Remove Prometheus/Grafana/observability (keep Actuator health)
- [ ] Delete `observability/` folder
- [ ] Remove `prometheus` + `grafana` services + `grafana-data` volume from `compose.yaml`
- [ ] Remove `METRICS_KEY` env var from `compose.yaml`
- [ ] Remove `micrometer-registry-prometheus` from `pom.xml`
- [ ] Edit `application.properties`: remove prometheus/percentiles-histogram/metrics-tag lines, set exposure to `health,info`
- [ ] Remove `metricsKey` param, `actuator/prometheus` rule, `constantTimeEquals`, `metricsKeyMatches` from `SecurityConfig`
- [ ] Remove `app.metrics.key` + `METRICS_KEY` from `.env.example` and `render.yaml`
- [ ] Delete `NotificationOutboxMetrics.java`
- [ ] Remove `MeterRegistry` counters from `SprintService`
- [ ] Remove counters from `NotificationOutboxProcessor`, adjust `NotificationOutboxProcessorTest`
- [ ] Remove Prometheus test from `AuthFlowIntegrationTest`
- [ ] Run `./mvnw clean verify`, commit

## Step 4 — k6: remove stress profile
- [ ] Remove `stress` export from `performance/k6/sprintforge.js`
- [ ] Change `options: [smoke, load, stress]` → `[smoke, load]` in `performance.yml`
- [ ] Update `docs/performance.md`
- [ ] Commit

## Step 5 — Remove SonarCloud, SpotBugs, OWASP; keep Trivy
- [ ] Delete `.github/workflows/sonarcloud.yml`
- [ ] Delete `spotbugs-exclude.xml`
- [ ] Delete `owasp-suppressions.xml`
- [ ] Delete `.github/workflows/dependency-review.yml`
- [ ] Remove SpotBugs plugin + `spotbugs.version` from `pom.xml`
- [ ] Remove OWASP plugin + `dependency-check.version` from `pom.xml`
- [ ] Remove SpotBugs step from `ci.yml`
- [ ] Run `./mvnw clean verify`, commit

## Step 6 — Email outbox: verify docs (no functional changes)
- [ ] Check `docs/architecture.md`, `.env.example`, README describe outbox correctly
- [ ] Fix any missing descriptions

## Step 7 — Fix loose points (with tests)
- [ ] Fix `PUT /work-items/{id}` status-reset bug
- [ ] Fix refresh token error message
- [ ] Add prod-profile JWT secret guard
- [ ] Add ARCHIVED project write guard (returns 409)
- [ ] Add `GET /api/v1/projects/{id}/members` endpoint
- [ ] Add `GET /api/v1/auth/me` endpoint
- [ ] Document `app.bootstrap-admin.*` in `.env.example` and README
- [ ] Ask user about in-memory login rate limiting
- [ ] Run `./mvnw clean verify`, commit

## Step 8 — Frontend (React + Vite, JS)
- [ ] Create `frontend/` with Vite + React (JSX, no TS)
- [ ] Build all pages (Login, Projects, Kanban, Sprints, Comments, Audit, Members, Admin)
- [ ] Update `Dockerfile` to multi-stage build
- [ ] Update `SecurityConfig` for static file serving + SPA fallback
- [ ] `npm run build`, `docker compose up` end-to-end check

## Step 9 — Update README.md

## Step 10 — Write docs/PROJECT_GUIDE.md
