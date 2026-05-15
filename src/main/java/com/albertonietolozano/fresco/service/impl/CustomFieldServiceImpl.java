package com.albertonietolozano.fresco.service.impl;

import com.albertonietolozano.fresco.dto.request.CustomFieldRequest;
import com.albertonietolozano.fresco.dto.response.CustomFieldResponse;
import com.albertonietolozano.fresco.model.CustomField;
import com.albertonietolozano.fresco.repository.CustomFieldRepository;
import com.albertonietolozano.fresco.repository.ServiceRepository;
import com.albertonietolozano.fresco.service.CustomFieldService;
import com.albertonietolozano.fresco.tenant.TenantContext;

import java.util.List;

@org.springframework.stereotype.Service
public class CustomFieldServiceImpl implements CustomFieldService {

    private final CustomFieldRepository customFieldRepository;
    private final ServiceRepository serviceRepository;

    public CustomFieldServiceImpl(CustomFieldRepository customFieldRepository, ServiceRepository serviceRepository) {
        this.customFieldRepository = customFieldRepository;
        this.serviceRepository = serviceRepository;
    }

    @Override
    public CustomFieldResponse createForService(Long serviceId, CustomFieldRequest request) {
        serviceRepository.findById(serviceId)
                .filter(s -> s.getTenantId().equals(TenantContext.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Service not found"));

        CustomField field = CustomField.builder()
                .tenantId(TenantContext.getTenantId())
                .serviceId(serviceId)
                .label(request.label())
                .fieldType(request.fieldType())
                .required(request.required() != null ? request.required() : false)
                .fieldOrder(request.fieldOrder())
                .build();

        return toResponse(customFieldRepository.save(field));
    }

    @Override
    public List<CustomFieldResponse> getByService(Long serviceId) {
        serviceRepository.findById(serviceId)
                .filter(s -> s.getTenantId().equals(TenantContext.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Service not found"));

        return customFieldRepository
                .findAllByTenantIdAndServiceId(TenantContext.getTenantId(), serviceId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void delete(Long id) {
        CustomField field = customFieldRepository.findById(id)
                .filter(f -> f.getTenantId().equals(TenantContext.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Field not found"));
        customFieldRepository.delete(field);
    }

    private CustomFieldResponse toResponse(CustomField field) {
        return new CustomFieldResponse(
                field.getId(),
                field.getLabel(),
                field.getFieldType(),
                field.getRequired(),
                field.getFieldOrder()
        );
    }
}
