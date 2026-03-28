package com.albertonietolozano.fresco.service;

import com.albertonietolozano.fresco.dto.request.ServiceRequest;
import com.albertonietolozano.fresco.dto.response.ServiceResponse;

import java.util.List;

// Contrato del servicio de gestión de servicios del tenant.
public interface ServiceService {

    List<ServiceResponse> getAll();

    ServiceResponse getById(Long id);

    ServiceResponse create(ServiceRequest request);

    ServiceResponse update(Long id, ServiceRequest request);

    void delete(Long id);
}
