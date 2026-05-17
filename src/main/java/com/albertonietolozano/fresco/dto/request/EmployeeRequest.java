package com.albertonietolozano.fresco.dto.request;

import java.util.List;

// DTO de entrada para crear o actualizar un empleado del tenant.
public record EmployeeRequest(
        String name,
        String email,
        String phone,
        Long userId,
        List<Long> serviceIds,
        String pin
) {}
