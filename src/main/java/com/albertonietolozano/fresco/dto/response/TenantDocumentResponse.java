package com.albertonietolozano.fresco.dto.response;

import java.time.LocalDateTime;

public record TenantDocumentResponse(
        Long id,
        String displayName,
        String fileName,
        LocalDateTime uploadedAt
) {}
