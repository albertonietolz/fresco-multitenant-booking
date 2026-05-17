package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Repositorio JPA para la entidad Tenant con búsquedas por slug y email.
public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findBySlug(String slug);

    Optional<Tenant> findByEmail(String email);

    boolean existsBySlug(String slug);

    boolean existsByEmail(String email);
}
