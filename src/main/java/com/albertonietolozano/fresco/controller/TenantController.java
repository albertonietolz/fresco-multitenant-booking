package com.albertonietolozano.fresco.controller;

import com.albertonietolozano.fresco.dto.request.TenantRequest;
import com.albertonietolozano.fresco.dto.request.WorkingHoursRequest;
import com.albertonietolozano.fresco.dto.response.TenantResponse;
import com.albertonietolozano.fresco.dto.response.WorkingHoursResponse;
import com.albertonietolozano.fresco.model.Tenant;
import com.albertonietolozano.fresco.repository.TenantRepository;
import com.albertonietolozano.fresco.service.WorkingHoursService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tenant")
public class TenantController {

    private final TenantRepository tenantRepository;
    private final WorkingHoursService workingHoursService;

    public TenantController(TenantRepository tenantRepository, WorkingHoursService workingHoursService) {
        this.tenantRepository = tenantRepository;
        this.workingHoursService = workingHoursService;
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

    private TenantResponse toResponse(Tenant tenant) {
        return new TenantResponse(
                tenant.getId(),
                tenant.getName(),
                tenant.getSlug(),
                tenant.getEmail(),
                tenant.getPhone(),
                tenant.getAddress()
        );
    }
}
