package com.albertonietolozano.fresco.dto.response;

import java.util.List;

public record ServiceResponse(
        Long id,
        String name,
        Integer duration,
        Integer capacity,
        Integer chairTime,
        Boolean active,
        List<CustomFieldResponse> fields
) {}
