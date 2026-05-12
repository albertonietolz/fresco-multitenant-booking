package com.albertonietolozano.fresco.service;

import com.albertonietolozano.fresco.dto.request.BookingRequest;
import com.albertonietolozano.fresco.dto.response.AvailabilityResponse;
import com.albertonietolozano.fresco.dto.response.BookingResponse;
import com.albertonietolozano.fresco.model.enums.BookingStatus;

import java.time.LocalDate;
import java.util.List;

// Contrato del servicio de reservas: disponibilidad, creación y gestión de reservas.
public interface BookingService {

    AvailabilityResponse getAvailableSlots(Long employeeId, Long serviceId, LocalDate date);

    BookingResponse createBooking(BookingRequest request, Long tenantId);

    List<BookingResponse> getAllByTenant();

    BookingResponse updateStatus(Long id, BookingStatus status);
}
