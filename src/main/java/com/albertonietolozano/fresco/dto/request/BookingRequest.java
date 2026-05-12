package com.albertonietolozano.fresco.dto.request;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

// DTO de entrada para crear una reserva, incluyendo datos del cliente y valores de campos personalizados.
public record BookingRequest(
        Long employeeId,
        Long serviceId,
        String customerName,
        String customerEmail,
        String customerPhone,
        LocalDate date,
        LocalTime startTime,
        String notes,
        List<BookingFieldValueRequest> fieldValues
) {}
