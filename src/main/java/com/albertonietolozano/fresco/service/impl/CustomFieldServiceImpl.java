package com.albertonietolozano.fresco.service.impl;

import com.albertonietolozano.fresco.dto.request.CustomFieldRequest;
import com.albertonietolozano.fresco.dto.response.CustomFieldResponse;
import com.albertonietolozano.fresco.model.CustomField;
import com.albertonietolozano.fresco.model.CustomFieldOption;
import com.albertonietolozano.fresco.repository.CustomFieldOptionRepository;
import com.albertonietolozano.fresco.repository.CustomFieldRepository;
import com.albertonietolozano.fresco.repository.ServiceRepository;
import com.albertonietolozano.fresco.service.CustomFieldService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@org.springframework.stereotype.Service
public class CustomFieldServiceImpl implements CustomFieldService {

    private final CustomFieldRepository customFieldRepository;
    private final ServiceRepository serviceRepository;
    private final CustomFieldOptionRepository optionRepository;

    public CustomFieldServiceImpl(CustomFieldRepository customFieldRepository,
                                  ServiceRepository serviceRepository,
                                  CustomFieldOptionRepository optionRepository) {
        this.customFieldRepository = customFieldRepository;
        this.serviceRepository = serviceRepository;
        this.optionRepository = optionRepository;
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
    @Transactional
    public void delete(Long id) {
        CustomField field = customFieldRepository.findById(id)
                .filter(f -> f.getTenantId().equals(TenantContext.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Field not found"));
        optionRepository.deleteAllByCustomFieldId(id);
        customFieldRepository.delete(field);
    }

    @Transactional
    public void saveOptions(Long fieldId, List<String> labels) {
        customFieldRepository.findById(fieldId)
                .filter(f -> f.getTenantId().equals(TenantContext.getTenantId()))
                .orElseThrow(() -> new RuntimeException("Field not found"));
        optionRepository.deleteAllByCustomFieldId(fieldId);
        for (int i = 0; i < labels.size(); i++) {
            optionRepository.save(CustomFieldOption.builder()
                    .customFieldId(fieldId)
                    .label(labels.get(i))
                    .sortOrder(i)
                    .build());
        }
    }

    private CustomFieldResponse toResponse(CustomField field) {
        List<String> options = optionRepository
                .findAllByCustomFieldIdOrderBySortOrderAsc(field.getId())
                .stream()
                .map(CustomFieldOption::getLabel)
                .toList();
        return new CustomFieldResponse(
                field.getId(),
                field.getLabel(),
                field.getFieldType(),
                field.getRequired(),
                field.getFieldOrder(),
                options
        );
    }
}
