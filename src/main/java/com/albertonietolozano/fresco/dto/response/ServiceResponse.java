package com.albertonietolozano.fresco.dto.response;

import java.math.BigDecimal;

// DTO de salida con los datos de un servicio del tenant.
public record ServiceResponse(
        Long id,
        String name,
        String description,
        Integer duration,
        BigDecimal price,
        Boolean active
) {}
