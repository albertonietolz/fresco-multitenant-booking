package com.albertonietolozano.fresco.dto.request;

import java.time.DayOfWeek;
import java.time.LocalTime;

// DTO de entrada para definir un bloque horario de un empleado en un día concreto.
public record WorkingHoursRequest(
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime
) {}
