package com.albertonietolozano.fresco.service;

import com.albertonietolozano.fresco.dto.request.WorkingHoursRequest;
import com.albertonietolozano.fresco.dto.response.WorkingHoursResponse;

import java.util.List;

// Contrato del servicio de gestión de horarios laborales de los empleados.
public interface WorkingHoursService {

    List<WorkingHoursResponse> getByEmployee(Long employeeId);

    List<WorkingHoursResponse> save(Long employeeId, List<WorkingHoursRequest> request);

    List<WorkingHoursResponse> getBusinessHours();

    List<WorkingHoursResponse> saveBusinessHours(List<WorkingHoursRequest> request);
}
