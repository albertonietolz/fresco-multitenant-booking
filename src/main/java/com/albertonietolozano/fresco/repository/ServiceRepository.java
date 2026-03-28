package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Repositorio JPA para la entidad Service con filtrado por tenant y estado activo.
public interface ServiceRepository extends JpaRepository<Service, Long> {

    List<Service> findAllByTenantId(Long tenantId);

    List<Service> findAllByTenantIdAndActiveTrue(Long tenantId);
}
