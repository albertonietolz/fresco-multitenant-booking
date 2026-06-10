package com.albertonietolozano.fresco.service.impl;

import com.albertonietolozano.fresco.dto.request.BookingRequest;
import com.albertonietolozano.fresco.dto.request.BookingUpdateRequest;
import com.albertonietolozano.fresco.dto.response.AvailabilityResponse;
import com.albertonietolozano.fresco.dto.response.BookingFieldValueResponse;
import com.albertonietolozano.fresco.dto.response.BookingResponse;
import com.albertonietolozano.fresco.model.Booking;
import com.albertonietolozano.fresco.model.BookingFieldValue;
import com.albertonietolozano.fresco.model.Employee;
import com.albertonietolozano.fresco.model.Service;
import com.albertonietolozano.fresco.model.Tenant;
import com.albertonietolozano.fresco.model.WorkingHours;
import com.albertonietolozano.fresco.model.enums.BookingStatus;
import com.albertonietolozano.fresco.repository.BookingFieldValueRepository;
import com.albertonietolozano.fresco.repository.BookingRepository;
import com.albertonietolozano.fresco.repository.ClientRepository;
import com.albertonietolozano.fresco.repository.ClosedDateRepository;
import com.albertonietolozano.fresco.repository.EmployeeBlockedDateRepository;
import com.albertonietolozano.fresco.repository.EmployeeRepository;
import com.albertonietolozano.fresco.repository.ServiceRepository;
import com.albertonietolozano.fresco.repository.TenantRepository;
import com.albertonietolozano.fresco.repository.WorkingHoursRepository;
import com.albertonietolozano.fresco.service.BookingService;
import com.albertonietolozano.fresco.service.EmailService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
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
    private final EmployeeBlockedDateRepository empBlockedDateRepository;
    private final EmailService emailService;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            BookingFieldValueRepository bookingFieldValueRepository,
            WorkingHoursRepository workingHoursRepository,
            ServiceRepository serviceRepository,
            TenantRepository tenantRepository,
            ClosedDateRepository closedDateRepository,
            EmployeeBlockedDateRepository empBlockedDateRepository,
            EmailService emailService,
            ClientRepository clientRepository,
            EmployeeRepository employeeRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingFieldValueRepository = bookingFieldValueRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.serviceRepository = serviceRepository;
        this.tenantRepository = tenantRepository;
        this.closedDateRepository = closedDateRepository;
        this.empBlockedDateRepository = empBlockedDateRepository;
        this.emailService = emailService;
        this.clientRepository = clientRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    public AvailabilityResponse getAvailableSlots(Long employeeId, Long serviceId, LocalDate date, int partySize) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        int duration = service.getDuration();

        // Restricción de días/fechas del servicio.
        String schedMode = service.getSchedulingMode();
        if (schedMode != null && !"ANY".equals(schedMode)) {
            boolean dateAllowed;
            if ("WEEKDAYS".equals(schedMode)) {
                String allowed = service.getAllowedWeekdays();
                dateAllowed = allowed != null && java.util.Arrays.stream(allowed.split(","))
                        .anyMatch(d -> d.trim().equalsIgnoreCase(date.getDayOfWeek().name()));
            } else if ("SPECIFIC".equals(schedMode)) {
                String specific = service.getSpecificDates();
                dateAllowed = specific != null && java.util.Arrays.stream(specific.split(","))
                        .anyMatch(d -> d.trim().equals(date.toString()));
            } else {
                dateAllowed = true;
            }
            if (!dateAllowed) return new AvailabilityResponse(List.of());
        }

        Long resolvedTenantId = TenantContext.getTenantId() != null ? TenantContext.getTenantId() : service.getTenantId();

        List<WorkingHours> workingHoursList;
        if (employeeId == null) {
            // Sin empleado concreto: usar horarios de negocio si existen, o la unión de todos los empleados.
            List<WorkingHours> businessHours = workingHoursRepository.findAllByTenantIdAndEmployeeIdIsNull(resolvedTenantId);
            List<WorkingHours> source = businessHours.isEmpty()
                    ? workingHoursRepository.findAllByTenantId(resolvedTenantId).stream()
                            .filter(wh -> wh.getEmployeeId() != null)
                            .toList()
                    : businessHours;
            workingHoursList = source.stream()
                    .filter(wh -> wh.getDayOfWeek() == date.getDayOfWeek())
                    .toList();
        } else {
            List<WorkingHours> employeeSpecific = workingHoursRepository.findAllByEmployeeId(employeeId);
            workingHoursList = (employeeSpecific.isEmpty()
                    ? workingHoursRepository.findAllByTenantIdAndEmployeeIdIsNull(resolvedTenantId)
                    : employeeSpecific)
                    .stream()
                    .filter(wh -> wh.getDayOfWeek() == date.getDayOfWeek())
                    .toList();
        }

        if (workingHoursList.isEmpty()) {
            return new AvailabilityResponse(List.of());
        }

        Long tenantId = TenantContext.getTenantId();

        // Si la fecha está marcada como cierre excepcional, no hay disponibilidad.
        if (tenantId != null && closedDateRepository.existsByTenantIdAndDate(tenantId, date)) {
            return new AvailabilityResponse(List.of());
        }

        // Si el empleado bloqueó este día individualmente, no hay disponibilidad.
        if (employeeId != null && tenantId != null
                && empBlockedDateRepository.existsByTenantIdAndEmployeeIdAndDate(tenantId, employeeId, date)) {
            return new AvailabilityResponse(List.of());
        }

        // capacity = null → cita individual; capacity = 0 → grupo ilimitado; capacity > 0 → grupo con límite.
        boolean isGroupService = service.getCapacity() != null && service.getCapacity() >= 0;

        // Para servicios grupales sin empleado concreto: contar todas las reservas del servicio.
        // Para servicios individuales sin empleado concreto: necesitamos las reservas por empleado elegible
        // para determinar si al menos uno está libre (calculado de forma diferida más abajo).
        List<Booking> existingBookings;
        Map<Long, List<Booking>> bookingsByEligibleEmployee = null; // solo para servicios individuales sin empleado especificado
        Set<Long> eligibleEmployeeIds = null;

        if (employeeId == null) {
            if (isGroupService) {
                existingBookings = (resolvedTenantId != null
                        ? bookingRepository.findAllByTenantIdAndServiceIdAndDate(resolvedTenantId, service.getId(), date)
                        : bookingRepository.findAllByEmployeeIdIsNullAndServiceIdAndDate(service.getId(), date))
                        .stream().filter(b -> b.getStatus() != BookingStatus.CANCELLED).toList();
            } else {
                // Individual sin empleado: el hueco está disponible si al menos un empleado elegible está libre.
                // Precargamos las reservas por empleado elegible para evitar consultas repetidas en el bucle de slots.
                eligibleEmployeeIds = employeeRepository.findAllByTenantIdAndActiveTrue(resolvedTenantId).stream()
                        .filter(e -> e.getServiceIds() == null || e.getServiceIds().isEmpty() || e.getServiceIds().contains(serviceId))
                        .filter(e -> !empBlockedDateRepository.existsByTenantIdAndEmployeeIdAndDate(resolvedTenantId, e.getId(), date))
                        .map(Employee::getId)
                        .collect(java.util.stream.Collectors.toSet());
                bookingsByEligibleEmployee = new HashMap<>();
                for (Long eid : eligibleEmployeeIds) {
                    bookingsByEligibleEmployee.put(eid,
                            bookingRepository.findAllByEmployeeIdAndDate(eid, date).stream()
                                    .filter(b -> b.getStatus() != BookingStatus.CANCELLED).toList());
                }
                // existingBookings = unión de las reservas de todos los empleados elegibles (usada para serviceBlockingMinutes)
                existingBookings = bookingsByEligibleEmployee.values().stream()
                        .flatMap(java.util.Collection::stream).toList();
            }
        } else {
            existingBookings = bookingRepository.findAllByEmployeeIdAndDate(employeeId, date).stream()
                    .filter(b -> b.getStatus() != BookingStatus.CANCELLED).toList();
        }

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

        boolean isToday = date.equals(LocalDate.now());
        LocalTime now = LocalTime.now();

        // capacity = null → cita individual; capacity = 0 → ilimitado; capacity > 0 → grupo con límite.
        boolean isUnlimited = service.getCapacity() != null && service.getCapacity() == 0;
        boolean isLimitedGroup = service.getCapacity() != null && service.getCapacity() > 0;

        for (WorkingHours wh : workingHoursList) {
            LocalTime current = wh.getStartTime();
            LocalTime blockEnd = wh.getEndTime();

            while (!current.plusMinutes(duration).isAfter(blockEnd)) {
                final LocalTime slotStart = current;
                final LocalTime slotEnd = current.plusMinutes(duration);

                // Descartar huecos que ya han pasado si la fecha es hoy.
                if (isToday && !slotStart.isAfter(now)) {
                    current = current.plusMinutes(duration);
                    continue;
                }

                boolean slotOk;

                if (isUnlimited) {
                    // Sin límite de plazas: siempre disponible dentro del horario.
                    slotOk = true;
                } else if (isLimitedGroup) {
                    int occupiedSpots = existingBookings.stream()
                            .filter(b -> b.getServiceId().equals(serviceId) && b.getStartTime().equals(slotStart))
                            .mapToInt(b -> b.getPartySize() != null ? b.getPartySize() : 1)
                            .sum();
                    slotOk = occupiedSpots + partySize <= service.getCapacity();
                } else if (bookingsByEligibleEmployee != null) {
                    // Servicio individual sin empleado: el hueco es válido si al menos un empleado elegible está libre.
                    final LocalTime fSlotStart = slotStart;
                    final LocalTime fSlotEnd = slotEnd;
                    boolean anyFree = bookingsByEligibleEmployee.entrySet().stream().anyMatch(entry -> {
                        boolean empHasConflict = entry.getValue().stream().anyMatch(b -> {
                            Integer blockMins = serviceBlockingMinutes.getOrDefault(b.getServiceId(), duration);
                            LocalTime bookingEnd = b.getStartTime().plusMinutes(blockMins);
                            return fSlotStart.isBefore(bookingEnd) && b.getStartTime().isBefore(fSlotEnd);
                        });
                        return !empHasConflict;
                    });
                    slotOk = anyFree;
                } else {
                    boolean isOccupied = existingBookings.stream().anyMatch(b -> {
                        LocalTime bookingEnd = b.getStartTime().plusMinutes(serviceBlockingMinutes.get(b.getServiceId()));
                        return slotStart.isBefore(bookingEnd) && b.getStartTime().isBefore(slotEnd);
                    });
                    slotOk = !isOccupied;
                }

                // Comprobación de aforo global del local.
                if (slotOk && hasGlobalCap) {
                    int concurrent = allTenantBookings.stream().filter(b -> {
                        int bDur = serviceDurationMap.computeIfAbsent(b.getServiceId(),
                                id -> serviceRepository.findById(id).map(Service::getDuration).orElse(60));
                        LocalTime bStart = b.getStartTime();
                        if (bStart == null) return false;
                        LocalTime bEnd = bStart.plusMinutes(bDur);
                        return slotStart.isBefore(bEnd) && bStart.isBefore(slotEnd);
                    }).mapToInt(b -> b.getPartySize() != null ? b.getPartySize() : 1).sum();
                    slotOk = concurrent + partySize <= globalCap;
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
        Service requestedService = serviceRepository.findById(request.serviceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        int requestedPartySize = (request.partySize() != null && request.partySize() > 0) ? request.partySize() : 1;

        // Validar con el mismo employeeId con el que el cliente navegó (null = horario del negocio).
        // Resolver al empleado por defecto solo para el almacenamiento, no para validar el slot.
        AvailabilityResponse availability = getAvailableSlots(
                request.employeeId(), request.serviceId(), request.date(), requestedPartySize
        );

        boolean slotAvailable = availability.slots().contains(request.startTime());
        if (!slotAvailable) {
            throw new RuntimeException("The requested time slot is not available");
        }

        Long resolvedEmployeeId;
        if (request.employeeId() != null) {
            resolvedEmployeeId = request.employeeId();
        } else {
            resolvedEmployeeId = null;
            // 1. Empleado asignado al cliente (skip si no puede hacer el servicio o tiene el día bloqueado)
            if (request.customerEmail() != null && !request.customerEmail().isBlank()) {
                resolvedEmployeeId = clientRepository
                        .findByTenantIdAndEmail(tenantId, request.customerEmail())
                        .map(c -> c.getPreferredEmployeeId())
                        .filter(empId -> employeeRepository.findById(empId).map(e -> {
                            if (!e.getTenantId().equals(tenantId) || !Boolean.TRUE.equals(e.getActive())) return false;
                            List<Long> svcIds = e.getServiceIds();
                            return svcIds == null || svcIds.isEmpty() || svcIds.contains(request.serviceId());
                        }).orElse(false))
                        .filter(empId -> !empBlockedDateRepository.existsByTenantIdAndEmployeeIdAndDate(tenantId, empId, request.date()))
                        .orElse(null);
            }
            // 2. Empleado por defecto del servicio (skip si no puede hacer el servicio o tiene el día bloqueado)
            if (resolvedEmployeeId == null) {
                Long defEmp = requestedService.getDefaultEmployeeId();
                if (defEmp != null) {
                    boolean canDo = employeeRepository.findById(defEmp).map(e -> {
                        List<Long> svcIds = e.getServiceIds();
                        return Boolean.TRUE.equals(e.getActive()) && (svcIds == null || svcIds.isEmpty() || svcIds.contains(request.serviceId()));
                    }).orElse(false);
                    if (canDo && !empBlockedDateRepository.existsByTenantIdAndEmployeeIdAndDate(tenantId, defEmp, request.date())) {
                        resolvedEmployeeId = defEmp;
                    }
                }
            }
            // 3. Si no hay candidato: asignar al empleado activo con menos reservas ese día que pueda hacer el servicio (excluyendo bloqueados)
            if (resolvedEmployeeId == null) {
                List<Booking> dayBookings = bookingRepository.findAllByTenantIdAndDate(tenantId, request.date());
                Map<Long, Long> bookingCountByEmployee = dayBookings.stream()
                        .filter(b -> b.getEmployeeId() != null)
                        .collect(java.util.stream.Collectors.groupingBy(Booking::getEmployeeId, java.util.stream.Collectors.counting()));
                resolvedEmployeeId = employeeRepository.findAllByTenantIdAndActiveTrue(tenantId).stream()
                        .filter(e -> {
                            List<Long> svcIds = e.getServiceIds();
                            return svcIds == null || svcIds.isEmpty() || svcIds.contains(request.serviceId());
                        })
                        .filter(e -> !empBlockedDateRepository.existsByTenantIdAndEmployeeIdAndDate(tenantId, e.getId(), request.date()))
                        .min(java.util.Comparator.comparingLong(e -> bookingCountByEmployee.getOrDefault(e.getId(), 0L)))
                        .map(Employee::getId)
                        .orElse(null);
            }
        }

        String refCode = generateReferenceCode();
        String cancelToken = UUID.randomUUID().toString();

        Booking booking = Booking.builder()
                .tenantId(tenantId)
                .employeeId(resolvedEmployeeId)
                .serviceId(request.serviceId())
                .customerName(request.customerName())
                .customerEmail(request.customerEmail())
                .customerPhone(request.customerPhone())
                .date(request.date())
                .startTime(request.startTime())
                .status(BookingStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .notes(request.notes())
                .referenceCode(refCode)
                .cancelToken(cancelToken)
                .partySize(requestedPartySize)
                .build();

        final Booking saved = bookingRepository.save(booking);
        booking = saved;

        if (saved.getCustomerEmail() != null && !saved.getCustomerEmail().isBlank()) {
            serviceRepository.findById(saved.getServiceId()).ifPresent(svc ->
                tenantRepository.findById(tenantId).ifPresent(tenant ->
                    emailService.sendBookingConfirmation(
                            saved.getCustomerEmail(),
                            saved.getCustomerName(),
                            tenant.getName(),
                            svc.getName(),
                            saved.getDate(),
                            saved.getStartTime(),
                            saved.getReferenceCode(),
                            saved.getCancelToken(),
                            tenant.getSlug(),
                            tenant.getCancellationPolicy()
                    )
                )
            );
        }

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

    @Override
    public BookingResponse updateBooking(Long id, BookingUpdateRequest request) {
        Booking booking = bookingRepository.findById(id)
                .filter(b -> b.getTenantId().equals(TenantContext.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (request.customerName() != null) booking.setCustomerName(request.customerName());
        if (request.customerEmail() != null) booking.setCustomerEmail(request.customerEmail());
        booking.setCustomerPhone(request.customerPhone());
        booking.setNotes(request.notes());
        if (request.status() != null) booking.setStatus(request.status());

        bookingRepository.save(booking);

        List<BookingFieldValueResponse> fieldValues = bookingFieldValueRepository.findAllByBookingId(id)
                .stream()
                .map(fv -> new BookingFieldValueResponse(fv.getCustomFieldId(), fv.getValue()))
                .toList();

        return toResponse(booking, fieldValues);
    }

    private static final String REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private String generateReferenceCode() {
        java.util.Random rng = new java.util.Random();
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) sb.append(REF_CHARS.charAt(rng.nextInt(REF_CHARS.length())));
        return sb.toString();
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
                fieldValues,
                booking.getReferenceCode(),
                booking.getPartySize() != null ? booking.getPartySize() : 1
        );
    }
}
