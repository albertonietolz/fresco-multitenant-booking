package com.albertonietolozano.fresco.dto.response;

// DTO de salida para el valor de un campo personalizado asociado a una reserva.
public record BookingFieldValueResponse(
        Long customFieldId,
        String value
) {}
