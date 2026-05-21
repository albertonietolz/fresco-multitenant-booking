package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.EmployeeBlockedDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface EmployeeBlockedDateRepository extends JpaRepository<EmployeeBlockedDate, Long> {

    List<EmployeeBlockedDate> findAllByTenantIdAndEmployeeId(Long tenantId, Long employeeId);

    boolean existsByTenantIdAndEmployeeIdAndDate(Long tenantId, Long employeeId, LocalDate date);

    @Transactional
    void deleteByTenantIdAndEmployeeIdAndDate(Long tenantId, Long employeeId, LocalDate date);
}
