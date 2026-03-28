package com.albertonietolozano.fresco.controller;

import com.albertonietolozano.fresco.dto.request.WorkingHoursRequest;
import com.albertonietolozano.fresco.dto.response.WorkingHoursResponse;
import com.albertonietolozano.fresco.service.WorkingHoursService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Controlador REST para consultar y reemplazar los horarios laborales de un empleado.
@RestController
@RequestMapping("/api/employees/{employeeId}/working-hours")
public class WorkingHoursController {

    private final WorkingHoursService workingHoursService;

    public WorkingHoursController(WorkingHoursService workingHoursService) {
        this.workingHoursService = workingHoursService;
    }

    @GetMapping
    public ResponseEntity<List<WorkingHoursResponse>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(workingHoursService.getByEmployee(employeeId));
    }

    @PutMapping
    public ResponseEntity<List<WorkingHoursResponse>> save(
            @PathVariable Long employeeId,
            @RequestBody List<WorkingHoursRequest> request
    ) {
        return ResponseEntity.ok(workingHoursService.save(employeeId, request));
    }
}
