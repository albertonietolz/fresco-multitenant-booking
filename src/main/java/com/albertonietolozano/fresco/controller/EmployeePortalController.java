package com.albertonietolozano.fresco.controller;

import com.albertonietolozano.fresco.dto.request.BookingRequest;
import com.albertonietolozano.fresco.dto.request.EmployeeLoginRequest;
import com.albertonietolozano.fresco.dto.response.BookingResponse;
import com.albertonietolozano.fresco.dto.response.EmployeeAuthResponse;
import com.albertonietolozano.fresco.dto.response.ScheduleResponse;
import com.albertonietolozano.fresco.model.Booking;
import com.albertonietolozano.fresco.model.BookingFieldValue;
import com.albertonietolozano.fresco.model.CustomField;
import com.albertonietolozano.fresco.model.Employee;
import com.albertonietolozano.fresco.model.EmployeeBlockedDate;
import com.albertonietolozano.fresco.model.Service;
import com.albertonietolozano.fresco.model.Tenant;
import com.albertonietolozano.fresco.model.WorkingHours;
import com.albertonietolozano.fresco.model.enums.BookingStatus;
import com.albertonietolozano.fresco.dto.response.ClientResponse;
import com.albertonietolozano.fresco.model.Client;
import com.albertonietolozano.fresco.repository.BookingFieldValueRepository;
import com.albertonietolozano.fresco.repository.BookingRepository;
import com.albertonietolozano.fresco.repository.ClientRepository;
import com.albertonietolozano.fresco.repository.CustomFieldRepository;
import com.albertonietolozano.fresco.repository.EmployeeBlockedDateRepository;
import com.albertonietolozano.fresco.repository.EmployeeRepository;
import com.albertonietolozano.fresco.repository.ServiceRepository;
import com.albertonietolozano.fresco.repository.TenantRepository;
import com.albertonietolozano.fresco.repository.WorkingHoursRepository;
import com.albertonietolozano.fresco.security.JwtService;
import com.albertonietolozano.fresco.service.BookingService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
public class EmployeePortalController {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final TenantRepository tenantRepository;
    private final EmployeeRepository employeeRepository;
    private final BookingRepository bookingRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final ServiceRepository serviceRepository;
    private final BookingFieldValueRepository bookingFieldValueRepository;
    private final CustomFieldRepository customFieldRepository;
    private final EmployeeBlockedDateRepository empBlockedDateRepository;
    private final BookingService bookingService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final ClientRepository clientRepository;

    public EmployeePortalController(
            TenantRepository tenantRepository,
            EmployeeRepository employeeRepository,
            BookingRepository bookingRepository,
            WorkingHoursRepository workingHoursRepository,
            ServiceRepository serviceRepository,
            BookingFieldValueRepository bookingFieldValueRepository,
            CustomFieldRepository customFieldRepository,
            EmployeeBlockedDateRepository empBlockedDateRepository,
            BookingService bookingService,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            ClientRepository clientRepository
    ) {
        this.tenantRepository = tenantRepository;
        this.employeeRepository = employeeRepository;
        this.bookingRepository = bookingRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.serviceRepository = serviceRepository;
        this.bookingFieldValueRepository = bookingFieldValueRepository;
        this.customFieldRepository = customFieldRepository;
        this.empBlockedDateRepository = empBlockedDateRepository;
        this.bookingService = bookingService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.clientRepository = clientRepository;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Long empId() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        return Long.parseLong(principal.substring(4)); // "emp:123" → 123
    }

    // ── public endpoints ─────────────────────────────────────────────────────

    @GetMapping("/{slug}/employee/staff")
    public ResponseEntity<List<Map<String, Object>>> getStaff(@PathVariable String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        List<Map<String, Object>> staff = employeeRepository
                .findAllByTenantIdAndActiveTrue(tenant.getId())
                .stream()
                .filter(e -> e.getPinHash() != null)
                .map(e -> Map.<String, Object>of("id", e.getId(), "name", e.getName()))
                .toList();

        return ResponseEntity.ok(staff);
    }

    @PostMapping("/{slug}/employee/login")
    public ResponseEntity<EmployeeAuthResponse> login(
            @PathVariable String slug,
            @RequestBody EmployeeLoginRequest request
    ) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        Employee employee = employeeRepository.findById(request.employeeId())
                .filter(e -> e.getTenantId().equals(tenant.getId()) && e.getActive())
                .orElse(null);

        if (employee == null || employee.getPinHash() == null
                || !passwordEncoder.matches(request.pin(), employee.getPinHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = jwtService.generateEmployeeToken(employee.getId(), tenant.getId());
        return ResponseEntity.ok(new EmployeeAuthResponse(token, employee.getId(), employee.getName(), tenant.getId()));
    }

    // ── authenticated employee endpoints ─────────────────────────────────────

    @GetMapping("/emp/schedule")
    public ResponseEntity<ScheduleResponse> getSchedule(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "30") int granularity
    ) {
        final LocalDate effectiveDate = date != null ? date : LocalDate.now();
        final int effectiveGranularity = (granularity == 15 || granularity == 30 || granularity == 60) ? granularity : 30;

        Long tenantId = TenantContext.getTenantId();
        Long loggedEmployeeId = empId();

        DayOfWeek dow = effectiveDate.getDayOfWeek();

        List<WorkingHours> allBusinessHours = workingHoursRepository
                .findAllByTenantIdAndEmployeeIdIsNull(tenantId);

        List<Integer> workingDaysOfWeek = allBusinessHours.stream()
                .map(wh -> wh.getDayOfWeek().getValue())
                .distinct()
                .sorted()
                .toList();

        List<WorkingHours> todayBusinessHours = allBusinessHours.stream()
                .filter(wh -> wh.getDayOfWeek() == dow)
                .toList();

        if (todayBusinessHours.isEmpty()) {
            return ResponseEntity.ok(new ScheduleResponse(
                    effectiveDate.toString(), effectiveGranularity, loggedEmployeeId,
                    List.of(), List.of(), workingDaysOfWeek
            ));
        }

        LocalTime dayStart = todayBusinessHours.stream()
                .map(WorkingHours::getStartTime)
                .min(Comparator.naturalOrder())
                .orElse(LocalTime.of(9, 0));
        LocalTime dayEnd = todayBusinessHours.stream()
                .map(WorkingHours::getEndTime)
                .max(Comparator.naturalOrder())
                .orElse(LocalTime.of(18, 0));

        List<WorkingHours> allEmployeeHours = workingHoursRepository.findAllByTenantId(tenantId)
                .stream()
                .filter(wh -> wh.getEmployeeId() != null)
                .toList();

        Map<Long, List<WorkingHours>> hoursByEmployee = allEmployeeHours.stream()
                .collect(Collectors.groupingBy(WorkingHours::getEmployeeId));

        Set<Long> employeesWithTodayHours = allEmployeeHours.stream()
                .filter(wh -> wh.getDayOfWeek() == dow)
                .map(WorkingHours::getEmployeeId)
                .collect(Collectors.toSet());

        List<Employee> employees = employeeRepository.findAllByTenantIdAndActiveTrue(tenantId)
                .stream()
                .filter(emp -> {
                    boolean hasOwnHours = hoursByEmployee.containsKey(emp.getId());
                    return !hasOwnHours || employeesWithTodayHours.contains(emp.getId());
                })
                .toList();

        List<String> slots = new ArrayList<>();
        LocalTime cursor = dayStart;
        while (!cursor.isAfter(dayEnd.minusMinutes(effectiveGranularity))) {
            slots.add(cursor.format(TIME_FMT));
            cursor = cursor.plusMinutes(effectiveGranularity);
        }

        List<Booking> dayBookings = bookingRepository.findAllByTenantIdAndDate(tenantId, effectiveDate);
        Map<Long, Service> serviceCache = new HashMap<>();

        List<ScheduleResponse.EmployeeSchedule> empSchedules = employees.stream().map(emp -> {
            List<Booking> empBookings = dayBookings.stream()
                    .filter(b -> b.getEmployeeId() == null || b.getEmployeeId().equals(emp.getId()))
                    .toList();

            List<ScheduleResponse.BookingSlot> bookingSlots = empBookings.stream().map(booking -> {
                Service svc = serviceCache.computeIfAbsent(booking.getServiceId(),
                        id -> serviceRepository.findById(id).orElse(null));

                int duration = svc != null ? svc.getDuration() : 60;
                String serviceName = svc != null ? svc.getName() : "Servicio";

                LocalTime start = booking.getStartTime();
                LocalTime end = start.plusMinutes(duration);

                long minutesFromStart = ChronoUnit.MINUTES.between(dayStart, start);
                int startSlotIndex = (int) (minutesFromStart / effectiveGranularity);
                int spanSlots = (int) Math.ceil((double) duration / effectiveGranularity);

                return new ScheduleResponse.BookingSlot(
                        booking.getId(),
                        start.format(TIME_FMT),
                        end.format(TIME_FMT),
                        booking.getCustomerName(),
                        serviceName,
                        duration,
                        startSlotIndex,
                        spanSlots,
                        booking.getStatus().name()
                );
            }).sorted(Comparator.comparing(ScheduleResponse.BookingSlot::startTime)).toList();

            return new ScheduleResponse.EmployeeSchedule(emp.getId(), emp.getName(), bookingSlots);
        }).toList();

        return ResponseEntity.ok(new ScheduleResponse(
                effectiveDate.toString(), effectiveGranularity, loggedEmployeeId, slots, empSchedules, workingDaysOfWeek
        ));
    }

    // Mi semana: reservas del empleado logueado para 7 días desde startDate.
    @GetMapping("/emp/my-week")
    public ResponseEntity<List<Map<String, Object>>> getMyWeek(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate
    ) {
        Long tenantId = TenantContext.getTenantId();
        Long myId = empId();

        Map<Long, Service> svcCache = new HashMap<>();
        List<Map<String, Object>> result = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate day = startDate.plusDays(i);
            List<Booking> dayBookings = bookingRepository.findAllByTenantIdAndDate(tenantId, day)
                    .stream()
                    .filter(b -> myId.equals(b.getEmployeeId()))
                    .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                    .sorted(Comparator.comparing(Booking::getStartTime))
                    .toList();

            List<Map<String, Object>> bookingList = new ArrayList<>();
            for (Booking b : dayBookings) {
                Service svc = svcCache.computeIfAbsent(b.getServiceId(),
                        id -> serviceRepository.findById(id).orElse(null));
                int duration = svc != null ? svc.getDuration() : 60;
                Map<String, Object> m = new HashMap<>();
                m.put("bookingId", b.getId());
                m.put("startTime", b.getStartTime().format(TIME_FMT));
                m.put("endTime", b.getStartTime().plusMinutes(duration).format(TIME_FMT));
                m.put("clientName", b.getCustomerName());
                m.put("serviceName", svc != null ? svc.getName() : "Servicio");
                m.put("status", b.getStatus().name());
                bookingList.add(m);
            }

            result.add(Map.of(
                    "date", day.toString(),
                    "bookings", bookingList
            ));
        }

        return ResponseEntity.ok(result);
    }

    // Servicios activos del tenant filtrados por los servicios del empleado.
    @GetMapping("/emp/services")
    public ResponseEntity<List<Map<String, Object>>> getServices() {
        Long tenantId = TenantContext.getTenantId();
        Long myId = empId();

        Employee me = employeeRepository.findById(myId).orElse(null);
        List<Long> allowedIds = (me != null && me.getServiceIds() != null) ? me.getServiceIds() : List.of();

        List<Map<String, Object>> services = serviceRepository.findAllByTenantId(tenantId)
                .stream()
                .filter(Service::getActive)
                .filter(s -> allowedIds.isEmpty() || allowedIds.contains(s.getId()))
                .map(s -> Map.<String, Object>of(
                        "id", s.getId(),
                        "name", s.getName(),
                        "duration", (Object) s.getDuration(),
                        "price", s.getPrice() != null ? s.getPrice().doubleValue() : 0.0
                ))
                .toList();
        return ResponseEntity.ok(services);
    }

    // Reservas del empleado logueado para una fecha concreta.
    @GetMapping("/emp/my-bookings")
    public ResponseEntity<List<Map<String, Object>>> getMyBookings(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Long tenantId = TenantContext.getTenantId();
        Long myId = empId();

        Map<Long, Service> svcCache = new HashMap<>();
        List<Map<String, Object>> bookingList = new ArrayList<>();

        List<Booking> dayBookings = bookingRepository.findAllByTenantIdAndDate(tenantId, date)
                .stream()
                .filter(b -> myId.equals(b.getEmployeeId()))
                .sorted(Comparator.comparing(Booking::getStartTime))
                .toList();

        for (Booking b : dayBookings) {
            Service svc = svcCache.computeIfAbsent(b.getServiceId(),
                    id -> serviceRepository.findById(id).orElse(null));
            int duration = svc != null ? svc.getDuration() : 60;
            Map<String, Object> m = new HashMap<>();
            m.put("bookingId", b.getId());
            m.put("startTime", b.getStartTime().format(TIME_FMT));
            m.put("endTime", b.getStartTime().plusMinutes(duration).format(TIME_FMT));
            m.put("clientName", b.getCustomerName());
            m.put("serviceName", svc != null ? svc.getName() : "Servicio");
            m.put("status", b.getStatus().name());
            m.put("partySize", b.getPartySize() != null ? b.getPartySize() : 1);
            bookingList.add(m);
        }

        return ResponseEntity.ok(bookingList);
    }

    // Todos los empleados activos con sus reservas para una fecha (solo reservas asignadas explícitamente).
    @GetMapping("/emp/team-day")
    public ResponseEntity<List<Map<String, Object>>> getTeamDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Long tenantId = TenantContext.getTenantId();

        List<Booking> dayBookings = bookingRepository.findAllByTenantIdAndDate(tenantId, date);
        Map<Long, Service> svcCache = new HashMap<>();

        List<Employee> activeEmployees = employeeRepository.findAllByTenantIdAndActiveTrue(tenantId);

        List<Map<String, Object>> result = activeEmployees.stream().map(emp -> {
            List<Booking> empBookings = dayBookings.stream()
                    .filter(b -> emp.getId().equals(b.getEmployeeId()))
                    .sorted(Comparator.comparing(Booking::getStartTime))
                    .toList();

            List<Map<String, Object>> bookingList = new ArrayList<>();
            for (Booking b : empBookings) {
                Service svc = svcCache.computeIfAbsent(b.getServiceId(),
                        id -> serviceRepository.findById(id).orElse(null));
                int duration = svc != null ? svc.getDuration() : 60;
                Map<String, Object> m = new HashMap<>();
                m.put("bookingId", b.getId());
                m.put("startTime", b.getStartTime().format(TIME_FMT));
                m.put("endTime", b.getStartTime().plusMinutes(duration).format(TIME_FMT));
                m.put("clientName", b.getCustomerName());
                m.put("serviceName", svc != null ? svc.getName() : "Servicio");
                m.put("status", b.getStatus().name());
                bookingList.add(m);
            }

            Map<String, Object> empMap = new HashMap<>();
            empMap.put("employeeId", emp.getId());
            empMap.put("employeeName", emp.getName());
            empMap.put("bookings", bookingList);
            return empMap;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // Huecos disponibles para el empleado logueado.
    @GetMapping("/emp/availability")
    public ResponseEntity<List<String>> getAvailability(
            @RequestParam Long serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "1") int partySize
    ) {
        Long myId = empId();
        var response = bookingService.getAvailableSlots(myId, serviceId, date, partySize);
        List<String> slots = response.slots().stream()
                .map(t -> t.toString().substring(0, 5))
                .toList();
        return ResponseEntity.ok(slots);
    }

    // Crear reserva desde el portal del empleado.
    // employeeId es opcional: si se omite o es null se usa auto-asignación (preferido del cliente →
    // defecto del servicio → menos ocupado). Si se envía -1 se fuerza sin empleado asignado.
    @PostMapping("/emp/bookings")
    public ResponseEntity<BookingResponse> createBooking(@RequestBody Map<String, Object> body) {
        Long tenantId = TenantContext.getTenantId();

        Long serviceId = ((Number) body.get("serviceId")).longValue();
        String dateStr = (String) body.get("date");
        String timeStr = (String) body.get("startTime");
        String customerName = (String) body.get("customerName");
        String customerEmail = body.get("customerEmail") instanceof String s && !s.isBlank() ? s : null;
        String customerPhone = body.get("customerPhone") instanceof String s && !s.isBlank() ? s : null;
        String notes = body.get("notes") instanceof String s && !s.isBlank() ? s : null;

        // Si viene employeeId explícito se respeta; si no, se deja null para auto-asignación.
        Long employeeId = body.get("employeeId") instanceof Number n ? n.longValue() : null;
        Integer partySize = body.get("partySize") instanceof Number n ? n.intValue() : 1;

        LocalDate date = LocalDate.parse(dateStr);
        LocalTime startTime = LocalTime.parse(timeStr.length() == 5 ? timeStr + ":00" : timeStr);

        BookingRequest request = new BookingRequest(
                employeeId, serviceId, customerName, customerEmail, customerPhone,
                date, startTime, notes, List.of(), partySize
        );

        BookingResponse created = bookingService.createBooking(request, tenantId);
        return ResponseEntity.ok(created);
    }

    // Detalle completo de una reserva.
    @GetMapping("/emp/bookings/{id}")
    public ResponseEntity<Map<String, Object>> getBookingDetail(@PathVariable Long id) {
        Long tenantId = TenantContext.getTenantId();

        Booking booking = bookingRepository.findById(id)
                .filter(b -> b.getTenantId().equals(tenantId))
                .orElse(null);
        if (booking == null) return ResponseEntity.notFound().build();

        Service svc = serviceRepository.findById(booking.getServiceId()).orElse(null);

        // Campos personalizados con sus valores.
        List<BookingFieldValue> fieldValues = bookingFieldValueRepository.findAllByBookingId(id);
        Map<Long, String> fieldLabels = customFieldRepository
                .findAllByTenantIdAndServiceId(tenantId, booking.getServiceId())
                .stream()
                .collect(Collectors.toMap(CustomField::getId, CustomField::getLabel));

        List<Map<String, Object>> fields = fieldValues.stream()
                .filter(fv -> fieldLabels.containsKey(fv.getCustomFieldId()))
                .map(fv -> Map.<String, Object>of(
                        "label", fieldLabels.get(fv.getCustomFieldId()),
                        "value", fv.getValue() != null ? fv.getValue() : ""
                ))
                .toList();

        // Historial: cuántas veces ha reservado este cliente (por email o nombre si no hay email).
        long historyCount = 0;
        if (booking.getCustomerEmail() != null && !booking.getCustomerEmail().isBlank()) {
            historyCount = bookingRepository.findAllByTenantId(tenantId).stream()
                    .filter(b -> !b.getId().equals(id))
                    .filter(b -> booking.getCustomerEmail().equalsIgnoreCase(b.getCustomerEmail()))
                    .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                    .count();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", booking.getId());
        result.put("customerName", booking.getCustomerName());
        result.put("customerEmail", booking.getCustomerEmail());
        result.put("customerPhone", booking.getCustomerPhone());
        result.put("date", booking.getDate().toString());
        result.put("startTime", booking.getStartTime().format(TIME_FMT));
        result.put("endTime", booking.getStartTime().plusMinutes(svc != null ? svc.getDuration() : 60).format(TIME_FMT));
        result.put("serviceName", svc != null ? svc.getName() : "Servicio");
        result.put("status", booking.getStatus().name());
        result.put("notes", booking.getNotes());
        result.put("fields", fields);
        result.put("previousVisits", historyCount);
        result.put("createdAt", booking.getCreatedAt() != null ? booking.getCreatedAt().toString() : null);
        result.put("partySize", booking.getPartySize() != null ? booking.getPartySize() : 1);

        return ResponseEntity.ok(result);
    }

    // Cambiar estado de una reserva del tenant.
    @PatchMapping("/emp/bookings/{id}/status")
    public ResponseEntity<Void> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam BookingStatus status
    ) {
        Long tenantId = TenantContext.getTenantId();

        Booking booking = bookingRepository.findById(id)
                .filter(b -> b.getTenantId().equals(tenantId))
                .orElse(null);
        if (booking == null) return ResponseEntity.notFound().build();

        booking.setStatus(status);
        bookingRepository.save(booking);
        return ResponseEntity.noContent().build();
    }

    // Fechas bloqueadas del empleado logueado.
    @GetMapping("/emp/blocked-dates")
    public ResponseEntity<List<String>> getBlockedDates() {
        Long tenantId = TenantContext.getTenantId();
        Long myId = empId();
        List<String> dates = empBlockedDateRepository
                .findAllByTenantIdAndEmployeeId(tenantId, myId)
                .stream()
                .map(b -> b.getDate().toString())
                .sorted()
                .toList();
        return ResponseEntity.ok(dates);
    }

    @PostMapping("/emp/blocked-dates")
    public ResponseEntity<Void> addBlockedDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Long tenantId = TenantContext.getTenantId();
        Long myId = empId();
        if (!empBlockedDateRepository.existsByTenantIdAndEmployeeIdAndDate(tenantId, myId, date)) {
            empBlockedDateRepository.save(EmployeeBlockedDate.builder()
                    .tenantId(tenantId).employeeId(myId).date(date).build());
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/emp/blocked-dates")
    public ResponseEntity<Void> removeBlockedDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Long tenantId = TenantContext.getTenantId();
        Long myId = empId();
        empBlockedDateRepository.deleteByTenantIdAndEmployeeIdAndDate(tenantId, myId, date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/emp/clients")
    public ResponseEntity<List<ClientResponse>> getClients() {
        Long tenantId = TenantContext.getTenantId();
        List<ClientResponse> list = clientRepository.findAllByTenantId(tenantId)
                .stream()
                .map(this::clientToResponse)
                .toList();
        return ResponseEntity.ok(list);
    }

    // Buscar cliente por email o teléfono para auto-rellenar el formulario de reserva.
    @GetMapping("/emp/clients/lookup")
    public ResponseEntity<ClientResponse> lookupClient(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone) {
        Long tenantId = TenantContext.getTenantId();
        if (email != null && !email.isBlank()) {
            return clientRepository.findByTenantIdAndEmail(tenantId, email)
                    .map(this::clientToResponse).map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        if (phone != null && !phone.isBlank()) {
            return clientRepository.findByTenantIdAndPhone(tenantId, phone)
                    .map(this::clientToResponse).map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/emp/clients")
    public ResponseEntity<ClientResponse> createClient(@RequestBody Map<String, Object> body) {
        Long tenantId = TenantContext.getTenantId();
        com.albertonietolozano.fresco.model.Client client = com.albertonietolozano.fresco.model.Client.builder()
                .tenantId(tenantId)
                .name(body.get("name") instanceof String s ? s : null)
                .email(body.get("email") instanceof String s && !s.isBlank() ? s : null)
                .phone(body.get("phone") instanceof String s && !s.isBlank() ? s : null)
                .notes(body.get("notes") instanceof String s && !s.isBlank() ? s : null)
                .preferredEmployeeId(body.get("preferredEmployeeId") instanceof Number n ? n.longValue() : null)
                .preferredServiceId(body.get("preferredServiceId") instanceof Number n ? n.longValue() : null)
                .build();
        return ResponseEntity.ok(clientToResponse(clientRepository.save(client)));
    }

    @PutMapping("/emp/clients/{id}")
    public ResponseEntity<ClientResponse> updateClient(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long tenantId = TenantContext.getTenantId();
        com.albertonietolozano.fresco.model.Client client = clientRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElse(null);
        if (client == null) return ResponseEntity.notFound().build();
        if (body.get("name") instanceof String s) client.setName(s);
        if (body.containsKey("email")) client.setEmail(body.get("email") instanceof String s && !s.isBlank() ? s : null);
        if (body.containsKey("phone")) client.setPhone(body.get("phone") instanceof String s && !s.isBlank() ? s : null);
        if (body.containsKey("notes")) client.setNotes(body.get("notes") instanceof String s && !s.isBlank() ? s : null);
        if (body.containsKey("preferredEmployeeId")) client.setPreferredEmployeeId(body.get("preferredEmployeeId") instanceof Number n ? n.longValue() : null);
        if (body.containsKey("preferredServiceId")) client.setPreferredServiceId(body.get("preferredServiceId") instanceof Number n ? n.longValue() : null);
        return ResponseEntity.ok(clientToResponse(clientRepository.save(client)));
    }

    private ClientResponse clientToResponse(com.albertonietolozano.fresco.model.Client c) {
        return new ClientResponse(c.getId(), c.getTenantId(), c.getName(), c.getEmail(),
                c.getPhone(), c.getNotes(), c.getPreferredEmployeeId(), c.getPreferredServiceId());
    }
}
