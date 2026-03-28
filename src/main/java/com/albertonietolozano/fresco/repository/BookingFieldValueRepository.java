package com.albertonietolozano.fresco.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.albertonietolozano.fresco.model.BookingFieldValue;

public interface BookingFieldValueRepository extends JpaRepository<BookingFieldValue, Long> {

    List<BookingFieldValue> findAllByBookingId(Long bookingId);
}
