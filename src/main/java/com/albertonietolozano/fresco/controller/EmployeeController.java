package com.albertonietolozano.fresco.controller;

import com.albertonietolozano.fresco.dto.request.EmployeeRequest;
import com.albertonietolozano.fresco.dto.response.EmployeeResponse;
import com.albertonietolozano.fresco.model.EmployeeBlockedDate;
import com.albertonietolozano.fresco.repository.EmployeeBlockedDateRepository;
import com.albertonietolozano.fresco.service.EmployeeService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// Controlador REST para la gestión de empleados del tenant autenticado.
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final EmployeeBlockedDateRepository empBlockedDateRepository;

    public EmployeeController(EmployeeService employeeService,
                              EmployeeBlockedDateRepository empBlockedDateRepository) {
        this.employeeService = employeeService;
        this.empBlockedDateRepository = empBlockedDateRepository;
    }

    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> getAll() {
        return ResponseEntity.ok(employeeService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getById(id));
    }

    @PostMapping
    public ResponseEntity<EmployeeResponse> create(@RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(employeeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponse> update(@PathVariable Long id, @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(employeeService.update(id, request));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<EmployeeResponse> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/blocked-dates")
    public ResponseEntity<List<String>> getBlockedDates(@PathVariable Long id) {
        Long tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(
            empBlockedDateRepository.findAllByTenantIdAndEmployeeId(tenantId, id)
                .stream()
                .map(b -> b.getDate().toString())
                .sorted()
                .toList()
        );
    }

    @PostMapping("/{id}/blocked-dates")
    public ResponseEntity<Void> blockDate(@PathVariable Long id, @RequestParam LocalDate date) {
        Long tenantId = TenantContext.getTenantId();
        if (!empBlockedDateRepository.existsByTenantIdAndEmployeeIdAndDate(tenantId, id, date)) {
            empBlockedDateRepository.save(
                EmployeeBlockedDate.builder()
                    .tenantId(tenantId)
                    .employeeId(id)
                    .date(date)
                    .build()
            );
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/blocked-dates")
    @Transactional
    public ResponseEntity<Void> unblockDate(@PathVariable Long id, @RequestParam LocalDate date) {
        Long tenantId = TenantContext.getTenantId();
        empBlockedDateRepository.deleteByTenantIdAndEmployeeIdAndDate(tenantId, id, date);
        return ResponseEntity.noContent().build();
    }
}
