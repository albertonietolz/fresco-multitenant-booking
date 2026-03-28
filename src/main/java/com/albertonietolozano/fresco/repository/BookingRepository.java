package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

// Repositorio JPA para la entidad Booking con filtrado por tenant y por empleado y fecha.
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findAllByTenantId(Long tenantId);

    List<Booking> findAllByEmployeeIdAndDate(Long employeeId, LocalDate date);
}
