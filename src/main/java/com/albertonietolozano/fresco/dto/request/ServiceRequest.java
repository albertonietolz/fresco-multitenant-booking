package com.albertonietolozano.fresco.dto.request;

public record ServiceRequest(
        String name,
        Integer duration,
        Integer capacity,
        Integer chairTime
) {}
