package com.albertonietolozano.fresco.dto.response;

// DTO de salida con los datos de un empleado del tenant.
public record EmployeeResponse(
        Long id,
        String name,
        String email,
        String phone,
        Long userId,
        Boolean active
) {}
