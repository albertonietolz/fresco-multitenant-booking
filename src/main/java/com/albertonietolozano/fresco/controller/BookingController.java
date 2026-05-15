package com.albertonietolozano.fresco.controller;

import com.albertonietolozano.fresco.dto.request.BookingRequest;
import com.albertonietolozano.fresco.dto.response.AvailabilityResponse;
import com.albertonietolozano.fresco.dto.response.BookingResponse;
import com.albertonietolozano.fresco.model.enums.BookingStatus;
import com.albertonietolozano.fresco.service.BookingService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAll() {
        return ResponseEntity.ok(bookingService.getAllByTenant());
    }

    @GetMapping("/availability")
    public ResponseEntity<AvailabilityResponse> getAvailability(
            @RequestParam Long employeeId,
            @RequestParam Long serviceId,
            @RequestParam LocalDate date) {
        return ResponseEntity.ok(bookingService.getAvailableSlots(employeeId, serviceId, date));
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
}
