package com.albertonietolozano.fresco.dto.request;

// DTO de entrada para la autenticación de un usuario mediante email y contraseña.
public record LoginRequest(
        String email,
        String password
) {}
