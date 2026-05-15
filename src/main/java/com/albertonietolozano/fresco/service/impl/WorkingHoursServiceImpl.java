package com.albertonietolozano.fresco.service.impl;

import com.albertonietolozano.fresco.dto.request.WorkingHoursRequest;
import com.albertonietolozano.fresco.dto.response.WorkingHoursResponse;
import com.albertonietolozano.fresco.model.WorkingHours;
import com.albertonietolozano.fresco.repository.WorkingHoursRepository;
import com.albertonietolozano.fresco.service.WorkingHoursService;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Implementación del servicio de horarios laborales; el guardado reemplaza completamente los horarios existentes.
@Service
public class WorkingHoursServiceImpl implements WorkingHoursService {

    private final WorkingHoursRepository workingHoursRepository;

    public WorkingHoursServiceImpl(WorkingHoursRepository workingHoursRepository) {
        this.workingHoursRepository = workingHoursRepository;
    }

    @Override
    public List<WorkingHoursResponse> getByEmployee(Long employeeId) {
        return workingHoursRepository.findAllByEmployeeId(employeeId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public List<WorkingHoursResponse> save(Long employeeId, List<WorkingHoursRequest> request) {
        // Estrategia delete-then-insert: se eliminan todos los horarios previos y se insertan los nuevos en bloque.
        workingHoursRepository.deleteAll(
                workingHoursRepository.findAllByEmployeeId(employeeId)
        );

        List<WorkingHours> newHours = request.stream()
                .map(r -> WorkingHours.builder()
                        .tenantId(TenantContext.getTenantId())
                        .employeeId(employeeId)
                        .dayOfWeek(r.dayOfWeek())
                        .startTime(r.startTime())
                        .endTime(r.endTime())
                        .build())
                .toList();

        return workingHoursRepository.saveAll(newHours)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<WorkingHoursResponse> getBusinessHours() {
        return workingHoursRepository
                .findAllByTenantIdAndEmployeeIdIsNull(TenantContext.getTenantId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public List<WorkingHoursResponse> saveBusinessHours(List<WorkingHoursRequest> request) {
        workingHoursRepository.deleteAllByTenantIdAndEmployeeIdIsNull(TenantContext.getTenantId());

        List<WorkingHours> newHours = request.stream()
                .map(r -> WorkingHours.builder()
                        .tenantId(TenantContext.getTenantId())
                        .employeeId(null)
                        .dayOfWeek(r.dayOfWeek())
                        .startTime(r.startTime())
                        .endTime(r.endTime())
                        .build())
                .toList();

        return workingHoursRepository.saveAll(newHours)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private WorkingHoursResponse toResponse(WorkingHours wh) {
        return new WorkingHoursResponse(
                wh.getId(),
                wh.getEmployeeId(),
                wh.getDayOfWeek(),
                wh.getStartTime(),
                wh.getEndTime()
        );
    }
}
