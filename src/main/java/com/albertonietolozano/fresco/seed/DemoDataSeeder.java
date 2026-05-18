package com.albertonietolozano.fresco.seed;

import com.albertonietolozano.fresco.model.*;
import com.albertonietolozano.fresco.model.enums.BookingStatus;
import com.albertonietolozano.fresco.model.enums.Role;
import com.albertonietolozano.fresco.repository.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@org.springframework.stereotype.Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class DemoDataSeeder implements ApplicationRunner {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final ServiceRepository serviceRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(
            TenantRepository tenantRepository,
            UserRepository userRepository,
            EmployeeRepository employeeRepository,
            ServiceRepository serviceRepository,
            WorkingHoursRepository workingHoursRepository,
            BookingRepository bookingRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.serviceRepository = serviceRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private static final Map<String, java.math.BigDecimal> SERVICE_PRICES = Map.of(
            "Sesión de fisioterapia",   new BigDecimal("55.00"),
            "Masaje terapéutico",       new BigDecimal("35.00"),
            "Rehabilitación deportiva", new BigDecimal("65.00"),
            "Valoración inicial",       new BigDecimal("25.00"),
            "Electroterapia",           new BigDecimal("20.00")
    );

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (tenantRepository.existsBySlug("fisiovital")) {
            Long tenantId = tenantRepository.findBySlug("fisiovital").get().getId();

            // Precios de servicios
            serviceRepository.findAllByTenantId(tenantId).forEach(s -> {
                if (s.getPrice() == null && SERVICE_PRICES.containsKey(s.getName())) {
                    s.setPrice(SERVICE_PRICES.get(s.getName()));
                    serviceRepository.save(s);
                }
            });

            // PINs de empleados
            Map<String, String> empPins = Map.of(
                    "María García", "1111",
                    "Carlos Ruiz",  "2222",
                    "Laura Sanz",   "3333"
            );
            employeeRepository.findAllByTenantId(tenantId).forEach(emp -> {
                if (emp.getPin() == null && empPins.containsKey(emp.getName())) {
                    emp.setPin(empPins.get(emp.getName()));
                    emp.setPinHash(passwordEncoder.encode(empPins.get(emp.getName())));
                    employeeRepository.save(emp);
                }
            });

            // Horarios por empleado
            List<DayOfWeek> wd = List.of(
                    DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                    DayOfWeek.THURSDAY, DayOfWeek.FRIDAY);
            employeeRepository.findAllByTenantId(tenantId).forEach(emp -> {
                if (workingHoursRepository.findAllByEmployeeId(emp.getId()).isEmpty()) {
                    for (DayOfWeek day : wd) {
                        workingHoursRepository.save(WorkingHours.builder()
                                .tenantId(tenantId).employeeId(emp.getId())
                                .dayOfWeek(day)
                                .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(14, 0)).build());
                        workingHoursRepository.save(WorkingHours.builder()
                                .tenantId(tenantId).employeeId(emp.getId())
                                .dayOfWeek(day)
                                .startTime(LocalTime.of(16, 0)).endTime(LocalTime.of(20, 0)).build());
                    }
                }
            });

            return;
        }

        // ── Tenant ──────────────────────────────────────────────────────────
        Tenant tenant = tenantRepository.save(Tenant.builder()
                .name("Clínica FisioVital")
                .slug("fisiovital")
                .email("info@fisiovital.es")
                .phone("912 345 678")
                .address("Calle de la Salud, 14 – Madrid")
                .createdAt(LocalDateTime.now())
                .active(true)
                .build());

        // ── Usuario propietario ──────────────────────────────────────────────
        userRepository.save(User.builder()
                .tenantId(tenant.getId())
                .name("Alberto Nieto")
                .email("demo@fresco.app")
                .password(passwordEncoder.encode("demo1234"))
                .role(Role.OWNER)
                .createdAt(LocalDateTime.now())
                .active(true)
                .build());

        // ── Servicios ────────────────────────────────────────────────────────
        Service sesion = serviceRepository.save(Service.builder()
                .tenantId(tenant.getId())
                .name("Sesión de fisioterapia")
                .duration(50).capacity(null).price(new BigDecimal("55.00")).active(true).build());

        Service masaje = serviceRepository.save(Service.builder()
                .tenantId(tenant.getId())
                .name("Masaje terapéutico")
                .duration(30).capacity(null).price(new BigDecimal("35.00")).active(true).build());

        Service rehab = serviceRepository.save(Service.builder()
                .tenantId(tenant.getId())
                .name("Rehabilitación deportiva")
                .duration(60).capacity(null).price(new BigDecimal("65.00")).active(true).build());

        Service valoracion = serviceRepository.save(Service.builder()
                .tenantId(tenant.getId())
                .name("Valoración inicial")
                .duration(30).capacity(null).price(new BigDecimal("25.00")).active(true).build());

        Service electro = serviceRepository.save(Service.builder()
                .tenantId(tenant.getId())
                .name("Electroterapia")
                .duration(20).capacity(3).price(new BigDecimal("20.00")).active(true).build());

        // ── Empleados ────────────────────────────────────────────────────────
        // serviceIds vacío = atiende todos los servicios
        Employee maria = employeeRepository.save(Employee.builder()
                .tenantId(tenant.getId())
                .name("María García")
                .email("maria@fisiovital.es")
                .phone("611 111 111")
                .active(true)
                .pin("1111")
                .pinHash(passwordEncoder.encode("1111"))
                .serviceIds(new ArrayList<>())
                .build());

        Employee carlos = employeeRepository.save(Employee.builder()
                .tenantId(tenant.getId())
                .name("Carlos Ruiz")
                .email("carlos@fisiovital.es")
                .phone("622 222 222")
                .active(true)
                .pin("2222")
                .pinHash(passwordEncoder.encode("2222"))
                .serviceIds(new ArrayList<>(List.of(sesion.getId(), rehab.getId(), valoracion.getId())))
                .build());

        Employee laura = employeeRepository.save(Employee.builder()
                .tenantId(tenant.getId())
                .name("Laura Sanz")
                .email("laura@fisiovital.es")
                .phone("633 333 333")
                .active(true)
                .pin("3333")
                .pinHash(passwordEncoder.encode("3333"))
                .serviceIds(new ArrayList<>(List.of(masaje.getId(), electro.getId(), valoracion.getId())))
                .build());

        // ── Horarios por empleado ────────────────────────────────────────────
        for (Employee emp : List.of(maria, carlos, laura)) {
            for (DayOfWeek day : List.of(
                    DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                    DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)) {
                workingHoursRepository.save(WorkingHours.builder()
                        .tenantId(tenant.getId()).employeeId(emp.getId())
                        .dayOfWeek(day)
                        .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(14, 0)).build());
                workingHoursRepository.save(WorkingHours.builder()
                        .tenantId(tenant.getId()).employeeId(emp.getId())
                        .dayOfWeek(day)
                        .startTime(LocalTime.of(16, 0)).endTime(LocalTime.of(20, 0)).build());
            }
        }

        // ── Horarios del negocio (empleado null = horario general) ───────────
        List<DayOfWeek> weekdays = List.of(
                DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY);

        for (DayOfWeek day : weekdays) {
            workingHoursRepository.save(WorkingHours.builder()
                    .tenantId(tenant.getId()).employeeId(null)
                    .dayOfWeek(day)
                    .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(14, 0))
                    .build());
            workingHoursRepository.save(WorkingHours.builder()
                    .tenantId(tenant.getId()).employeeId(null)
                    .dayOfWeek(day)
                    .startTime(LocalTime.of(16, 0)).endTime(LocalTime.of(20, 0))
                    .build());
        }

        // ── Reservas ─────────────────────────────────────────────────────────
        // Franjas horarias seguras (mayor servicio = 60 min, slots cada hora)
        LocalTime[] morningSlots   = {LocalTime.of(9,0), LocalTime.of(10,0), LocalTime.of(11,0), LocalTime.of(12,0)};
        LocalTime[] afternoonSlots = {LocalTime.of(16,0), LocalTime.of(17,0), LocalTime.of(18,0)};

        // (empleado, servicios compatibles)
        record EmpServices(Employee emp, List<Service> svcs) {}
        List<EmpServices> catalog = List.of(
                new EmpServices(maria,  List.of(sesion, masaje, rehab, valoracion, electro)),
                new EmpServices(carlos, List.of(sesion, rehab, valoracion)),
                new EmpServices(laura,  List.of(masaje, electro, valoracion))
        );

        String[] names = {
            "Ana Martínez", "Luis Fernández", "Carmen López", "José García",
            "Isabel Sánchez", "Pedro Rodríguez", "Elena Gómez", "Miguel Torres",
            "Cristina Díaz", "Alejandro Ruiz", "Sofía Jiménez", "David Herrera",
            "Natalia Moreno", "Raúl Navarro", "Paula Molina", "Sergio Castillo",
            "Marta Iglesias", "Óscar Delgado", "Beatriz Ramos", "Fernando Ortega"
        };
        String[] emails = {
            "ana.m@email.com", "l.fernandez@email.com", "carmen.lopez@email.com", "jose.g@email.com",
            "isabel.s@email.com", "pedro.r@email.com", "elena.g@email.com", "m.torres@email.com",
            "c.diaz@email.com", "alex.ruiz@email.com", "sofia.j@email.com", "d.herrera@email.com",
            "natalia.m@email.com", "raul.n@email.com", "paula.mol@email.com", "sergio.c@email.com",
            "marta.i@email.com", "oscar.d@email.com", "bea.ramos@email.com", "f.ortega@email.com"
        };

        Random rnd = new Random(42);
        LocalDate today = LocalDate.now();
        int custIdx = 0;

        // Pasado: 90 días atrás, solo L-V, ~2/3 de los días, 2–4 reservas/día
        for (int daysBack = 90; daysBack >= 1; daysBack--) {
            LocalDate date = today.minusDays(daysBack);
            if (isWeekend(date)) continue;
            if (rnd.nextInt(3) == 0) continue;

            Set<String> usedSlots = new HashSet<>();
            int numBookings = 2 + rnd.nextInt(3);

            for (int b = 0; b < numBookings; b++) {
                EmpServices es = catalog.get(rnd.nextInt(catalog.size()));
                Service svc    = es.svcs().get(rnd.nextInt(es.svcs().size()));
                LocalTime slot = pickSlot(rnd, morningSlots, afternoonSlots);
                String slotKey = es.emp().getId() + "_" + slot;
                if (usedSlots.contains(slotKey)) continue;
                usedSlots.add(slotKey);

                BookingStatus status = rnd.nextInt(10) < 2 ? BookingStatus.CANCELLED : BookingStatus.CONFIRMED;
                int ci = custIdx++ % names.length;

                bookingRepository.save(Booking.builder()
                        .tenantId(tenant.getId())
                        .employeeId(es.emp().getId())
                        .serviceId(svc.getId())
                        .customerName(names[ci])
                        .customerEmail(emails[ci])
                        .customerPhone("6" + String.format("%08d", rnd.nextInt(100_000_000)))
                        .date(date)
                        .startTime(slot)
                        .status(status)
                        .createdAt(date.atTime(slot).minusDays(rnd.nextInt(7) + 1))
                        .build());
            }
        }

        // Futuro: próximos 14 días, solo L-V, 1–3 reservas/día, estado PENDING
        for (int daysAhead = 1; daysAhead <= 14; daysAhead++) {
            LocalDate date = today.plusDays(daysAhead);
            if (isWeekend(date)) continue;
            if (rnd.nextInt(4) == 0) continue;

            Set<String> usedSlots = new HashSet<>();
            int numBookings = 1 + rnd.nextInt(3);

            for (int b = 0; b < numBookings; b++) {
                EmpServices es = catalog.get(rnd.nextInt(catalog.size()));
                Service svc    = es.svcs().get(rnd.nextInt(es.svcs().size()));
                LocalTime slot = pickSlot(rnd, morningSlots, afternoonSlots);
                String slotKey = es.emp().getId() + "_" + slot;
                if (usedSlots.contains(slotKey)) continue;
                usedSlots.add(slotKey);

                int ci = custIdx++ % names.length;

                bookingRepository.save(Booking.builder()
                        .tenantId(tenant.getId())
                        .employeeId(es.emp().getId())
                        .serviceId(svc.getId())
                        .customerName(names[ci])
                        .customerEmail(emails[ci])
                        .customerPhone("6" + String.format("%08d", rnd.nextInt(100_000_000)))
                        .date(date)
                        .startTime(slot)
                        .status(BookingStatus.PENDING)
                        .createdAt(LocalDateTime.now().minusDays(rnd.nextInt(5) + 1))
                        .build());
            }
        }
    }

    private boolean isWeekend(LocalDate date) {
        return date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY;
    }

    private LocalTime pickSlot(Random rnd, LocalTime[] morning, LocalTime[] afternoon) {
        LocalTime[] pool = rnd.nextBoolean() ? morning : afternoon;
        return pool[rnd.nextInt(pool.length)];
    }
}
