# MediCare Clinic — Hospital / Clinic Management System

A complete role-based hospital management system.
**Angular 22** SPA · **ASP.NET Core 10** Web API · **SQL Server** · JWT auth · PDF generation.

All 4 roles and 6 functional phases are implemented; deployment (Docker) and CI are wired.

Brand palette: `#32936f · #26a96c · #395e66 · #2bc016 · #387d7a`

---

## What's built

| Role | Features |
|---|---|
| **Patient** | Signup/login · doctor search with **fee schedule** (check-up / follow-up / procedure / operation) · **simple 2-step slot booking** (pick a day → tap a time) · reschedule & cancel · medical history with doctor/date/year filters · **My Reports** (lab results, filterable) · prescription & invoice PDF · billing history · profile |
| **Doctor** | Dashboard (today / upcoming / queue) · appointment detail with status state-machine · **prescription writing → PDF** · **Patient Reports** – record & search lab/imaging/discharge notes (filter by patient, year, date) · live walk-in queue (call-next) · weekly availability & days-off management |
| **Receptionist** | Front-desk dashboard · **Patients directory** · walk-in registration · book on behalf of patients (+ upcoming-bookings table) · multi-doctor queue · **invoicing** with a real payment flow – Cash / Card / Bank transfer / **JazzCash** / **EasyPaisa**, each capturing its own details |
| **Admin** | Clinic overview with charts · staff CRUD with full fee schedule · department CRUD · reports (revenue, trend, doctor performance) · clinic settings & holidays |

Booking uses a plain-language day-strip + time-button picker (no calendar grid); the app
shell has a sticky sidebar that never scrolls with the page, and an off-canvas drawer on
mobile. Server errors (e.g. overlapping availability windows) surface as toasts.

### Non-functional
- 4 role-based route guards, JWT access token + **rotating refresh token in an httpOnly cookie**, silent refresh on reload. The cookie is a **session cookie** by default (browser close = sign out); *"Keep me signed in"* makes it persist for 7 days.
- Slot double-booking prevented by a filtered unique index + serializable transaction (→ HTTP 409)
- Appointment status **state machine** (invalid transitions → 422)
- Reactive Forms + custom validators (phone, CNIC, DOB/age, password strength, time-range)
- Fully responsive (Bootstrap 5 + ng-bootstrap), works down to 360px
- Real-time-ish polling for appointment status and queues
- Clinic-wide holidays feed into slot availability

---

## Architecture

```
┌──────────────────────────────┐        ┌───────────────────────────────────┐
│  Angular 22 SPA (standalone) │  JWT   │  ASP.NET Core 10 Web API          │
│  Bootstrap 5 · NgRx · Signals│ ─────► │  Hospital.Api   controllers / DI   │
│  FullCalendar · jsPDF        │ +cookie│  Hospital.Domain  entities + rules │
│  NgRx: auth / doctors / appts│ refresh│  Hospital.Infrastructure  EF Core  │
│  Signals: doctor/reception/  │        │  Hospital.Tests  xUnit (29)       │
│           admin modules      │        │                                   │
└──────────────────────────────┘        └────────────────┬──────────────────┘
                                                 EF Core 10 │
                                                    ┌───────▼────────┐
                                                    │   SQL Server   │
                                                    └────────────────┘
```

**Domain layer** holds the interview-relevant logic, unit-tested in isolation:
`SlotCalculator` (availability − exceptions − holidays − booked − short-notice),
`AppointmentStateMachine`, and `Invoice` total/tax computation.

---

## Run locally

### Prerequisites
- Node 20+ · .NET 10 SDK · SQL Server (defaults to `.\SQLEXPRESS`, Windows auth —
  edit `server/Hospital.Api/appsettings.Development.json` otherwise)

### Two terminals

```bash
# 1 — API  (creates + seeds the database on first run)
cd server
dotnet tool install --global dotnet-ef        # first time only
dotnet run --project Hospital.Api             # http://localhost:5080 · Swagger at /swagger

# 2 — Frontend
npm install --legacy-peer-deps
npm start                                      # http://localhost:4200  (proxies /api → :5080)
```

### One command (Docker)

```bash
docker compose up --build
# web  → http://localhost:8080   (nginx serves the SPA + proxies /api to the api container)
# api  → http://localhost:5080
# db   → SQL Server 2022 on :1433
```

### Seeded accounts — password `Passw0rd!`

| Role | Email |
|---|---|
| Patient | `ayesha@patient.test`, `bilal@patient.test` |
| Doctor | `sara@doctor.test`, `imran@doctor.test`, `nadia@doctor.test`, … (6) |
| Receptionist | `reception@hospital.test` |
| Admin | `admin@hospital.test` |

---

## Tests & CI

```bash
npm run test:ci          # Vitest — validators, reducers, guard, pipe
cd server && dotnet test # xUnit  — slot calculator, state machine, booking conflict, invoice math (29)
npm run e2e              # Cypress (needs both servers running) — auth/role-routing + booking flow
```

`.github/workflows/ci.yml` runs the frontend build + unit tests, the backend build + tests,
and a Cypress E2E job against a SQL Server service container.

---

## Project layout

```
src/app/
  core/         guards · interceptors · services · models
  store/        NgRx feature stores (auth, doctors, appointments)
  shared/       validators · pipes · components · layout
  features/
    auth/  patient/  doctor/  reception/  admin/

server/
  Hospital.Api/            controllers, auth (JWT + cookie), services, DTOs, Dockerfile
  Hospital.Domain/         entities, enums, scheduling rules, exceptions
  Hospital.Infrastructure/ AppDbContext, EF configs, migrations, seed
  Hospital.Tests/          xUnit

cypress/                   E2E specs
docker-compose.yml         db + api + web
```

---

## Key API endpoints

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/{register,login,refresh,logout}` · `GET /api/auth/me` · `GET /api/me` |
| Doctors | `GET /api/doctors` · `GET /api/doctors/{id}` · `GET /api/doctors/{id}/slots` |
| Appointments | `GET /api/appointments/{mine,:id}` · `POST /api/appointments` · `POST /api/appointments/for/{patientId}` · `PATCH .../{reschedule,cancel,status}` |
| Clinical | `PUT /api/appointments/{id}/prescription` · `GET /api/prescriptions/mine` |
| Queue | `GET /api/queue` · `POST /api/queue` · `PATCH /api/queue/{id}/status` · `POST /api/queue/call-next` |
| Billing | `GET/POST /api/invoices` · `GET /api/invoices/{mine,:id}` · `PATCH .../{pay,void}` |
| Availability | `GET/POST/PUT/DELETE /api/me/availability` · `.../time-off` |
| Admin | `GET/POST/PUT/PATCH /api/admin/{staff,departments}` · `GET /api/admin/reports` |
| Settings | `GET/PUT /api/settings` · `GET/POST/DELETE /api/holidays` |
| Dashboards | `GET /api/dashboard/{doctor,reception}` |

---

## Production notes

- Set `Jwt:SigningKey` to a real 256-bit secret and a strong DB password.
- For a **cross-site HTTPS** deployment (SPA and API on different domains) set
  `Cookie:Secure=true` and `Cookie:SameSite=None`, and list the SPA origin in
  `Cors:AllowedOrigins`. The bundled Docker setup reverse-proxies `/api`, so it runs
  same-origin with `Cookie:Secure=false`.
- `SEED_DATA=true` seeds demo data on a fresh production database; omit it to only migrate.
