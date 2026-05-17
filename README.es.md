# Fresco

![Java](https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-3.9-C71A36?style=flat-square&logo=apachemaven&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)

Plataforma multitenant de reserva de citas para negocios de servicios.

---

## Descripcion

Fresco es una plataforma completa que permite a negocios de servicios — clinicas, centros de fisioterapia, salones de belleza, barberias — gestionar sus servicios, empleados, horarios y reservas de clientes a traves de una unica infraestructura compartida. Cada negocio obtiene su propio espacio aislado, un portal publico de reservas y un panel de administracion privado.

El nombre toma como referencia la tecnica que Miguel Angel utilizo para pintar el techo de la Capilla Sixtina. Un fresco se construye capa a capa sobre el yeso humedo: cada capa se une permanentemente a la anterior y, una vez seca, el conjunto forma una superficie coherente. La plataforma Fresco se construye del mismo modo: autenticacion, multitenancy, logica de dominio y flujo publico de reservas son capas independientes que se componen en un todo unificado. Cada negocio que se registra obtiene su propio espacio aislado dentro de esa superficie, invisible para los demas, pero ejecutandose sobre la misma base.

![Sistine Chapel ceiling](https://github.com/user-attachments/assets/5cda1481-5f26-4c1f-ae99-498e444170b1)

---

## Arquitectura

Fresco sigue una arquitectura multitenant de **base de datos compartida y esquema compartido**. Todos los tenants conviven en la misma base de datos PostgreSQL y en el mismo conjunto de tablas. El aislamiento se aplica en la capa de aplicacion mediante una columna discriminadora `tenant_id` presente en todas las tablas de dominio.

```
Peticion HTTP
    |
    v
JwtAuthFilter          -- valida el JWT y rellena el SecurityContext
    |
    v
TenantInterceptor      -- extrae el tenantId del token y lo guarda en ThreadLocal
    |
    v
Controller             -- delega en la capa de servicio
    |
    v
Service                -- logica de negocio, lee el tenantId de TenantContext
    |
    v
Repository             -- todas las consultas estan filtradas por el tenantId actual
    |
    v
PostgreSQL
```

`TenantContext` envuelve un `ThreadLocal<Long>` que almacena el identificador del tenant activo durante toda la duracion de la peticion. Como el servidor web (Tomcat) procesa peticiones concurrentes en hilos separados, cada peticion ve unicamente su propio tenant sin necesidad de sincronizacion. El valor se elimina tras cada peticion en `TenantInterceptor.afterCompletion()` para evitar fugas entre reutilizaciones del pool de hilos.

---

## Stack tecnologico

| Capa          | Tecnologia                     |
| ------------- | ------------------------------ |
| Lenguaje      | Java 21                        |
| Backend       | Spring Boot 4.0                |
| Seguridad     | Spring Security + JJWT 0.12.6  |
| Persistencia  | Spring Data JPA + Hibernate    |
| Base de datos | PostgreSQL 16                  |
| Build         | Maven 3.9                      |
| Frontend      | React 18 + Vite                |
| Enrutamiento  | React Router v7                |
| Boilerplate   | Lombok                         |
| Contenedores  | Docker / Docker Compose        |

---

## Modelo de datos

| Entidad             | Tabla                  | Descripcion                                                   |
| ------------------- | ---------------------- | ------------------------------------------------------------- |
| `Tenant`            | `tenants`              | Un negocio registrado en la plataforma                        |
| `User`              | `users`                | Un usuario administrador vinculado a un tenant                |
| `Service`           | `services`             | Un servicio reservable ofrecido por un tenant                 |
| `Employee`          | `employees`            | Un empleado de un tenant                                      |
| `WorkingHours`      | `working_hours`        | Horario semanal — a nivel de negocio o por empleado           |
| `Booking`           | `bookings`             | Una cita de un cliente para un servicio                       |
| `ClosedDate`        | `closed_dates`         | Una fecha de cierre excepcional de un tenant                  |
| `CustomField`       | `custom_fields`        | Un campo adicional definido por un tenant para un servicio    |
| `BookingFieldValue` | `booking_field_values` | El valor de un campo personalizado para una reserva concreta  |

Todas las tablas excepto `tenants` contienen una columna `tenant_id` que vincula la fila con su negocio propietario y se utiliza en cada consulta para garantizar el aislamiento de datos.

---

## Endpoints

### Autenticacion — publicos

| Metodo | Ruta                 | Descripcion                                        |
| ------ | -------------------- | -------------------------------------------------- |
| `POST` | `/api/auth/register` | Registra un nuevo tenant y su usuario propietario  |
| `POST` | `/api/auth/login`    | Autentica al usuario y devuelve un token JWT       |

Los slugs y correos duplicados se validan antes de guardar; la API devuelve HTTP 400 con un mensaje descriptivo en lugar de un error generico de servidor.

Todas las peticiones posteriores a endpoints protegidos deben incluir el token:

```
Authorization: Bearer <token>
```

---

### Tenant — protegidos

| Metodo   | Ruta                    | Descripcion                                     |
| -------- | ----------------------- | ----------------------------------------------- |
| `GET`    | `/api/tenant`           | Obtiene el perfil del tenant actual             |
| `PUT`    | `/api/tenant`           | Actualiza nombre, datos de contacto y aforo     |
| `GET`    | `/api/tenant/hours`     | Obtiene el horario de apertura del negocio      |
| `PUT`    | `/api/tenant/hours`     | Reemplaza el horario semanal completo           |
| `GET`    | `/api/tenant/closures`  | Lista las fechas de cierre excepcionales        |
| `POST`   | `/api/tenant/closures`  | Marca fechas como cerradas                      |
| `DELETE` | `/api/tenant/closures`  | Reabre fechas previamente cerradas              |

---

### Servicios — protegidos

| Metodo   | Ruta                          | Descripcion                                     |
| -------- | ----------------------------- | ----------------------------------------------- |
| `GET`    | `/api/services`               | Lista todos los servicios (activos e inactivos) |
| `POST`   | `/api/services`               | Crea un nuevo servicio                          |
| `PUT`    | `/api/services/{id}`          | Actualiza un servicio existente                 |
| `PATCH`  | `/api/services/{id}/active`   | Activa o desactiva un servicio                  |
| `DELETE` | `/api/services/{id}`          | Borra logicamente un servicio                   |

Los servicios soportan tres modos: **secuencial** (citas individuales), **con espera** (tiempo activo del profesional distinto al total del slot) y **grupal** (limite de plazas por franja, o sin limite).

---

### Empleados — protegidos

| Metodo   | Ruta                  | Descripcion                              |
| -------- | --------------------- | ---------------------------------------- |
| `GET`    | `/api/employees`      | Lista todos los empleados activos        |
| `POST`   | `/api/employees`      | Crea un nuevo empleado                   |
| `PUT`    | `/api/employees/{id}` | Actualiza un empleado existente          |
| `DELETE` | `/api/employees/{id}` | Borra logicamente un empleado            |

Cada empleado puede restringirse a un subconjunto de servicios y se le puede asignar un PIN numerico para acceder al portal de empleados.

---

### Reservas — protegidos

| Metodo  | Ruta                        | Descripcion                          |
| ------- | --------------------------- | ------------------------------------ |
| `GET`   | `/api/bookings`             | Lista todas las reservas del tenant  |
| `PATCH` | `/api/bookings/{id}/status` | Cambia el estado de una reserva      |

---

### Portal de empleados — semipublico

| Metodo | Ruta              | Descripcion                                        |
| ------ | ----------------- | -------------------------------------------------- |
| `POST` | `/api/emp/login`  | Autentica a un empleado con su PIN                 |
| `GET`  | `/api/emp/schedule` | Obtiene la agenda del empleado para una fecha    |

---

### Reservas publicas — publicos

Todas las rutas van prefijadas con `/{slug}/booking` y no requieren autenticacion.

| Metodo | Ruta                     | Descripcion                                          |
| ------ | ------------------------ | ---------------------------------------------------- |
| `GET`  | `/info`                  | Datos del negocio, configuracion y ajustes           |
| `GET`  | `/services`              | Lista los servicios activos                          |
| `GET`  | `/employees/{serviceId}` | Lista los empleados disponibles para un servicio     |
| `GET`  | `/availability`          | Franjas horarias disponibles para una fecha          |
| `GET`  | `/availability/month`    | Dias disponibles de un mes completo                  |
| `POST` | (raiz)                   | Crea una reserva                                     |

La disponibilidad tiene en cuenta las fechas de cierre y el aforo maximo del local. Si el negocio tiene desactivada la eleccion de profesional, el cliente omite ese paso y el sistema asigna uno automaticamente.

---

## Arranque en local

### Requisitos previos

- Java 21 + Maven 3.9
- Node.js 18+
- PostgreSQL 16 en el puerto `5433` (o Docker)

### Iniciar PostgreSQL con Docker

```bash
docker run --name fresco-db \
  -e POSTGRES_DB=fresco \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1234 \
  -p 5433:5432 \
  -d postgres:16
```

O usar el fichero Compose incluido, que tambien arranca la aplicacion:

```bash
docker compose up
```

### Backend

```bash
mvn spring-boot:run
```

La aplicacion arranca en `http://localhost:8080`. El esquema se actualiza automaticamente al iniciar (`ddl-auto: update`); no se necesitan scripts de migracion.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El servidor de desarrollo arranca en `http://localhost:5173`.

---

## Cuenta de demostracion

Al arrancar por primera vez se crea automaticamente una clinica de fisioterapia de ejemplo:

| Campo    | Valor                   |
| -------- | ----------------------- |
| Email    | `demo@fresco.app`       |
| Contraseña | `demo1234`            |
| Portal de reservas | `/fisiovital/booking` |

El seeder es idempotente — solo se ejecuta una vez y no sobreescribe datos en reinicios posteriores.

---

Tambien disponible en [ingles](README.MD)
