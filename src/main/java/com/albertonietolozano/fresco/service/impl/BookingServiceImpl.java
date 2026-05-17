package com.albertonietolozano.fresco.service.impl;

import com.albertonietolozano.fresco.dto.request.BookingRequest;
import com.albertonietolozano.fresco.dto.response.AvailabilityResponse;
import com.albertonietolozano.fresco.dto.response.BookingFieldValueResponse;
import com.albertonietolozano.fresco.dto.response.BookingResponse;
import com.albertonietolozano.fresco.model.Booking;
import com.albertonietolozano.fresco.model.BookingFieldValue;
import com.albertonietolozano.fresco.model.Service;
import com.albertonietolozano.fresco.model.Tenant;
import com.albertonietolozano.fresco.model.WorkingHours;
import com.albertonietolozano.fresco.model.enums.BookingStatus;
import com.albertonietolozano.fresco.repository.BookingFieldValueRepository;
import com.albertonietolozano.fresco.repository.BookingRepository;
import com.albertonietolozano.fresco.repository.ClosedDateRepository;
import com.albertonietolozano.fresco.repository.ServiceRepository;
import com.albertonietolozano.fresco.repository.TenantRepository;
import com.albertonietolozano.fresco.repository.WorkingHoursRepository;
import com.albertonietolozano.fresco.service.BookingService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
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
    private final TenantRepository tenantRepository;
    private final ClosedDateRepository closedDateRepository;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            BookingFieldValueRepository bookingFieldValueRepository,
            WorkingHoursRepository workingHoursRepository,
            ServiceRepository serviceRepository,
            TenantRepository tenantRepository,
            ClosedDateRepository closedDateRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingFieldValueRepository = bookingFieldValueRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.serviceRepository = serviceRepository;
        this.tenantRepository = tenantRepository;
        this.closedDateRepository = closedDateRepository;
    }

    @Override
    public AvailabilityResponse getAvailableSlots(Long employeeId, Long serviceId, LocalDate date) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        int duration = service.getDuration();

        List<WorkingHours> employeeSpecific = workingHoursRepository.findAllByEmployeeId(employeeId);
        List<WorkingHours> workingHoursList = (employeeSpecific.isEmpty()
                ? workingHoursRepository.findAllByTenantIdAndEmployeeIdIsNull(TenantContext.getTenantId() != null
                        ? TenantContext.getTenantId()
                        : service.getTenantId())
                : employeeSpecific)
                .stream()
                .filter(wh -> wh.getDayOfWeek() == date.getDayOfWeek())
                .toList();

        if (workingHoursList.isEmpty()) {
            return new AvailabilityResponse(List.of());
        }

        Long tenantId = TenantContext.getTenantId();

        // Si la fecha está marcada como cierre excepcional, no hay disponibilidad.
        if (tenantId != null && closedDateRepository.existsByTenantIdAndDate(tenantId, date)) {
            return new AvailabilityResponse(List.of());
        }

        List<Booking> existingBookings = bookingRepository.findAllByEmployeeIdAndDate(employeeId, date)
                .stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .toList();

        Map<Long, Integer> serviceBlockingMinutes = existingBookings.stream()
                .map(Booking::getServiceId)
                .distinct()
                .collect(Collectors.toMap(
                        id -> id,
                        id -> serviceRepository.findById(id)
                                .map(s -> s.getChairTime() != null ? s.getChairTime() : s.getDuration())
                                .orElse(duration)
                ));

        // Capacidad global del local: precargar reservas de todos los empleados si hay límite.
        Tenant tenant = tenantId != null ? tenantRepository.findById(tenantId).orElse(null) : null;
        int globalCap = (tenant != null && tenant.getMaxCapacity() != null) ? tenant.getMaxCapacity() : 0;
        boolean hasGlobalCap = globalCap > 0;
        List<Booking> allTenantBookings = hasGlobalCap
                ? bookingRepository.findAllByTenantIdAndDate(tenantId, date).stream()
                        .filter(b -> b.getStatus() != BookingStatus.CANCELLED).toList()
                : List.of();

        // Mapa de duración real (no chairTime) para el cálculo de solapamiento de aforo global.
        Map<Long, Integer> serviceDurationMap = new HashMap<>();

        List<LocalTime> slots = new ArrayList<>();

        // capacity = null → cita individual; capacity = 0 → ilimitado; capacity > 0 → grupo con límite.
        boolean isUnlimited = service.getCapacity() != null && service.getCapacity() == 0;
        boolean isLimitedGroup = service.getCapacity() != null && service.getCapacity() > 0;

        for (WorkingHours wh : workingHoursList) {
            LocalTime current = wh.getStartTime();
            LocalTime blockEnd = wh.getEndTime();

            while (!current.plusMinutes(duration).isAfter(blockEnd)) {
                final LocalTime slotStart = current;
                final LocalTime slotEnd = current.plusMinutes(duration);

                boolean slotOk;

                if (isUnlimited) {
                    // Sin límite de plazas: siempre disponible dentro del horario.
                    slotOk = true;
                } else if (isLimitedGroup) {
                    long bookingsAtSlot = existingBookings.stream()
                            .filter(b -> b.getServiceId().equals(serviceId) && b.getStartTime().equals(slotStart))
                            .count();
                    slotOk = bookingsAtSlot < service.getCapacity();
                } else {
                    boolean isOccupied = existingBookings.stream().anyMatch(b -> {
                        LocalTime bookingEnd = b.getStartTime().plusMinutes(serviceBlockingMinutes.get(b.getServiceId()));
                        return slotStart.isBefore(bookingEnd) && b.getStartTime().isBefore(slotEnd);
                    });
                    slotOk = !isOccupied;
                }

                // Comprobación de aforo global del local.
                if (slotOk && hasGlobalCap) {
                    long concurrent = allTenantBookings.stream().filter(b -> {
                        int bDur = serviceDurationMap.computeIfAbsent(b.getServiceId(),
                                id -> serviceRepository.findById(id).map(Service::getDuration).orElse(60));
                        LocalTime bStart = b.getStartTime();
                        if (bStart == null) return false;
                        LocalTime bEnd = bStart.plusMinutes(bDur);
                        return slotStart.isBefore(bEnd) && bStart.isBefore(slotEnd);
                    }).count();
                    slotOk = concurrent < globalCap;
                }

                if (slotOk) slots.add(slotStart);
                current = current.plusMinutes(duration);
            }
        }

        return new AvailabilityResponse(slots);
    }

    @Override
    public List<String> getAvailableDatesForMonth(Long employeeId, Long serviceId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        LocalDate today = LocalDate.now();

        List<String> availableDates = new ArrayList<>();
        for (LocalDate date = start.isBefore(today) ? today : start; !date.isAfter(end); date = date.plusDays(1)) {
            AvailabilityResponse avail = getAvailableSlots(employeeId, serviceId, date);
            if (!avail.slots().isEmpty()) {
                availableDates.add(date.toString());
            }
        }
        return availableDates;
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
