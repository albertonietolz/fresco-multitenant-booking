package com.albertonietolozano.fresco.dto.request;

public record TenantRequest(
        String name,
        String email,
        String phone,
        String address
) {}
