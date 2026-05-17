package com.albertonietolozano.fresco.controller;

import com.albertonietolozano.fresco.dto.request.EmployeeLoginRequest;
import com.albertonietolozano.fresco.dto.response.EmployeeAuthResponse;
import com.albertonietolozano.fresco.dto.response.ScheduleResponse;
import com.albertonietolozano.fresco.model.Booking;
import com.albertonietolozano.fresco.model.Employee;
import com.albertonietolozano.fresco.model.Service;
import com.albertonietolozano.fresco.model.Tenant;
import com.albertonietolozano.fresco.model.WorkingHours;
import com.albertonietolozano.fresco.repository.BookingRepository;
import com.albertonietolozano.fresco.repository.EmployeeRepository;
import com.albertonietolozano.fresco.repository.ServiceRepository;
import com.albertonietolozano.fresco.repository.TenantRepository;
import com.albertonietolozano.fresco.repository.WorkingHoursRepository;
import com.albertonietolozano.fresco.security.JwtService;
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
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public EmployeePortalController(
            TenantRepository tenantRepository,
            EmployeeRepository employeeRepository,
            BookingRepository bookingRepository,
            WorkingHoursRepository workingHoursRepository,
            ServiceRepository serviceRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder
    ) {
        this.tenantRepository = tenantRepository;
        this.employeeRepository = employeeRepository;
        this.bookingRepository = bookingRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.serviceRepository = serviceRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

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

    @GetMapping("/emp/schedule")
    public ResponseEntity<ScheduleResponse> getSchedule(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "30") int granularity
    ) {
        final LocalDate effectiveDate = date != null ? date : LocalDate.now();
        final int effectiveGranularity = (granularity == 15 || granularity == 30 || granularity == 60) ? granularity : 30;

        Long tenantId = TenantContext.getTenantId();
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Long loggedEmployeeId = Long.parseLong(principal.substring(4));

        DayOfWeek dow = effectiveDate.getDayOfWeek();

        // Horario de negocio (employeeId IS NULL).
        List<WorkingHours> allBusinessHours = workingHoursRepository
                .findAllByTenantIdAndEmployeeIdIsNull(tenantId);

        // Días laborables del negocio para el frontend (navegación inteligente).
        List<Integer> workingDaysOfWeek = allBusinessHours.stream()
                .map(wh -> wh.getDayOfWeek().getValue())
                .distinct()
                .sorted()
                .toList();

        // Si no hay horario configurado para hoy, devolver respuesta vacía.
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

        // Horarios específicos de empleados para este tenant.
        List<WorkingHours> allEmployeeHours = workingHoursRepository.findAllByTenantId(tenantId)
                .stream()
                .filter(wh -> wh.getEmployeeId() != null)
                .toList();

        // Empleados agrupados por si tienen horas propias configuradas.
        Map<Long, List<WorkingHours>> hoursByEmployee = allEmployeeHours.stream()
                .collect(Collectors.groupingBy(WorkingHours::getEmployeeId));

        // Empleados que trabajan hoy: los que tienen horas para este día, o los que no tienen horas propias en absoluto.
        Set<Long> employeesWithTodayHours = allEmployeeHours.stream()
                .filter(wh -> wh.getDayOfWeek() == dow)
                .map(WorkingHours::getEmployeeId)
                .collect(Collectors.toSet());

        List<Employee> employees = employeeRepository.findAllByTenantIdAndActiveTrue(tenantId)
                .stream()
                .filter(emp -> {
                    boolean hasOwnHours = hoursByEmployee.containsKey(emp.getId());
                    // Sin horas propias → sigue el calendario del negocio (trabaja hoy).
                    // Con horas propias → solo si tiene horas para este día concreto.
                    return !hasOwnHours || employeesWithTodayHours.contains(emp.getId());
                })
                .toList();

        // Franjas horarias del día.
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
                    .filter(b -> b.getEmployeeId().equals(emp.getId()))
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
}
