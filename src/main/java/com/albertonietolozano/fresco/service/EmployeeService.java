package com.albertonietolozano.fresco.service;

import com.albertonietolozano.fresco.dto.request.EmployeeRequest;
import com.albertonietolozano.fresco.dto.response.EmployeeResponse;

import java.util.List;

// Contrato del servicio de gestión de empleados del tenant.
public interface EmployeeService {

    List<EmployeeResponse> getAll();

    List<EmployeeResponse> getAllByServiceId(Long serviceId);

    EmployeeResponse getById(Long id);

    EmployeeResponse create(EmployeeRequest request);

    EmployeeResponse update(Long id, EmployeeRequest request);

    void delete(Long id);
}
