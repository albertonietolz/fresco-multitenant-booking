package com.albertonietolozano.fresco.dto.response;

import java.time.DayOfWeek;
import java.time.LocalTime;

// DTO de salida con el horario laboral de un empleado para un día de la semana.
public record WorkingHoursResponse(
        Long id,
        Long employeeId,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime
) {}
