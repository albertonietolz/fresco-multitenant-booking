package com.albertonietolozano.fresco.dto.response;

import com.albertonietolozano.fresco.model.enums.BookingStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

// DTO de salida con todos los datos de una reserva, incluyendo los valores de campos personalizados.
public record BookingResponse(
        Long id,
        Long tenantId,
        Long employeeId,
        Long serviceId,
        String customerName,
        String customerEmail,
        String customerPhone,
        LocalDate date,
        LocalTime startTime,
        BookingStatus status,
        LocalDateTime createdAt,
        String notes,
        List<BookingFieldValueResponse> fieldValues
) {}
