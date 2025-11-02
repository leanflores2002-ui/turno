# TurnoPlus Angular Frontend Implementation Plan

## Overview
- Goal: build an Angular SPA in `frontend/` that reproduces and expands the offline mockup UI (`turnos_plus_ui_html_login_registro_perfil_calendario_y_horarios.html`) while integrating with the FastAPI backend.
- Primary user roles: patient, doctor, admin (plus generic user for shared auth flows).

## Backend Reference (FastAPI `/api/v1`)
- **Auth & Users**
  - `POST /users/login`, `POST /doctors/login`, `POST /admins/login` → `LoginRequest` → `*LoginResponse`.
  - CRUD endpoints for `/users`, `/patients`, `/doctors`, `/admins`.
- **Appointments & Availability**
  - `GET /appointments/patients/{patient_id}`
  - `GET /appointments/doctors/{doctor_id}`
  - `POST /appointments` (book), `POST /appointments/{id}/cancel|confirm|complete`.
  - `GET /appointments/doctor/{doctor_id}/availability`
  - `POST /appointments/availability`, `PATCH /appointments/availability/{availability_id}`
- **Medical Records**
  - `GET /medical-records/patients/{patient_id}`
  - `GET /medical-records/doctors/{doctor_id}`
  - `GET /medical-records/{record_id}`, `POST /medical-records`, `PATCH /medical-records/{record_id}`
- **Health Check**: `GET /healthz`
- Missing backend support vs mockup: office management endpoints, doctor calendar toggles, patient lookup by DNI (would need backend extension or temporary stubs).

## Angular Workspace Setup (`frontend/`)
1. `ng new turnoplus --routing --style=scss --strict` (Angular CLI).
2. Install ESLint, Prettier, and optional Tailwind (or SCSS utility partial mirroring mockup classes).
3. Configure environment files with `apiBaseUrl: '/api/v1'` and tokens for health check.
4. Add absolute import paths via `tsconfig` (`@core`, `@shared`, etc.).

## Project Structure
```
frontend/
 └── src/
     ├── app/
     │   ├── core/          # layout, guards, interceptors, auth storage
     │   ├── shared/        # UI atoms, directives, pipes
     │   ├── auth/          # login/register flows
     │   ├── patient/
     │   ├── doctor/
     │   ├── admin/
     │   ├── appointments/  # reusable calendars & booking widgets
     │   └── medical-records/
     └── styles/ (palette & utility SCSS)
```

## Domain Models (TypeScript Interfaces)
- `User`, `UserCreate`, `UserUpdate`
- `Patient`, `PatientCreate`, `PatientUpdate`
- `Doctor`, `DoctorCreate`, `DoctorUpdate`
- `Admin`, `AdminCreate`, `AdminUpdate`
- `LoginRequest`, `UserLoginResponse`, `DoctorLoginResponse`, `AdminLoginResponse`
- `Appointment`, `AppointmentCreate`, `Availability`, `AvailabilityCreate`, `AvailabilityUpdate`
- `MedicalRecord`, `MedicalRecordCreate`, `MedicalRecordUpdate`
- Enum `AppointmentStatus` mirroring backend model.

## Services & API Clients
- `AuthService`: handles multi-role login, token persistence, current user observable, logout.
- `HttpAuthInterceptor`: injects `Authorization: Bearer` header when token present.
- Resource services for `/users`, `/patients`, `/doctors`, `/admins`, `/appointments`, `/medical-records`.
- Shared `HttpErrorHandlerService` to map FastAPI errors to toast messages.

## Feature Modules
- **AuthModule**
  - Routes `/login`, `/register`.
  - Components: role-aware login form, patient registration form.
  - Redirect post-login based on role.
- **PatientModule**
  - `ProfileComponent`: edit personal info (`GET/PUT /patients/{id}`) and display appointment table.
  - `PatientAppointmentsComponent`: list, cancel (`POST /appointments/{id}/cancel`) and confirm bookings.
  - `CalendarComponent`: doctor filter (`GET /doctors`), availability grid (`GET /appointments/doctor/{id}/availability`), booking modal (`POST /appointments` + confirm).
  - `MedicalRecordsComponent`: fetch patient history (`GET /medical-records/patients/{id}`).
- **DoctorModule**
  - `DoctorDashboardComponent`: combines availability management and patient records.
  - Availability calendar toggles via `/appointments/doctor/{id}/availability` plus `POST/PATCH` operations.
  - Record editor to load/save patient records (requires patient search strategy; see gaps).
- **AdminModule**
  - Overview calendar (reuse appointments service).
  - User management table (CRUD via `/users`, `_admin` endpoints).
  - Doctor management (list/create/delete doctors).
  - Office management UI from mockup pending backend support; optionally stub with local state until endpoints exist.

## Routing & Guards
- Lazy routes per feature module: `/auth`, `/patient`, `/doctor`, `/admin`.
- `AuthGuard` ensures authenticated access; `RoleGuard` enforces role-specific modules.
- Root route decides redirect based on stored role; fallback 404 page.

## Styling & UX
- Port color palette, spacing, and component styles from HTML mockup into SCSS partials (`_palette.scss`, `_utilities.scss`).
- Recreate reusable UI elements: `CardComponent`, `ButtonComponent`, `InputComponent`, `ToastComponent`.
- Provide toast/notification service; loading spinner overlay for HTTP calls.
- Handle date formatting (Angular `DatePipe` + custom adapter to maintain backend UTC).

## Testing & Tooling
- Unit tests for services using `HttpClientTestingModule`.
- Component tests for major forms (login, booking flow).
- E2E smoke tests (Cypress or Playwright) covering login → booking → cancellation.
- CI scripts: `npm run lint`, `npm run test`, `npm run build`.

## Next Steps
- [x] Scaffold Angular workspace with CLI and baseline tooling.
- [x] Port shared styles and develop core layout using mockup.
- [x] Implement Auth module end-to-end against backend *(interceptors, guards, storage + auth flow unit tests now in place)*.
- [ ] Build patient workflows (profile, calendar, booking) leveraging existing APIs.
  - [x] Patient profile editor and appointments list with cancel/confirm actions.
  - [x] Availability browser and booking flow connected to `/appointments` APIs.
  - [x] Medical records lectura inicial.
- [ ] Extend backend or adjust UI for offices/patient lookup gaps before completing doctor/admin panels.

## Incremental Delivery Epics
1. **Project Bootstrap & Tooling**  
   - Scaffold Angular workspace, configure linting/formatting, add CI scripts.  
   - Integrate global styling palette and basic layout shell with navigation and toast service.

2. **Authentication Foundation**  
   - Build shared `AuthService`, interceptors, and guards.  
   - Implement multi-role login and patient self-registration flows with backend integration and happy-path tests.

3. **Patient Experience MVP**  
   - Profile view/edit tied to `/patients/{id}`.  
   - Appointments list with cancel/confirm actions and booking calendar wired to availability endpoints.  
   - Medical records read view pulling `/medical-records/patients/{id}`.

4. **Doctor Operations**  
   - Doctor dashboard with availability management (list/create/update).  
   - Medical record editor for patient encounters, including patient lookup strategy.  
   - Tests covering availability toggling and record persistence.

5. **Admin Console & Reporting**  
   - User and doctor management tables with CRUD actions.  
   - Aggregated calendar view leveraging appointments data.  
   - Office management UI pending backend support; coordinate API changes or deliver with feature flag.

6. **Hardening & UX Polish**  
   - Add comprehensive error handling, loading states, role-based routing refinements.  
   - Implement end-to-end tests across roles, accessibility pass, and production build optimizations.

## Progress Tracker
| Epic | Status | Notes |
| --- | --- | --- |
| Project Bootstrap & Tooling | ✅ Completed | Angular CLI project in `frontend/`, ESLint/Prettier wired, CI commands verified with `npm run lint` / `npm run build`. |
| Authentication Foundation | ✅ Completed | AuthService, token interceptor, guards, and auth form specs validated with `npm test`. |
| Patient Experience MVP | 🟡 In progress | Profile editor, booking flow, and medical records view live; doctor calendar integration next. |
| Doctor Operations | ⬜ Not started | Placeholder shell component at `frontend/src/app/doctor/doctor-shell.component.ts`. |
| Admin Console & Reporting | ⬜ Not started | Placeholder shell component at `frontend/src/app/admin/admin-shell.component.ts`. |
| Hardening & UX Polish | ⬜ Not started | To follow once core flows stabilize. |

### Implemented Artifacts (Snapshot)
- Global styling and layout scaffolding: `frontend/src/styles.scss`, `frontend/src/app/app.html`, `frontend/src/app/app.scss`.
- Auth flows and routing: `frontend/src/app/app.routes.ts`, `frontend/src/app/auth/`.
- Core config/services: `frontend/src/app/core/config/api.config.ts`, `frontend/src/app/core/services/auth.service.ts`.
- Patient dashboard foundation: `frontend/src/app/patient/`, `frontend/src/app/core/services/patients.service.ts`, `frontend/src/app/core/services/appointments.service.ts`.
  - Booking flow extension: `frontend/src/app/patient/components/patient-booking/`, `frontend/src/app/core/services/doctors.service.ts`.
  - Medical records view: `frontend/src/app/core/services/medical-records.service.ts`, `frontend/src/app/patient/components/patient-medical-records/`.
