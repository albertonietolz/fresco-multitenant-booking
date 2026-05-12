# Fresco

![Java](https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-3.9-C71A36?style=flat-square&logo=apachemaven&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)

Plataforma multitenant de reserva de citas para negocios de servicios.

---

## Descripcion

Fresco es una plataforma backend que permite a negocios de servicios — peluquerias, clinicas, centros de fisioterapia, salones de belleza — gestionar sus servicios, empleados, horarios y reservas de clientes a traves de una unica infraestructura compartida.

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

| Capa | Tecnologia |
|---|---|
| Lenguaje | Java 21 |
| Framework | Spring Boot 4.0 |
| Seguridad | Spring Security + JJWT 0.12.6 |
| Persistencia | Spring Data JPA + Hibernate |
| Base de datos | PostgreSQL 16 |
| Herramienta de construccion | Maven 3.9 |
| Reduccion de boilerplate | Lombok |
| Contenedorizacion | Docker |

---

## Modelo de datos

| Entidad | Tabla | Descripcion |
|---|---|---|
| `Tenant` | `tenants` | Un negocio registrado en la plataforma |
| `User` | `users` | Un usuario administrador vinculado a un tenant |
| `Service` | `services` | Un servicio reservable ofrecido por un tenant |
| `Employee` | `employees` | Un empleado de un tenant |
| `WorkingHours` | `working_hours` | Horario semanal de un empleado |
| `Booking` | `bookings` | Una cita de un cliente para un servicio |
| `CustomField` | `custom_fields` | Un campo adicional definido por un tenant para un servicio |
| `BookingFieldValue` | `booking_field_values` | El valor de un campo personalizado para una reserva concreta |

Todas las tablas excepto `tenants` contienen una columna `tenant_id` que vincula la fila con su negocio propietario y se utiliza en cada consulta para garantizar el aislamiento de datos.

---

## Endpoints disponibles

### Autenticacion — publicos

| Metodo | Ruta | Descripcion |
|---|---|---|
| `POST` | `/api/auth/register` | Registra un nuevo tenant y su usuario propietario |
| `POST` | `/api/auth/login` | Autentica al usuario y devuelve un token JWT |

**Cuerpo de la peticion de registro**

```json
{
  "tenantName": "Peluqueria Garcia",
  "tenantSlug": "peluqueria-garcia",
  "tenantEmail": "contacto@garcia.com",
  "tenantPhone": "+34 600 000 000",
  "tenantAddress": "Calle Mayor 1, Madrid",
  "userName": "Carlos Garcia",
  "userEmail": "carlos@garcia.com",
  "userPassword": "contrasenaSegura"
}
```

**Cuerpo de la peticion de login**

```json
{
  "email": "carlos@garcia.com",
  "password": "contrasenaSegura"
}
```

**Respuesta de autenticacion**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tenantId": 1,
  "userName": "Carlos Garcia",
  "userEmail": "carlos@garcia.com",
  "role": "OWNER"
}
```

Todas las peticiones posteriores a endpoints protegidos deben incluir el token en la cabecera `Authorization`:

```
Authorization: Bearer <token>
```

---

### Servicios — protegidos

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/services` | Lista todos los servicios activos del tenant actual |
| `GET` | `/api/services/{id}` | Obtiene un servicio por ID |
| `POST` | `/api/services` | Crea un nuevo servicio |
| `PUT` | `/api/services/{id}` | Actualiza un servicio existente |
| `DELETE` | `/api/services/{id}` | Borra logicamente un servicio (lo marca como inactivo) |

**Cuerpo de la peticion de servicio**

```json
{
  "name": "Corte de pelo",
  "description": "Corte clasico con lavado y secado",
  "duration": 45,
  "price": 25.00
}
```

---

### Empleados — protegidos

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/employees` | Lista todos los empleados activos del tenant actual |
| `GET` | `/api/employees/{id}` | Obtiene un empleado por ID |
| `POST` | `/api/employees` | Crea un nuevo empleado |
| `PUT` | `/api/employees/{id}` | Actualiza un empleado existente |
| `DELETE` | `/api/employees/{id}` | Borra logicamente un empleado (lo marca como inactivo) |

**Cuerpo de la peticion de empleado**

```json
{
  "name": "Ana Lopez",
  "email": "ana@garcia.com",
  "phone": "+34 611 000 000",
  "userId": null
}
```

---

### Horarios laborales — protegidos

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/employees/{employeeId}/working-hours` | Obtiene el horario semanal de un empleado |
| `PUT` | `/api/employees/{employeeId}/working-hours` | Reemplaza el horario semanal completo de un empleado |

El endpoint `PUT` realiza un reemplazo completo: se eliminan todas las entradas de horario existentes del empleado y se insertan las nuevas en una unica transaccion.

**Cuerpo de la peticion de horarios**

```json
[
  { "dayOfWeek": "MONDAY",    "startTime": "09:00", "endTime": "18:00" },
  { "dayOfWeek": "TUESDAY",   "startTime": "09:00", "endTime": "18:00" },
  { "dayOfWeek": "WEDNESDAY", "startTime": "09:00", "endTime": "14:00" }
]
```

---

## Arranque en local

### Requisitos previos

- Java 21
- Maven 3.9
- PostgreSQL 16 ejecutandose en el puerto `5433` con una base de datos llamada `fresco`
- Alternativamente, Docker para ejecutar PostgreSQL como contenedor

### Iniciar PostgreSQL con Docker

```bash
docker run --name fresco-db \
  -e POSTGRES_DB=fresco \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1234 \
  -p 5433:5432 \
  -d postgres:16
```

### Configurar la aplicacion

La conexion a la base de datos y los ajustes JWT se definen en `src/main/resources/application.yaml`. Los valores por defecto coinciden con el comando Docker anterior y no requieren ningun cambio para el desarrollo local.

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

### Construir y ejecutar

```bash
mvn spring-boot:run
```

La aplicacion arranca en `http://localhost:8080`. El esquema se crea automaticamente al iniciar (`ddl-auto: create-drop`); no se necesitan scripts de migracion para el desarrollo local.

---

Tambien disponible en [ingles](README.MD)
