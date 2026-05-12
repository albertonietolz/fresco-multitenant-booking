package com.albertonietolozano.fresco.dto.response;

import java.time.LocalTime;
import java.util.List;

// DTO de salida con las franjas horarias disponibles para un empleado, servicio y fecha concretos.
public record AvailabilityResponse(
        List<LocalTime> slots
) {}
