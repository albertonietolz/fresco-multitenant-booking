package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.CustomField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Repositorio JPA para la entidad CustomField con filtrado por tenant y por servicio.
public interface CustomFieldRepository extends JpaRepository<CustomField, Long> {

    List<CustomField> findAllByTenantId(Long tenantId);

    List<CustomField> findAllByTenantIdAndServiceId(Long tenantId, Long serviceId);
}
