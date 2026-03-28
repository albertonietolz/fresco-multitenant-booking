package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.WorkingHours;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkingHoursRepository extends JpaRepository<WorkingHours, Long> {

    List<WorkingHours> findAllByEmployeeId(Long employeeId);

    List<WorkingHours> findAllByTenantId(Long tenantId);
}
