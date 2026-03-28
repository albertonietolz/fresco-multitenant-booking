package com.albertonietolozano.fresco.dto.request;

import java.math.BigDecimal;

// DTO de entrada para crear o actualizar un servicio del tenant.
public record ServiceRequest(
        String name,
        String description,
        Integer duration,
        BigDecimal price
) {}
