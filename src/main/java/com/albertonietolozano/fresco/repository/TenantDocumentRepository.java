package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.TenantDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TenantDocumentRepository extends JpaRepository<TenantDocument, Long> {
    List<TenantDocument> findAllByTenantIdOrderByUploadedAtDesc(Long tenantId);
}
