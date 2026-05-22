package com.albertonietolozano.fresco.dto.request;

public record ClientRequest(
        String name,
        String email,
        String phone,
        String notes,
        Long preferredEmployeeId,
        Long preferredServiceId
) {}
