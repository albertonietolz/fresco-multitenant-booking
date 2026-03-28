package com.albertonietolozano.fresco.service.impl;

import com.albertonietolozano.fresco.dto.request.EmployeeRequest;
import com.albertonietolozano.fresco.dto.response.EmployeeResponse;
import com.albertonietolozano.fresco.model.Employee;
import com.albertonietolozano.fresco.repository.EmployeeRepository;
import com.albertonietolozano.fresco.service.EmployeeService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.stereotype.Service;

import java.util.List;

// Implementación del servicio de empleados del tenant con aislamiento multitenant y borrado lógico.
@Service
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeServiceImpl(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Override
    public List<EmployeeResponse> getAll() {
        return employeeRepository.findAllByTenantIdAndActiveTrue(TenantContext.getTenantId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public EmployeeResponse getById(Long id) {
        return employeeRepository.findById(id)
                .filter(e -> e.getTenantId().equals(TenantContext.getTenantId()))
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
    }

    @Override
    public EmployeeResponse create(EmployeeRequest request) {
        Employee employee = Employee.builder()
                .tenantId(TenantContext.getTenantId())
                .name(request.name())
                .email(request.email())
                .phone(request.phone())
                .userId(request.userId())
                .active(true)
                .build();

        return toResponse(employeeRepository.save(employee));
    }

    @Override
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .filter(e -> e.getTenantId().equals(TenantContext.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        employee.setName(request.name());
        employee.setEmail(request.email());
        employee.setPhone(request.phone());
        employee.setUserId(request.userId());

        return toResponse(employeeRepository.save(employee));
    }

    @Override
    public void delete(Long id) {
        Employee employee = employeeRepository.findById(id)
                .filter(e -> e.getTenantId().equals(TenantContext.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        employee.setActive(false);
        employeeRepository.save(employee);
    }

    private EmployeeResponse toResponse(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getName(),
                employee.getEmail(),
                employee.getPhone(),
                employee.getUserId(),
                employee.getActive()
        );
    }
}
