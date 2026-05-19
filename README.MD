# Fresco

![Java](https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=flat-square&logo=flutter&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-3.9-C71A36?style=flat-square&logo=apachemaven&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)

Multi-tenant appointment booking platform for service-based businesses.

---

## Description

Fresco is a full-stack platform that allows service businesses — clinics, physiotherapy centres, beauty salons, barbershops — to manage their services, employees, schedules and customer bookings through a single shared infrastructure. Each business gets its own isolated space, a public booking portal and a private admin dashboard.

The platform ships two client interfaces that share the same backend and database: a **React web app** for the admin dashboard and public portals, and a **Flutter app** (web, Android and iOS) that replicates the full experience — admin panel, public booking portal and employee portal — with all changes reflected in real time across both clients.

The name draws on the technique Michelangelo used to paint the Sistine Chapel ceiling. A fresco is built layer by layer on wet plaster: each layer bonds permanently to the one beneath, and once dry, the whole becomes a single coherent surface. Fresco the platform is built the same way — authentication, multi-tenancy, domain logic and public booking flow are independent layers that compose into a unified whole. Each business that registers gets its own isolated space within that surface, invisible to the others, yet running on the same foundation.

![Sistine Chapel ceiling](https://github.com/user-attachments/assets/5cda1481-5f26-4c1f-ae99-498e444170b1)

---

## Architecture

Fresco follows a **shared-database, shared-schema** multi-tenant architecture. All tenants coexist in the same PostgreSQL database and the same set of tables. Isolation is enforced at the application layer through a `tenant_id` discriminator column present in every domain table.

```
HTTP Request
    |
    v
JwtAuthFilter          -- validates JWT, populates SecurityContext
    |
    v
TenantInterceptor      -- extracts tenantId from token, stores in ThreadLocal
    |
    v
Controller             -- delegates to service layer
    |
    v
Service                -- business logic, reads tenantId from TenantContext
    |
    v
Repository             -- all queries are scoped to the current tenantId
    |
    v
PostgreSQL
```

`TenantContext` wraps a `ThreadLocal<Long>` that holds the active tenant identifier for the duration of each request. Because the web server (Tomcat) processes concurrent requests on separate threads, each request sees only its own tenant without synchronization overhead. The value is cleared after every request in `TenantInterceptor.afterCompletion()` to prevent leaks across thread-pool reuse.

---

## Technology stack

| Layer         | Technology                     |
| ------------- | ------------------------------ |
| Language      | Java 21                        |
| Backend       | Spring Boot 4.0                |
| Security      | Spring Security + JJWT 0.12.6  |
| Persistence   | Spring Data JPA + Hibernate    |
| Database      | PostgreSQL 16                  |
| Build tool    | Maven 3.9                      |
| Web frontend  | React 18 + Vite                |
| Web routing   | React Router v7                |
| Mobile app    | Flutter 3.x (web, Android, iOS)|
| Mobile routing| go_router 14.x                 |
| Boilerplate   | Lombok                         |
| Containers    | Docker / Docker Compose        |

---

## Data model

| Entity              | Table                  | Description                                        |
| ------------------- | ---------------------- | -------------------------------------------------- |
| `Tenant`            | `tenants`              | A registered business on the platform              |
| `User`              | `users`                | An admin user belonging to a tenant                |
| `Service`           | `services`             | A bookable service offered by a tenant             |
| `Employee`          | `employees`            | A staff member of a tenant                         |
| `WorkingHours`      | `working_hours`        | Weekly schedule — business-level or per employee   |
| `Booking`           | `bookings`             | A customer appointment for a service               |
| `ClosedDate`        | `closed_dates`         | An exceptional closure date for a tenant           |
| `CustomField`       | `custom_fields`        | An extra field defined by a tenant for a service   |
| `BookingFieldValue` | `booking_field_values` | The value of a custom field for a specific booking |

All tables except `tenants` contain a `tenant_id` column that links the row to its owner business and is used in every query to enforce data isolation.

---

## API endpoints

### Authentication — public

| Method | Path                 | Description                              |
| ------ | -------------------- | ---------------------------------------- |
| `POST` | `/api/auth/register` | Register a new tenant and its owner user |
| `POST` | `/api/auth/login`    | Authenticate and receive a JWT token     |

Duplicate slugs and emails are validated before saving; the API returns HTTP 400 with a descriptive message instead of a generic server error.

All subsequent requests to protected endpoints must include the token:

```
Authorization: Bearer <token>
```

---

### Tenant — protected

| Method   | Path                    | Description                              |
| -------- | ----------------------- | ---------------------------------------- |
| `GET`    | `/api/tenant`           | Get the current tenant's profile         |
| `PUT`    | `/api/tenant`           | Update name, contact details, capacity   |
| `GET`    | `/api/tenant/hours`     | Get the business opening hours           |
| `PUT`    | `/api/tenant/hours`     | Replace the full weekly schedule         |
| `GET`    | `/api/tenant/closures`  | List exceptional closure dates           |
| `POST`   | `/api/tenant/closures`  | Mark dates as closed                     |
| `DELETE` | `/api/tenant/closures`  | Re-open previously closed dates          |

---

### Services — protected

| Method    | Path                          | Description                              |
| --------- | ----------------------------- | ---------------------------------------- |
| `GET`     | `/api/services`               | List all services (active and inactive)  |
| `POST`    | `/api/services`               | Create a new service                     |
| `PUT`     | `/api/services/{id}`          | Update an existing service               |
| `PATCH`   | `/api/services/{id}/active`   | Activate or deactivate a service         |
| `DELETE`  | `/api/services/{id}`          | Soft-delete a service                    |

Services support three scheduling modes: **sequential** (individual appointments), **split** (active chair time differs from total slot duration), and **group** (capacity limit per slot, or unlimited).

---

### Employees — protected

| Method   | Path                  | Description                              |
| -------- | --------------------- | ---------------------------------------- |
| `GET`    | `/api/employees`      | List all active employees                |
| `POST`   | `/api/employees`      | Create a new employee                    |
| `PUT`    | `/api/employees/{id}` | Update an existing employee              |
| `DELETE` | `/api/employees/{id}` | Soft-delete an employee                  |

Each employee can be restricted to a subset of services and assigned a numeric PIN to access the employee portal.

---

### Bookings — protected

| Method  | Path                           | Description                         |
| ------- | ------------------------------ | ----------------------------------- |
| `GET`   | `/api/bookings`                | List all bookings for the tenant    |
| `PATCH` | `/api/bookings/{id}/status`    | Change booking status               |

---

### Employee portal — semi-public

The employee portal has two layers: a public login step and a protected schedule endpoint.

| Method | Path                        | Description                                      |
| ------ | --------------------------- | ------------------------------------------------ |
| `GET`  | `/{slug}/employee/staff`    | List employees with a PIN set (public)           |
| `POST` | `/{slug}/employee/login`    | Authenticate with PIN, returns employee JWT      |
| `GET`  | `/emp/schedule`             | Get the employee's agenda for a date (protected) |

The employee JWT returned by the login endpoint must be sent as `Authorization: Bearer <token>` for the schedule endpoint.

---

### Public booking — public

All routes are prefixed with `/{slug}/booking` and require no authentication.

| Method | Path                          | Description                                     |
| ------ | ----------------------------- | ----------------------------------------------- |
| `GET`  | `/info`                       | Get tenant name, contact details and settings   |
| `GET`  | `/services`                   | List active services                            |
| `GET`  | `/employees/{serviceId}`      | List employees available for a service          |
| `GET`  | `/availability`               | Get available time slots for a date             |
| `GET`  | `/availability/month`         | Get available dates for a full month            |
| `POST` | (root)                        | Create a booking                                |

Availability takes closed dates and global venue capacity into account. If the business has disabled employee selection, the client skips that step and the system assigns a professional automatically.

---

## Running locally

### Prerequisites

- Java 21 + Maven 3.9
- Node.js 18+
- Flutter SDK 3.x
- PostgreSQL 16 on port `5433` (or Docker)

### Start PostgreSQL with Docker

```bash
docker run --name fresco-db \
  -e POSTGRES_DB=fresco \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1234 \
  -p 5433:5432 \
  -d postgres:16
```

Or use the included Compose file, which also starts the app:

```bash
docker compose up
```

### Backend

```bash
mvn spring-boot:run
```

The application starts on `http://localhost:8080`. The schema is updated automatically on startup (`ddl-auto: update`); no migration scripts are needed.

### Web frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server starts on `http://localhost:5173`.

### Mobile app

```bash
cd mobile
flutter pub get
flutter run -d chrome
```

The Flutter web app starts on a random port (e.g. `http://localhost:XXXXX`). It connects to the same backend at `http://localhost:8080`. On Android emulator, the app automatically resolves the backend at `http://10.0.2.2:8080`.

The public portals are accessible at `/{slug}/booking` and `/{slug}/employee` in both the web and mobile apps. Any booking made through either client is immediately visible in the other.

---

## Demo account

A demo physiotherapy clinic is seeded automatically on first startup:

| Field            | Value                      |
| ---------------- | -------------------------- |
| Email            | `demo@fresco.app`          |
| Password         | `demo1234`                 |
| Booking portal   | `/fisiovital/booking`      |
| Employee portal  | `/fisiovital/employee`     |

The seeder is idempotent — it only runs once and does not overwrite existing data on subsequent restarts.

---

Also available in [Spanish](README.es.md)
