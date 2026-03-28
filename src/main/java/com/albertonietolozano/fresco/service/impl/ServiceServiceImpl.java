package com.albertonietolozano.fresco.service.impl;

import com.albertonietolozano.fresco.dto.request.ServiceRequest;
import com.albertonietolozano.fresco.dto.response.ServiceResponse;
import com.albertonietolozano.fresco.model.Service;
import com.albertonietolozano.fresco.repository.ServiceRepository;
import com.albertonietolozano.fresco.service.ServiceService;
import com.albertonietolozano.fresco.tenant.TenantContext;

import java.util.List;

// Implementación del servicio de servicios del tenant con aislamiento multitenant y borrado lógico.
@org.springframework.stereotype.Service
public class ServiceServiceImpl implements ServiceService {

    private final ServiceRepository serviceRepository;

    public ServiceServiceImpl(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    @Override
    public List<ServiceResponse> getAll() {
        return serviceRepository.findAllByTenantIdAndActiveTrue(TenantContext.getTenantId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ServiceResponse getById(Long id) {
        // El filter garantiza que un tenant no pueda acceder a recursos de otro aunque adivine el id.
        return serviceRepository.findById(id)
                .filter(s -> s.getTenantId().equals(TenantContext.getTenantId()))
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Service not found"));
    }

    @Override
    public ServiceResponse create(ServiceRequest request) {
        Service service = Service.builder()
                .tenantId(TenantContext.getTenantId())
                .name(request.name())
                .description(request.description())
                .duration(request.duration())
                .price(request.price())
                .active(true)
                .build();

        return toResponse(serviceRepository.save(service));
    }

    @Override
    public ServiceResponse update(Long id, ServiceRequest request) {
        Service service = serviceRepository.findById(id)
                .filter(s -> s.getTenantId().equals(TenantContext.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Service not found"));

        service.setName(request.name());
        service.setDescription(request.description());
        service.setDuration(request.duration());
        service.setPrice(request.price());

        return toResponse(serviceRepository.save(service));
    }

    @Override
    public void delete(Long id) {
        Service service = serviceRepository.findById(id)
                .filter(s -> s.getTenantId().equals(TenantContext.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Service not found"));

        service.setActive(false);
        serviceRepository.save(service);
    }

    private ServiceResponse toResponse(Service service) {
        return new ServiceResponse(
                service.getId(),
                service.getName(),
                service.getDescription(),
                service.getDuration(),
                service.getPrice(),
                service.getActive()
        );
    }
}
