# Fresco

![Java](https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-3.9-C71A36?style=flat-square&logo=apachemaven&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)

Multi-tenant appointment booking platform for service-based businesses.

---

## Description

Fresco is a backend platform that allows service businesses — hairdressers, clinics, physiotherapy centres, beauty salons — to manage their services, employees, schedules and customer bookings through a single shared infrastructure.

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

| Layer                 | Technology                    |
| --------------------- | ----------------------------- |
| Language              | Java 21                       |
| Framework             | Spring Boot 4.0               |
| Security              | Spring Security + JJWT 0.12.6 |
| Persistence           | Spring Data JPA + Hibernate   |
| Database              | PostgreSQL 16                 |
| Build tool            | Maven 3.9                     |
| Boilerplate reduction | Lombok                        |
| Containerisation      | Docker                        |

---

## Data model

| Entity              | Table                  | Description                                        |
| ------------------- | ---------------------- | -------------------------------------------------- |
| `Tenant`            | `tenants`              | A registered business on the platform              |
| `User`              | `users`                | An admin user belonging to a tenant                |
| `Service`           | `services`             | A bookable service offered by a tenant             |
| `Employee`          | `employees`            | A staff member of a tenant                         |
| `WorkingHours`      | `working_hours`        | Weekly schedule for an employee                    |
| `Booking`           | `bookings`             | A customer appointment for a service               |
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

**Register request body**

```json
{
  "tenantName": "Garcia Hairdresser",
  "tenantSlug": "garcia-hairdresser",
  "tenantEmail": "contact@garcia.com",
  "tenantPhone": "+34 600 000 000",
  "tenantAddress": "Calle Mayor 1, Madrid",
  "userName": "Carlos Garcia",
  "userEmail": "carlos@garcia.com",
  "userPassword": "securepassword"
}
```

**Login request body**

```json
{
  "email": "carlos@garcia.com",
  "password": "securepassword"
}
```

**Auth response**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tenantId": 1,
  "userName": "Carlos Garcia",
  "userEmail": "carlos@garcia.com",
  "role": "OWNER"
}
```

All subsequent requests to protected endpoints must include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

### Services — protected

| Method   | Path                 | Description                                     |
| -------- | -------------------- | ----------------------------------------------- |
| `GET`    | `/api/services`      | List all active services for the current tenant |
| `GET`    | `/api/services/{id}` | Get a service by ID                             |
| `POST`   | `/api/services`      | Create a new service                            |
| `PUT`    | `/api/services/{id}` | Update an existing service                      |
| `DELETE` | `/api/services/{id}` | Soft-delete a service (marks as inactive)       |

**Service request body**

```json
{
  "name": "Haircut",
  "description": "Classic haircut with wash and dry",
  "duration": 45,
  "price": 25.0
}
```

---

### Employees — protected

| Method   | Path                  | Description                                      |
| -------- | --------------------- | ------------------------------------------------ |
| `GET`    | `/api/employees`      | List all active employees for the current tenant |
| `GET`    | `/api/employees/{id}` | Get an employee by ID                            |
| `POST`   | `/api/employees`      | Create a new employee                            |
| `PUT`    | `/api/employees/{id}` | Update an existing employee                      |
| `DELETE` | `/api/employees/{id}` | Soft-delete an employee (marks as inactive)      |

**Employee request body**

```json
{
  "name": "Ana Lopez",
  "email": "ana@garcia.com",
  "phone": "+34 611 000 000",
  "userId": null
}
```

---

### Working hours — protected

| Method | Path                                        | Description                                      |
| ------ | ------------------------------------------- | ------------------------------------------------ |
| `GET`  | `/api/employees/{employeeId}/working-hours` | Get the weekly schedule for an employee          |
| `PUT`  | `/api/employees/{employeeId}/working-hours` | Replace the full weekly schedule for an employee |

The `PUT` endpoint performs a full replacement: all existing schedule entries for the employee are deleted and the submitted list is inserted in a single transaction.

**Working hours request body**

```json
[
  { "dayOfWeek": "MONDAY", "startTime": "09:00", "endTime": "18:00" },
  { "dayOfWeek": "TUESDAY", "startTime": "09:00", "endTime": "18:00" },
  { "dayOfWeek": "WEDNESDAY", "startTime": "09:00", "endTime": "14:00" }
]
```

---

## Running locally

### Prerequisites

- Java 21
- Maven 3.9
- PostgreSQL 16 running on port `5433` with a database named `fresco`
- Alternatively, Docker to run PostgreSQL as a container

### Start PostgreSQL with Docker

```bash
docker run --name fresco-db \
  -e POSTGRES_DB=fresco \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1234 \
  -p 5433:5432 \
  -d postgres:16
```

### Configure the application

Database connection and JWT settings are defined in `src/main/resources/application.yaml`. The defaults match the Docker command above and require no changes for local development.

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/fresco
    username: postgres
    password: 1234

jwt:
  secret: fresco-secret-key-multitenant-booking-platform-2026
  expiration: 86400000
```

### Build and run

```bash
mvn spring-boot:run
```

The application starts on `http://localhost:8080`. The schema is created automatically on startup (`ddl-auto: create-drop`); no migration scripts are needed for local development.

---

Also available in [Spanish](README.es.md)
