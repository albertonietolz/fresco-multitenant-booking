package com.albertonietolozano.fresco.controller;

import com.albertonietolozano.fresco.dto.request.CustomFieldRequest;
import com.albertonietolozano.fresco.dto.response.CustomFieldResponse;
import com.albertonietolozano.fresco.service.impl.CustomFieldServiceImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CustomFieldController {

    private final CustomFieldServiceImpl customFieldService;

    public CustomFieldController(CustomFieldServiceImpl customFieldService) {
        this.customFieldService = customFieldService;
    }

    @PostMapping("/api/services/{serviceId}/fields")
    public ResponseEntity<CustomFieldResponse> create(
            @PathVariable Long serviceId,
            @RequestBody CustomFieldRequest request) {
        return ResponseEntity.ok(customFieldService.createForService(serviceId, request));
    }

    @GetMapping("/api/services/{serviceId}/fields")
    public ResponseEntity<List<CustomFieldResponse>> getByService(@PathVariable Long serviceId) {
        return ResponseEntity.ok(customFieldService.getByService(serviceId));
    }

    @DeleteMapping("/api/fields/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        customFieldService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/fields/{id}/options")
    public ResponseEntity<Void> saveOptions(@PathVariable Long id, @RequestBody List<String> options) {
        customFieldService.saveOptions(id, options);
        return ResponseEntity.noContent().build();
    }
}
