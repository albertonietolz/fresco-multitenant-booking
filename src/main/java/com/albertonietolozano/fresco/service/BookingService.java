package com.albertonietolozano.fresco.service;

import com.albertonietolozano.fresco.dto.request.BookingRequest;
import com.albertonietolozano.fresco.dto.request.BookingUpdateRequest;
import com.albertonietolozano.fresco.dto.response.AvailabilityResponse;
import com.albertonietolozano.fresco.dto.response.BookingResponse;
import com.albertonietolozano.fresco.model.enums.BookingStatus;

import java.time.LocalDate;
import java.util.List;

// Contrato del servicio de reservas: disponibilidad, creación y gestión de reservas.
public interface BookingService {

    AvailabilityResponse getAvailableSlots(Long employeeId, Long serviceId, LocalDate date, int partySize);

    default AvailabilityResponse getAvailableSlots(Long employeeId, Long serviceId, LocalDate date) {
        return getAvailableSlots(employeeId, serviceId, date, 1);
    }

    List<String> getAvailableDatesForMonth(Long employeeId, Long serviceId, int year, int month);

    BookingResponse createBooking(BookingRequest request, Long tenantId);

    List<BookingResponse> getAllByTenant();

    BookingResponse updateStatus(Long id, BookingStatus status);

    BookingResponse updateBooking(Long id, BookingUpdateRequest request);
}
