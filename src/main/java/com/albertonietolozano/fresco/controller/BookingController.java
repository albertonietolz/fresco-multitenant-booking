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
import com.albertonietolozano.fresco.repository.WorkingHoursRepository;
import com.albertonietolozano.fresco.service.BookingService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
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

    public BookingController(BookingService bookingService,
                             BookingRepository bookingRepository,
                             EmployeeRepository employeeRepository,
                             WorkingHoursRepository workingHoursRepository) {
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
        this.employeeRepository = employeeRepository;
        this.workingHoursRepository = workingHoursRepository;
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
        LocalTime slotEnd = slotStart.plusMinutes(30);

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
}
