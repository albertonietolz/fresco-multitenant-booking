package com.albertonietolozano.fresco.dto.response;

public record EmployeeAuthResponse(String token, Long employeeId, String name, Long tenantId) {}
