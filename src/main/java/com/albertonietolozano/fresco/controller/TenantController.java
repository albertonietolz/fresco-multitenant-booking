package com.albertonietolozano.fresco.controller;

import com.albertonietolozano.fresco.dto.request.TenantRequest;
import com.albertonietolozano.fresco.dto.request.WorkingHoursRequest;
import com.albertonietolozano.fresco.dto.response.TenantResponse;
import com.albertonietolozano.fresco.dto.response.WorkingHoursResponse;
import com.albertonietolozano.fresco.model.ClosedDate;
import com.albertonietolozano.fresco.model.Tenant;
import com.albertonietolozano.fresco.repository.ClosedDateRepository;
import com.albertonietolozano.fresco.repository.TenantRepository;
import com.albertonietolozano.fresco.service.WorkingHoursService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tenant")
public class TenantController {

    private final TenantRepository tenantRepository;
    private final WorkingHoursService workingHoursService;
    private final ClosedDateRepository closedDateRepository;

    public TenantController(
            TenantRepository tenantRepository,
            WorkingHoursService workingHoursService,
            ClosedDateRepository closedDateRepository
    ) {
        this.tenantRepository = tenantRepository;
        this.workingHoursService = workingHoursService;
        this.closedDateRepository = closedDateRepository;
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
        return ResponseEntity.ok().build();
    }

    // Reabre fechas que estaban marcadas como cerradas.
    @DeleteMapping("/closures")
    @Transactional
    public ResponseEntity<Void> removeClosures(@RequestBody List<String> dates) {
        Long tenantId = TenantContext.getTenantId();
        List<LocalDate> localDates = dates.stream().map(LocalDate::parse).toList();
        closedDateRepository.deleteByTenantIdAndDateIn(tenantId, localDates);
        return ResponseEntity.ok().build();
    }

    private TenantResponse toResponse(Tenant tenant) {
        return new TenantResponse(
                tenant.getId(),
                tenant.getName(),
                tenant.getSlug(),
                tenant.getEmail(),
                tenant.getPhone(),
                tenant.getAddress(),
                tenant.getMaxCapacity()
        );
    }
}
