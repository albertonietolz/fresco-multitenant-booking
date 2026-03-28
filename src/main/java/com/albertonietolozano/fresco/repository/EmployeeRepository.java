package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    List<Employee> findAllByTenantId(Long tenantId);

    List<Employee> findAllByTenantIdAndActiveTrue(Long tenantId);
}
