package com.albertonietolozano.fresco.dto.request;

import com.albertonietolozano.fresco.model.enums.BookingStatus;

public record BookingUpdateRequest(
        String customerName,
        String customerEmail,
        String customerPhone,
        String notes,
        BookingStatus status
) {}
