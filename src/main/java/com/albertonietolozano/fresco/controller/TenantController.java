package com.albertonietolozano.fresco.controller;

import com.albertonietolozano.fresco.dto.request.TenantRequest;
import com.albertonietolozano.fresco.dto.request.WorkingHoursRequest;
import com.albertonietolozano.fresco.dto.response.TenantDocumentResponse;
import com.albertonietolozano.fresco.dto.response.TenantResponse;
import com.albertonietolozano.fresco.dto.response.WorkingHoursResponse;
import com.albertonietolozano.fresco.model.ClosedDate;
import com.albertonietolozano.fresco.model.Tenant;
import com.albertonietolozano.fresco.model.TenantDocument;
import com.albertonietolozano.fresco.repository.ClosedDateRepository;
import com.albertonietolozano.fresco.repository.TenantDocumentRepository;
import com.albertonietolozano.fresco.repository.TenantRepository;
import com.albertonietolozano.fresco.service.WorkingHoursService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tenant")
public class TenantController {

    private final TenantRepository tenantRepository;
    private final WorkingHoursService workingHoursService;
    private final ClosedDateRepository closedDateRepository;
    private final TenantDocumentRepository tenantDocumentRepository;

    public TenantController(
            TenantRepository tenantRepository,
            WorkingHoursService workingHoursService,
            ClosedDateRepository closedDateRepository,
            TenantDocumentRepository tenantDocumentRepository
    ) {
        this.tenantRepository = tenantRepository;
        this.workingHoursService = workingHoursService;
        this.closedDateRepository = closedDateRepository;
        this.tenantDocumentRepository = tenantDocumentRepository;
    }

    @GetMapping
    public ResponseEntity<TenantResponse> get() {
        Tenant tenant = tenantRepository.findById(TenantContext.getTenantId())
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        return ResponseEntity.ok(toResponse(tenant));
    }

    @PutMapping
    public ResponseEntity<TenantResponse> update(@RequestBody TenantRequest request) {
        Tenant tenant = tenantRepository.findById(TenantContext.getTenantId())
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        tenant.setName(request.name());
        tenant.setEmail(request.email());
        tenant.setPhone(request.phone());
        tenant.setAddress(request.address());
        tenant.setMaxCapacity(request.maxCapacity());
        if (request.allowEmployeeChoice() != null) {
            tenant.setAllowEmployeeChoice(request.allowEmployeeChoice());
        }
        return ResponseEntity.ok(toResponse(tenantRepository.save(tenant)));
    }

    @GetMapping("/hours")
    public ResponseEntity<List<WorkingHoursResponse>> getBusinessHours() {
        return ResponseEntity.ok(workingHoursService.getBusinessHours());
    }

    @PutMapping("/hours")
    public ResponseEntity<List<WorkingHoursResponse>> saveBusinessHours(@RequestBody List<WorkingHoursRequest> request) {
        return ResponseEntity.ok(workingHoursService.saveBusinessHours(request));
    }

    // Devuelve todas las fechas marcadas explícitamente como cerradas para este tenant.
    @GetMapping("/closures")
    public ResponseEntity<List<String>> getClosures() {
        Long tenantId = TenantContext.getTenantId();
        List<String> dates = closedDateRepository.findAllByTenantId(tenantId)
                .stream()
                .map(cd -> cd.getDate().toString())
                .toList();
        return ResponseEntity.ok(dates);
    }

    // Marca un conjunto de fechas como cerradas (ignora duplicados por la constraint única).
    @PostMapping("/closures")
    @Transactional
    public ResponseEntity<Void> addClosures(@RequestBody List<String> dates) {
        Long tenantId = TenantContext.getTenantId();
        dates.stream()
                .map(LocalDate::parse)
                .filter(d -> !closedDateRepository.existsByTenantIdAndDate(tenantId, d))
                .map(d -> ClosedDate.builder().tenantId(tenantId).date(d).build())
                .forEach(closedDateRepository::save);
        return ResponseEntity.noContent().build();
    }

    // Reabre fechas que estaban marcadas como cerradas.
    @DeleteMapping("/closures")
    @Transactional
    public ResponseEntity<Void> removeClosures(@RequestBody List<String> dates) {
        Long tenantId = TenantContext.getTenantId();
        List<LocalDate> localDates = dates.stream().map(LocalDate::parse).toList();
        closedDateRepository.deleteByTenantIdAndDateIn(tenantId, localDates);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/documents")
    public ResponseEntity<List<TenantDocumentResponse>> listDocuments() {
        Long tenantId = TenantContext.getTenantId();
        List<TenantDocumentResponse> docs = tenantDocumentRepository
                .findAllByTenantIdOrderByUploadedAtDesc(tenantId)
                .stream()
                .map(this::toDocResponse)
                .toList();
        return ResponseEntity.ok(docs);
    }

    @PostMapping(value = "/documents", consumes = "multipart/form-data")
    public ResponseEntity<List<TenantDocumentResponse>> uploadDocuments(
            @RequestParam("files") MultipartFile[] files
    ) throws IOException {
        Long tenantId = TenantContext.getTenantId();
        List<TenantDocumentResponse> saved = new ArrayList<>();
        for (MultipartFile file : files) {
            String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "documento.pdf";
            TenantDocument doc = TenantDocument.builder()
                    .tenantId(tenantId)
                    .fileName(name)
                    .displayName(name)
                    .content(file.getBytes())
                    .contentType(file.getContentType() != null ? file.getContentType() : "application/pdf")
                    .uploadedAt(LocalDateTime.now())
                    .build();
            saved.add(toDocResponse(tenantDocumentRepository.save(doc)));
        }
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/documents/{docId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long docId) {
        Long tenantId = TenantContext.getTenantId();
        tenantDocumentRepository.findById(docId)
                .filter(d -> d.getTenantId().equals(tenantId))
                .ifPresent(tenantDocumentRepository::delete);
        return ResponseEntity.noContent().build();
    }

    private TenantDocumentResponse toDocResponse(TenantDocument doc) {
        return new TenantDocumentResponse(doc.getId(), doc.getDisplayName(), doc.getFileName(), doc.getUploadedAt());
    }

    private TenantResponse toResponse(Tenant tenant) {
        return new TenantResponse(
                tenant.getId(),
                tenant.getName(),
                tenant.getSlug(),
                tenant.getEmail(),
                tenant.getPhone(),
                tenant.getAddress(),
                tenant.getMaxCapacity(),
                Boolean.TRUE.equals(tenant.getAllowEmployeeChoice())
        );
    }
}
