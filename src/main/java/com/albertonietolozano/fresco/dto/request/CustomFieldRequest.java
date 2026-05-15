package com.albertonietolozano.fresco.dto.request;

import com.albertonietolozano.fresco.model.enums.FieldType;

public record CustomFieldRequest(
        String label,
        FieldType fieldType,
        Boolean required,
        Integer fieldOrder
) {}
