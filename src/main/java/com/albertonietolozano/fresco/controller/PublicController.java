package com.albertonietolozano.fresco.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.albertonietolozano.fresco.dto.request.BookingRequest;
import com.albertonietolozano.fresco.dto.response.AvailabilityResponse;
import com.albertonietolozano.fresco.dto.response.BookingResponse;
import com.albertonietolozano.fresco.dto.response.EmployeeResponse;
import com.albertonietolozano.fresco.dto.response.ServiceResponse;
import com.albertonietolozano.fresco.dto.response.TenantDocumentResponse;
import com.albertonietolozano.fresco.dto.response.TenantResponse;
import com.albertonietolozano.fresco.model.Tenant;
import com.albertonietolozano.fresco.model.TenantDocument;
import com.albertonietolozano.fresco.repository.TenantDocumentRepository;
import com.albertonietolozano.fresco.repository.TenantRepository;
import com.albertonietolozano.fresco.service.BookingService;
import com.albertonietolozano.fresco.service.EmployeeService;
import com.albertonietolozano.fresco.service.ServiceService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

// Controlador REST público para el portal de reservas del cliente, accesible por slug del negocio.
@RestController
@RequestMapping("/{slug}/booking")
public class PublicController {

    private final TenantRepository tenantRepository;
    private final ServiceService serviceService;
    private final EmployeeService employeeService;
    private final BookingService bookingService;
    private final TenantDocumentRepository tenantDocumentRepository;

    public PublicController(
            TenantRepository tenantRepository,
            ServiceService serviceService,
            EmployeeService employeeService,
            BookingService bookingService,
            TenantDocumentRepository tenantDocumentRepository
    ) {
        this.tenantRepository = tenantRepository;
        this.serviceService = serviceService;
        this.employeeService = employeeService;
        this.bookingService = bookingService;
        this.tenantDocumentRepository = tenantDocumentRepository;
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
            return ResponseEntity.ok(employeeService.getAllByServiceId(serviceId));
        } finally {
            TenantContext.clear();
        }
    }

    @GetMapping("/availability")
    public ResponseEntity<AvailabilityResponse> getAvailability(
            @PathVariable String slug,
            @RequestParam(required = false) Long employeeId,
            @RequestParam Long serviceId,
            @RequestParam LocalDate date
    ) {
        Long tenantId = resolveTenantId(slug);
        TenantContext.setTenantId(tenantId);
        try {
            return ResponseEntity.ok(bookingService.getAvailableSlots(employeeId, serviceId, date));
        } finally {
            TenantContext.clear();
        }
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @PathVariable String slug,
            @RequestBody BookingRequest request
    ) {
        Long tenantId = resolveTenantId(slug);
        TenantContext.setTenantId(tenantId);
        try {
            return ResponseEntity.ok(bookingService.createBooking(request, tenantId));
        } finally {
            TenantContext.clear();
        }
    }

    @GetMapping("/availability/month")
    public ResponseEntity<List<String>> getMonthAvailability(
            @PathVariable String slug,
            @RequestParam(required = false) Long employeeId,
            @RequestParam Long serviceId,
            @RequestParam int year,
            @RequestParam int month
    ) {
        Long tenantId = resolveTenantId(slug);
        TenantContext.setTenantId(tenantId);
        try {
            return ResponseEntity.ok(bookingService.getAvailableDatesForMonth(employeeId, serviceId, year, month));
        } finally {
            TenantContext.clear();
        }
    }

    @GetMapping("/info")
    public ResponseEntity<TenantResponse> getTenantInfo(@PathVariable String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Tenant not found for slug: " + slug));
        return ResponseEntity.ok(new TenantResponse(
                tenant.getId(), tenant.getName(), tenant.getSlug(),
                tenant.getEmail(), tenant.getPhone(), tenant.getAddress(),
                tenant.getMaxCapacity(), Boolean.TRUE.equals(tenant.getAllowEmployeeChoice())
        ));
    }

    @GetMapping("/documents")
    public ResponseEntity<List<TenantDocumentResponse>> listDocuments(@PathVariable String slug) {
        Long tenantId = resolveTenantId(slug);
        List<TenantDocumentResponse> docs = tenantDocumentRepository
                .findAllByTenantIdOrderByUploadedAtDesc(tenantId)
                .stream()
                .map(d -> new TenantDocumentResponse(d.getId(), d.getDisplayName(), d.getFileName(), d.getUploadedAt()))
                .toList();
        return ResponseEntity.ok(docs);
    }

    @GetMapping("/documents/{docId}/file")
    public ResponseEntity<byte[]> getDocumentFile(
            @PathVariable String slug,
            @PathVariable Long docId
    ) {
        Long tenantId = resolveTenantId(slug);
        TenantDocument doc = tenantDocumentRepository.findById(docId)
                .filter(d -> d.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Document not found"));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(doc.getContent());
    }

    // Resuelve el tenantId a partir del slug; lanza excepción si el negocio no existe.
    private Long resolveTenantId(String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Tenant not found for slug: " + slug));
        return tenant.getId();
    }
}
