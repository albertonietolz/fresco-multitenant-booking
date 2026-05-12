package com.albertonietolozano.fresco.controller;

import com.albertonietolozano.fresco.dto.request.BookingRequest;
import com.albertonietolozano.fresco.dto.response.AvailabilityResponse;
import com.albertonietolozano.fresco.dto.response.BookingResponse;
import com.albertonietolozano.fresco.dto.response.EmployeeResponse;
import com.albertonietolozano.fresco.dto.response.ServiceResponse;
import com.albertonietolozano.fresco.model.Tenant;
import com.albertonietolozano.fresco.repository.TenantRepository;
import com.albertonietolozano.fresco.service.BookingService;
import com.albertonietolozano.fresco.service.EmployeeService;
import com.albertonietolozano.fresco.service.ServiceService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// Controlador REST público para el portal de reservas del cliente, accesible por slug del negocio.
@RestController
@RequestMapping("/{slug}/booking")
public class PublicController {

    private final TenantRepository tenantRepository;
    private final ServiceService serviceService;
    private final EmployeeService employeeService;
    private final BookingService bookingService;

    public PublicController(
            TenantRepository tenantRepository,
            ServiceService serviceService,
            EmployeeService employeeService,
            BookingService bookingService
    ) {
        this.tenantRepository = tenantRepository;
        this.serviceService = serviceService;
        this.employeeService = employeeService;
        this.bookingService = bookingService;
    }

    @GetMapping("/services")
    public ResponseEntity<List<ServiceResponse>> getServices(@PathVariable String slug) {
        Long tenantId = resolveTenantId(slug);
        TenantContext.setTenantId(tenantId);
        try {
            return ResponseEntity.ok(serviceService.getAll());
        } finally {
            TenantContext.clear();
        }
    }

    @GetMapping("/employees/{serviceId}")
    public ResponseEntity<List<EmployeeResponse>> getEmployees(
            @PathVariable String slug,
            @PathVariable Long serviceId
    ) {
        Long tenantId = resolveTenantId(slug);
        TenantContext.setTenantId(tenantId);
        try {
            return ResponseEntity.ok(employeeService.getAll());
        } finally {
            TenantContext.clear();
        }
    }

    @GetMapping("/availability")
    public ResponseEntity<AvailabilityResponse> getAvailability(
            @PathVariable String slug,
            @RequestParam Long employeeId,
            @RequestParam Long serviceId,
            @RequestParam LocalDate date
    ) {
        resolveTenantId(slug);
        return ResponseEntity.ok(bookingService.getAvailableSlots(employeeId, serviceId, date));
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @PathVariable String slug,
            @RequestBody BookingRequest request
    ) {
        Long tenantId = resolveTenantId(slug);
        return ResponseEntity.ok(bookingService.createBooking(request, tenantId));
    }

    // Resuelve el tenantId a partir del slug; lanza excepción si el negocio no existe.
    private Long resolveTenantId(String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Tenant not found for slug: " + slug));
        return tenant.getId();
    }
}
