package com.albertonietolozano.fresco.service.impl;

import com.albertonietolozano.fresco.dto.request.BookingRequest;
import com.albertonietolozano.fresco.dto.response.AvailabilityResponse;
import com.albertonietolozano.fresco.dto.response.BookingFieldValueResponse;
import com.albertonietolozano.fresco.dto.response.BookingResponse;
import com.albertonietolozano.fresco.model.Booking;
import com.albertonietolozano.fresco.model.BookingFieldValue;
import com.albertonietolozano.fresco.model.Service;
import com.albertonietolozano.fresco.model.WorkingHours;
import com.albertonietolozano.fresco.model.enums.BookingStatus;
import com.albertonietolozano.fresco.repository.BookingFieldValueRepository;
import com.albertonietolozano.fresco.repository.BookingRepository;
import com.albertonietolozano.fresco.repository.ServiceRepository;
import com.albertonietolozano.fresco.repository.WorkingHoursRepository;
import com.albertonietolozano.fresco.service.BookingService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// Implementación del servicio de reservas: calcula disponibilidad cruzando horarios con reservas existentes.
@org.springframework.stereotype.Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final BookingFieldValueRepository bookingFieldValueRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final ServiceRepository serviceRepository;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            BookingFieldValueRepository bookingFieldValueRepository,
            WorkingHoursRepository workingHoursRepository,
            ServiceRepository serviceRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingFieldValueRepository = bookingFieldValueRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.serviceRepository = serviceRepository;
    }

    @Override
    public AvailabilityResponse getAvailableSlots(Long employeeId, Long serviceId, LocalDate date) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        int duration = service.getDuration();

        // Filtramos los horarios del empleado por el día de la semana de la fecha solicitada.
        List<WorkingHours> workingHoursList = workingHoursRepository.findAllByEmployeeId(employeeId)
                .stream()
                .filter(wh -> wh.getDayOfWeek() == date.getDayOfWeek())
                .toList();

        if (workingHoursList.isEmpty()) {
            return new AvailabilityResponse(List.of());
        }

        List<Booking> existingBookings = bookingRepository.findAllByEmployeeIdAndDate(employeeId, date)
                .stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .toList();

        // Precargamos las duraciones de los servicios de las reservas existentes para calcular sus horas de fin.
        Map<Long, Integer> serviceDurations = existingBookings.stream()
                .map(Booking::getServiceId)
                .distinct()
                .collect(Collectors.toMap(
                        id -> id,
                        id -> serviceRepository.findById(id).map(Service::getDuration).orElse(duration)
                ));

        List<LocalTime> slots = new ArrayList<>();

        for (WorkingHours wh : workingHoursList) {
            LocalTime current = wh.getStartTime();
            LocalTime blockEnd = wh.getEndTime();

            // Generamos franjas avanzando por la duración del servicio hasta agotar el bloque horario.
            while (!current.plusMinutes(duration).isAfter(blockEnd)) {
                final LocalTime slotStart = current;
                final LocalTime slotEnd = current.plusMinutes(duration);

                boolean isOccupied = existingBookings.stream().anyMatch(b -> {
                    LocalTime bookingEnd = b.getStartTime().plusMinutes(serviceDurations.get(b.getServiceId()));
                    // Dos intervalos [a,b) y [c,d) se solapan si a < d && c < b.
                    return slotStart.isBefore(bookingEnd) && b.getStartTime().isBefore(slotEnd);
                });

                if (!isOccupied) {
                    slots.add(slotStart);
                }

                current = current.plusMinutes(duration);
            }
        }

        return new AvailabilityResponse(slots);
    }

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request, Long tenantId) {
        AvailabilityResponse availability = getAvailableSlots(
                request.employeeId(), request.serviceId(), request.date()
        );

        boolean slotAvailable = availability.slots().contains(request.startTime());
        if (!slotAvailable) {
            throw new RuntimeException("The requested time slot is not available");
        }

        Booking booking = Booking.builder()
                .tenantId(tenantId)
                .employeeId(request.employeeId())
                .serviceId(request.serviceId())
                .customerName(request.customerName())
                .customerEmail(request.customerEmail())
                .customerPhone(request.customerPhone())
                .date(request.date())
                .startTime(request.startTime())
                .status(BookingStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .notes(request.notes())
                .build();

        booking = bookingRepository.save(booking);

        List<BookingFieldValueResponse> fieldValueResponses = new ArrayList<>();

        if (request.fieldValues() != null) {
            final Long bookingId = booking.getId();
            List<BookingFieldValue> fieldValues = request.fieldValues().stream()
                    .map(fv -> BookingFieldValue.builder()
                            .bookingId(bookingId)
                            .customFieldId(fv.customFieldId())
                            .value(fv.value())
                            .build())
                    .toList();

            bookingFieldValueRepository.saveAll(fieldValues).forEach(fv ->
                    fieldValueResponses.add(new BookingFieldValueResponse(fv.getCustomFieldId(), fv.getValue()))
            );
        }

        return toResponse(booking, fieldValueResponses);
    }

    @Override
    public List<BookingResponse> getAllByTenant() {
        return bookingRepository.findAllByTenantId(TenantContext.getTenantId())
                .stream()
                .map(b -> {
                    List<BookingFieldValueResponse> fieldValues = bookingFieldValueRepository
                            .findAllByBookingId(b.getId())
                            .stream()
                            .map(fv -> new BookingFieldValueResponse(fv.getCustomFieldId(), fv.getValue()))
                            .toList();
                    return toResponse(b, fieldValues);
                })
                .toList();
    }

    @Override
    public BookingResponse updateStatus(Long id, BookingStatus status) {
        Booking booking = bookingRepository.findById(id)
                .filter(b -> b.getTenantId().equals(TenantContext.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(status);
        bookingRepository.save(booking);

        List<BookingFieldValueResponse> fieldValues = bookingFieldValueRepository.findAllByBookingId(id)
                .stream()
                .map(fv -> new BookingFieldValueResponse(fv.getCustomFieldId(), fv.getValue()))
                .toList();

        return toResponse(booking, fieldValues);
    }

    private BookingResponse toResponse(Booking booking, List<BookingFieldValueResponse> fieldValues) {
        return new BookingResponse(
                booking.getId(),
                booking.getTenantId(),
                booking.getEmployeeId(),
                booking.getServiceId(),
                booking.getCustomerName(),
                booking.getCustomerEmail(),
                booking.getCustomerPhone(),
                booking.getDate(),
                booking.getStartTime(),
                booking.getStatus(),
                booking.getCreatedAt(),
                booking.getNotes(),
                fieldValues
        );
    }
}
