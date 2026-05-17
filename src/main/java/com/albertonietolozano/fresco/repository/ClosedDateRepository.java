package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.ClosedDate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ClosedDateRepository extends JpaRepository<ClosedDate, Long> {

    List<ClosedDate> findAllByTenantId(Long tenantId);

    boolean existsByTenantIdAndDate(Long tenantId, LocalDate date);

    void deleteByTenantIdAndDateIn(Long tenantId, List<LocalDate> dates);
}
