package com.albertonietolozano.fresco.dto.request;

import java.math.BigDecimal;

public record ServiceRequest(
        String name,
        Integer duration,
        Integer capacity,
        Integer chairTime,
        BigDecimal price,
        Long defaultEmployeeId,
        Boolean allowPartySize,
        String schedulingMode,
        String allowedWeekdays,
        String specificDates
) {}
