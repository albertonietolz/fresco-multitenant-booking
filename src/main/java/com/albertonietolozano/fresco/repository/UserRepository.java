package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findAllByTenantId(Long tenantId);
}
