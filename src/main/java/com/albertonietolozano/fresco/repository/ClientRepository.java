package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {

    List<Client> findAllByTenantId(Long tenantId);

    Optional<Client> findByTenantIdAndEmail(Long tenantId, String email);

    Optional<Client> findByTenantIdAndPhone(Long tenantId, String phone);

    boolean existsByTenantIdAndEmail(Long tenantId, String email);
}
