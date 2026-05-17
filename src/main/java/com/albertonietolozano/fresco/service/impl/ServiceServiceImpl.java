package com.albertonietolozano.fresco.service.impl;

import com.albertonietolozano.fresco.dto.request.ServiceRequest;
import com.albertonietolozano.fresco.dto.response.CustomFieldResponse;
import com.albertonietolozano.fresco.dto.response.ServiceResponse;
import com.albertonietolozano.fresco.model.Service;
import com.albertonietolozano.fresco.repository.CustomFieldRepository;
import com.albertonietolozano.fresco.repository.ServiceRepository;
import com.albertonietolozano.fresco.service.ServiceService;
import com.albertonietolozano.fresco.tenant.TenantContext;

import java.util.List;

@org.springframework.stereotype.Service
public class ServiceServiceImpl implements ServiceService {

    private final ServiceRepository serviceRepository;
    private final CustomFieldRepository customFieldRepository;

    public ServiceServiceImpl(ServiceRepository serviceRepository, CustomFieldRepository customFieldRepository) {
        this.serviceRepository = serviceRepository;
        this.customFieldRepository = customFieldRepository;
    }

    @Override
    public List<ServiceResponse> getAll() {
        return serviceRepository.findAllByTenantIdAndActiveTrue(TenantContext.getTenantId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<ServiceResponse> getAllIncludingInactive() {
        return serviceRepository.findAllByTenantId(TenantContext.getTenantId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ServiceResponse getById(Long id) {
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
                .duration(request.duration())
                .capacity(request.capacity())
                .chairTime(request.chairTime())
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
        service.setDuration(request.duration());
        service.setCapacity(request.capacity());
        service.setChairTime(request.chairTime());

        return toResponse(serviceRepository.save(service));
    }

    @Override
    public ServiceResponse toggleActive(Long id, Boolean active) {
        Service service = serviceRepository.findById(id)
                .filter(s -> s.getTenantId().equals(TenantContext.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Service not found"));
        service.setActive(active);
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
        List<CustomFieldResponse> fields = customFieldRepository
                .findAllByTenantIdAndServiceId(service.getTenantId(), service.getId())
                .stream()
                .map(f -> new CustomFieldResponse(f.getId(), f.getLabel(), f.getFieldType(), f.getRequired(), f.getFieldOrder()))
                .toList();

        return new ServiceResponse(service.getId(), service.getName(), service.getDuration(), service.getCapacity(), service.getChairTime(), service.getActive(), fields);
    }
}
