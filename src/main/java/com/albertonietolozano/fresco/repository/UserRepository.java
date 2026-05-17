package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// Repositorio JPA para la entidad User con búsqueda por email y filtrado por tenant.
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findAllByTenantId(Long tenantId);
}
