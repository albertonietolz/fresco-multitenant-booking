package com.albertonietolozano.fresco.controller;

import com.albertonietolozano.fresco.dto.request.BookingRequest;
import com.albertonietolozano.fresco.dto.request.BookingUpdateRequest;
import com.albertonietolozano.fresco.dto.response.AvailabilityResponse;
import com.albertonietolozano.fresco.dto.response.BookingResponse;
import com.albertonietolozano.fresco.model.Booking;
import com.albertonietolozano.fresco.model.Employee;
import com.albertonietolozano.fresco.model.WorkingHours;
import com.albertonietolozano.fresco.model.enums.BookingStatus;
import com.albertonietolozano.fresco.repository.BookingRepository;
import com.albertonietolozano.fresco.repository.EmployeeRepository;
import com.albertonietolozano.fresco.repository.ServiceRepository;
import com.albertonietolozano.fresco.repository.WorkingHoursRepository;
import com.albertonietolozano.fresco.service.BookingService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final ServiceRepository serviceRepository;

    public BookingController(BookingService bookingService,
                             BookingRepository bookingRepository,
                             EmployeeRepository employeeRepository,
                             WorkingHoursRepository workingHoursRepository,
                             ServiceRepository serviceRepository) {
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
        this.employeeRepository = employeeRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.serviceRepository = serviceRepository;
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAll() {
        return ResponseEntity.ok(bookingService.getAllByTenant());
    }

    @GetMapping("/availability")
    public ResponseEntity<AvailabilityResponse> getAvailability(
            @RequestParam(required = false) Long employeeId,
            @RequestParam Long serviceId,
            @RequestParam LocalDate date) {
        return ResponseEntity.ok(bookingService.getAvailableSlots(employeeId, serviceId, date));
    }

    @GetMapping("/{id}/on-duty")
    public ResponseEntity<List<Map<String, Object>>> getOnDutyEmployees(@PathVariable Long id) {
        Long tenantId = TenantContext.getTenantId();

        Booking booking = bookingRepository.findById(id)
                .filter(b -> b.getTenantId().equals(tenantId))
                .orElse(null);
        if (booking == null) return ResponseEntity.notFound().build();

        LocalTime slotStart = booking.getStartTime();
        int serviceDuration = serviceRepository.findById(booking.getServiceId())
                .map(s -> s.getDuration()).orElse(30);
        LocalTime slotEnd = slotStart.plusMinutes(serviceDuration);

        List<WorkingHours> onDuty = workingHoursRepository
                .findAllByTenantIdAndDayOfWeekAndEmployeeIdIsNotNull(tenantId, booking.getDate().getDayOfWeek())
                .stream()
                .filter(wh -> !slotStart.isBefore(wh.getStartTime()) && !slotEnd.isAfter(wh.getEndTime()))
                .toList();

        Map<Long, String> empNames = employeeRepository.findAllByTenantId(tenantId)
                .stream()
                .collect(Collectors.toMap(Employee::getId, Employee::getName));

        List<Map<String, Object>> result = onDuty.stream()
                .map(wh -> Map.<String, Object>of(
                        "id", wh.getEmployeeId(),
                        "name", empNames.getOrDefault(wh.getEmployeeId(), "Empleado " + wh.getEmployeeId())
                ))
                .distinct()
                .toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<BookingResponse> create(@RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(request, TenantContext.getTenantId()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BookingResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam BookingStatus status) {
        return ResponseEntity.ok(bookingService.updateStatus(id, status));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<BookingResponse> update(
            @PathVariable Long id,
            @RequestBody BookingUpdateRequest request) {
        return ResponseEntity.ok(bookingService.updateBooking(id, request));
    }

    @GetMapping("/week-schedule")
    public ResponseEntity<List<Map<String, Object>>> getWeekSchedule(@RequestParam LocalDate startDate) {
        Long tenantId = TenantContext.getTenantId();
        Map<Long, String> empNames = employeeRepository.findAllByTenantId(tenantId)
                .stream()
                .collect(Collectors.toMap(Employee::getId, Employee::getName));

        List<Booking> weekBookings = bookingRepository
                .findAllByTenantIdAndDateBetween(tenantId, startDate, startDate.plusDays(6))
                .stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .toList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Booking b : weekBookings) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("id", b.getId());
            entry.put("date", b.getDate().toString());
            entry.put("startTime", b.getStartTime() != null ? b.getStartTime().toString().substring(0, 5) : null);
            entry.put("customerName", b.getCustomerName());
            entry.put("serviceId", b.getServiceId());
            entry.put("employeeId", b.getEmployeeId());
            entry.put("employeeName", b.getEmployeeId() != null
                    ? empNames.getOrDefault(b.getEmployeeId(), "Empleado") : "—");
            entry.put("status", b.getStatus().toString());
            result.add(entry);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/day-overview")
    public ResponseEntity<List<Map<String, Object>>> getDayOverview(@RequestParam LocalDate date) {
        Long tenantId = TenantContext.getTenantId();

        List<WorkingHours> schedule = workingHoursRepository
                .findAllByTenantIdAndDayOfWeekAndEmployeeIdIsNotNull(tenantId, date.getDayOfWeek());

        if (schedule.isEmpty()) return ResponseEntity.ok(List.of());

        List<Booking> dayBookings = bookingRepository.findAllByTenantIdAndDate(tenantId, date)
                .stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .toList();

        Map<Long, String> empNames = employeeRepository.findAllByTenantId(tenantId)
                .stream()
                .collect(Collectors.toMap(Employee::getId, Employee::getName));

        Map<Long, List<WorkingHours>> byEmp = schedule.stream()
                .collect(Collectors.groupingBy(WorkingHours::getEmployeeId));

        Map<Long, List<String>> bookedByEmp = dayBookings.stream()
                .filter(b -> b.getEmployeeId() != null)
                .collect(Collectors.groupingBy(
                        Booking::getEmployeeId,
                        Collectors.mapping(b -> b.getStartTime().toString().substring(0, 5), Collectors.toList())
                ));

        List<Map<String, Object>> result = byEmp.entrySet().stream()
                .map(entry -> {
                    Long empId = entry.getKey();
                    LocalTime start = entry.getValue().stream()
                            .map(WorkingHours::getStartTime).min(LocalTime::compareTo).orElse(null);
                    LocalTime end = entry.getValue().stream()
                            .map(WorkingHours::getEndTime).max(LocalTime::compareTo).orElse(null);
                    List<String> booked = bookedByEmp.getOrDefault(empId, List.of());
                    return Map.<String, Object>of(
                            "employeeId", empId,
                            "employeeName", empNames.getOrDefault(empId, "Empleado " + empId),
                            "workStart", start != null ? start.toString().substring(0, 5) : "—",
                            "workEnd", end != null ? end.toString().substring(0, 5) : "—",
                            "bookedCount", booked.size(),
                            "bookedTimes", booked
                    );
                })
                .sorted((a, b) -> ((String) a.get("employeeName")).compareTo((String) b.get("employeeName")))
                .toList();

        return ResponseEntity.ok(result);
    }
}
