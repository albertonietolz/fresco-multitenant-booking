package com.albertonietolozano.fresco.dto.request;

// DTO de entrada para el valor de un campo personalizado dentro de una reserva.
public record BookingFieldValueRequest(
        Long customFieldId,
        String value
) {}
