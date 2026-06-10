# Fresco

![Java](https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0.4-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
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

| Layer          | Technology                      |
| -------------- | ------------------------------- |
| Language       | Java 21                         |
| Backend        | Spring Boot 4.0.4               |
| Security       | Spring Security + JJWT 0.12.6   |
| Persistence    | Spring Data JPA + Hibernate     |
| Database       | PostgreSQL 16                   |
| Build tool     | Maven 3.9                       |
| Web frontend   | React 19 + Vite 8               |
| Web routing    | React Router v7                 |
| Mobile app     | Flutter 3.x (web, Android, iOS) |
| Mobile routing | go_router 14.x                  |
| Boilerplate    | Lombok                          |
| Containers     | Docker / Docker Compose         |

---

## Data model

| Entity               | Table                   | Description                                        |
| -------------------- | ----------------------- | -------------------------------------------------- |
| `Tenant`             | `tenants`               | A registered business on the platform              |
| `User`               | `users`                 | An admin user belonging to a tenant                |
| `Service`            | `services`              | A bookable service offered by a tenant             |
| `Employee`           | `employees`             | A staff member of a tenant                         |
| `WorkingHours`       | `working_hours`         | Weekly schedule — business-level or per employee   |
| `EmployeeBlockedDate`| `employee_blocked_dates`| A date range blocked by an employee (leave, vacation) |
| `Booking`            | `bookings`              | A customer appointment for a service               |
| `Client`             | `clients`               | A customer profile with contact details            |
| `ClosedDate`         | `closed_dates`          | An exceptional closure date for a tenant           |
| `CustomField`        | `custom_fields`         | An extra field defined by a tenant for a service   |
| `CustomFieldOption`  | `custom_field_options`  | A selectable option for a dropdown custom field    |
| `BookingFieldValue`  | `booking_field_values`  | The value of a custom field for a specific booking |
| `TenantDocument`     | `tenant_documents`      | A file uploaded by a tenant (consent forms, info)  |

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

Admin tokens expire after 24 hours. Employee tokens (issued by `/{slug}/employee/login`) expire after 10 hours.

---

### Tenant — protected

| Method   | Path                          | Description                              |
| -------- | ----------------------------- | ---------------------------------------- |
| `GET`    | `/api/tenant`                 | Get the current tenant's profile         |
| `PUT`    | `/api/tenant`                 | Update name, contact details, capacity   |
| `GET`    | `/api/tenant/hours`           | Get the business opening hours           |
| `PUT`    | `/api/tenant/hours`           | Replace the full weekly schedule         |
| `GET`    | `/api/tenant/closures`        | List exceptional closure dates           |
| `POST`   | `/api/tenant/closures`        | Mark dates as closed                     |
| `DELETE` | `/api/tenant/closures`        | Re-open previously closed dates          |
| `GET`    | `/api/tenant/documents`       | List uploaded documents                  |
| `POST`   | `/api/tenant/documents`       | Upload a document (multipart/form-data)  |
| `DELETE` | `/api/tenant/documents/{id}`  | Delete a document                        |

---

### Services — protected

| Method   | Path                          | Description                              |
| -------- | ----------------------------- | ---------------------------------------- |
| `GET`    | `/api/services`               | List all services (active and inactive)  |
| `GET`    | `/api/services/{id}`          | Get a specific service                   |
| `POST`   | `/api/services`               | Create a new service                     |
| `PUT`    | `/api/services/{id}`          | Update an existing service               |
| `PATCH`  | `/api/services/{id}/active`   | Activate or deactivate a service         |
| `DELETE` | `/api/services/{id}`          | Soft-delete a service                    |

Services support three scheduling modes: **sequential** (individual appointments), **split** (active chair time differs from total slot duration), and **group** (capacity limit per slot, or unlimited). The `schedulingMode` field further restricts availability to `ANY` day, `WEEKDAYS` only, or a set of `SPECIFIC` dates.

### Custom fields — protected

| Method   | Path                               | Description                                    |
| -------- | ---------------------------------- | ---------------------------------------------- |
| `GET`    | `/api/services/{serviceId}/fields` | List custom fields defined for a service       |
| `POST`   | `/api/services/{serviceId}/fields` | Add a custom field to a service                |
| `DELETE` | `/api/fields/{id}`                 | Delete a custom field                          |
| `PUT`    | `/api/fields/{id}/options`         | Replace the options of a dropdown field        |

Custom fields are collected from the customer during the public booking flow and stored per booking in `booking_field_values`.

---

### Employees — protected

| Method   | Path                               | Description                              |
| -------- | ---------------------------------- | ---------------------------------------- |
| `GET`    | `/api/employees`                   | List all active employees                |
| `GET`    | `/api/employees/{id}`              | Get a specific employee                  |
| `POST`   | `/api/employees`                   | Create a new employee                    |
| `PUT`    | `/api/employees/{id}`              | Update an existing employee              |
| `PATCH`  | `/api/employees/{id}/active`       | Activate or deactivate an employee       |
| `DELETE` | `/api/employees/{id}`              | Soft-delete an employee                  |
| `GET`    | `/api/employees/{id}/working-hours`| Get the employee's weekly schedule       |
| `PUT`    | `/api/employees/{id}/working-hours`| Replace the employee's weekly schedule   |
| `GET`    | `/api/employees/{id}/blocked-dates`| List blocked date ranges for an employee |
| `POST`   | `/api/employees/{id}/blocked-dates`| Add a blocked date range                 |
| `DELETE` | `/api/employees/{id}/blocked-dates`| Remove a blocked date range              |

Each employee can be restricted to a subset of services and assigned a numeric PIN to access the employee portal. The plaintext PIN is stored for owner visibility; a BCrypt hash (`pinHash`) is used for authentication.

---

### Bookings — protected

| Method  | Path                             | Description                               |
| ------- | -------------------------------- | ----------------------------------------- |
| `GET`   | `/api/bookings`                  | List all bookings for the tenant          |
| `POST`  | `/api/bookings`                  | Create a booking from the admin panel     |
| `PATCH` | `/api/bookings/{id}/status`      | Change booking status                     |
| `PATCH` | `/api/bookings/{id}`             | Update booking details                    |
| `GET`   | `/api/bookings/availability`     | Get available slots (admin view)          |
| `GET`   | `/api/bookings/{id}/on-duty`     | Get the employee on duty for a slot       |
| `GET`   | `/api/bookings/week-schedule`    | Weekly agenda view                        |
| `GET`   | `/api/bookings/day-overview`     | Day overview for the admin dashboard      |

---

### Clients — protected

| Method   | Path                    | Description                              |
| -------- | ----------------------- | ---------------------------------------- |
| `GET`    | `/api/clients`          | List all clients                         |
| `POST`   | `/api/clients`          | Create a client                          |
| `PUT`    | `/api/clients/{id}`     | Update a client                          |
| `DELETE` | `/api/clients/{id}`     | Delete a client                          |
| `GET`    | `/api/clients/search`   | Search clients by name or contact        |

---

### Employee portal — semi-public

The employee portal has two layers: a public login step and a set of protected endpoints accessible with the employee JWT.

#### Public

| Method | Path                     | Description                                 |
| ------ | ------------------------ | ------------------------------------------- |
| `GET`  | `/{slug}/employee/staff` | List employees with a PIN set               |
| `POST` | `/{slug}/employee/login` | Authenticate with PIN, returns employee JWT |

#### Protected (`/emp/*`)

| Method   | Path                         | Description                                    |
| -------- | ---------------------------- | ---------------------------------------------- |
| `GET`    | `/emp/schedule`              | Daily agenda for the authenticated employee    |
| `GET`    | `/emp/my-week`               | Weekly agenda view                             |
| `GET`    | `/emp/my-bookings`           | Upcoming bookings assigned to the employee     |
| `GET`    | `/emp/team-day`              | Full team schedule for a given date            |
| `GET`    | `/emp/services`              | Services assigned to the employee              |
| `GET`    | `/emp/availability`          | Available slots for the employee               |
| `POST`   | `/emp/bookings`              | Create a booking from the employee portal      |
| `GET`    | `/emp/bookings/{id}`         | Get booking detail                             |
| `PATCH`  | `/emp/bookings/{id}/status`  | Update booking status                          |
| `GET`    | `/emp/blocked-dates`         | List the employee's blocked date ranges        |
| `POST`   | `/emp/blocked-dates`         | Add a blocked date range                       |
| `DELETE` | `/emp/blocked-dates`         | Remove a blocked date range                    |
| `GET`    | `/emp/clients`               | List clients visible to the employee           |
| `GET`    | `/emp/clients/lookup`        | Look up a client by phone or email             |
| `POST`   | `/emp/clients`               | Create a client                                |
| `PUT`    | `/emp/clients/{id}`          | Update a client                                |

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
| `GET`  | `/cancel-info`                | Get booking details by cancel token             |
| `POST` | `/cancel`                     | Cancel a booking by cancel token                |
| `GET`  | `/documents`                  | List public documents for the tenant            |
| `GET`  | `/documents/{id}/file`        | Download a document file                        |

Availability takes closed dates and global venue capacity into account. If the business has disabled employee selection, the client skips that step and the system assigns a professional automatically. The cancel token is unique per booking and is delivered to the customer in the confirmation email, allowing cancellation without an account.

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
  -e POSTGRES_PASSWORD=your_password \
  -p 5433:5432 \
  -d postgres:16
```

Or use the included Compose file, which also starts the app:

```bash
docker compose up
```

### Environment variables

Copy `.env.example` to `.env` and fill in the real values before starting the application:

```bash
cp .env.example .env
```

Open `.env` and set every variable (database credentials, JWT secret, mail account, etc.) before running the backend.

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

| Field           | Value                  |
| --------------- | ---------------------- |
| Email           | `demo@fresco.app`      |
| Password        | `demo1234`             |
| Booking portal  | `/fisiovital/booking`  |
| Employee portal | `/fisiovital/employee` |

The seeder is idempotent — it only runs once and does not overwrite existing data on subsequent restarts.

---

Also available in [Spanish](README.es.md)
