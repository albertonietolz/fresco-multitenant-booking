package com.albertonietolozano.fresco.dto.response;

public record TenantResponse(
        Long id,
        String name,
        String slug,
        String email,
        String phone,
        String address,
        Integer maxCapacity,
        Boolean allowEmployeeChoice,
        String cancellationPolicy
) {}
