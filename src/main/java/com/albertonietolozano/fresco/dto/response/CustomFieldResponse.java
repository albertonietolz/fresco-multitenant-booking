package com.albertonietolozano.fresco.dto.response;

import com.albertonietolozano.fresco.model.enums.FieldType;

import java.util.List;

public record CustomFieldResponse(
        Long id,
        String label,
        FieldType fieldType,
        Boolean required,
        Integer fieldOrder,
        List<String> options
) {}
