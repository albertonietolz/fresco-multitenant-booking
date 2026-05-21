package com.albertonietolozano.fresco.dto.response;

import java.util.List;

public record ScheduleResponse(
        String date,
        int granularity,
        Long loggedEmployeeId,
        List<String> slots,
        List<ScheduleResponse.EmployeeSchedule> employees,
        List<Integer> workingDaysOfWeek
) {
    public record EmployeeSchedule(Long id, String name, List<BookingSlot> bookings) {}

    public record BookingSlot(
            Long bookingId,
            String startTime,
            String endTime,
            String clientName,
            String serviceName,
            int durationMinutes,
            int startSlotIndex,
            int spanSlots,
            String status
    ) {}
}
