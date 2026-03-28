package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRepository extends JpaRepository<Service, Long> {

    List<Service> findAllByTenantId(Long tenantId);

    List<Service> findAllByTenantIdAndActiveTrue(Long tenantId);
}
