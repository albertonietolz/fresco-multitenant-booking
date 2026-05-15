package com.albertonietolozano.fresco.dto.response;

import com.albertonietolozano.fresco.model.enums.FieldType;

public record CustomFieldResponse(
        Long id,
        String label,
        FieldType fieldType,
        Boolean required,
        Integer fieldOrder
) {}
