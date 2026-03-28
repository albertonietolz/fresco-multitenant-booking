package com.albertonietolozano.fresco.dto.response;

import com.albertonietolozano.fresco.model.enums.Role;

// DTO de respuesta tras registro o login, incluye el token JWT y los datos básicos del usuario autenticado.
public record AuthResponse(
        String token,
        Long tenantId,
        String userName,
        String userEmail,
        Role role
) {}
