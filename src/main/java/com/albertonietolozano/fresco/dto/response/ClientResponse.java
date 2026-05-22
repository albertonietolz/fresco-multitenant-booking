package com.albertonietolozano.fresco.dto.response;

public record ClientResponse(
        Long id,
        Long tenantId,
        String name,
        String email,
        String phone,
        String notes,
        Long preferredEmployeeId,
        Long preferredServiceId
) {}
