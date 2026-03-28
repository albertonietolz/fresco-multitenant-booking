package com.albertonietolozano.fresco.dto.request;

// DTO de entrada para el registro de un nuevo tenant junto con su usuario propietario.
public record RegisterRequest(
        String tenantName,
        String tenantSlug,
        String tenantEmail,
        String tenantPhone,
        String tenantAddress,
        String userName,
        String userEmail,
        String userPassword
) {}
