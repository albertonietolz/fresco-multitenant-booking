package com.albertonietolozano.fresco.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record ServiceResponse(
        Long id,
        String name,
        Integer duration,
        Integer capacity,
        Integer chairTime,
        BigDecimal price,
        Boolean active,
        List<CustomFieldResponse> fields,
        Long defaultEmployeeId
) {}
