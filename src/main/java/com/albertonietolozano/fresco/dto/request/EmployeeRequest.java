package com.albertonietolozano.fresco.dto.request;

// DTO de entrada para crear o actualizar un empleado del tenant.
public record EmployeeRequest(
        String name,
        String email,
        String phone,
        Long userId
) {}
