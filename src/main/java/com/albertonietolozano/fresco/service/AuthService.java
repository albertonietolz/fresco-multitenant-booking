package com.albertonietolozano.fresco.service;

import com.albertonietolozano.fresco.dto.request.LoginRequest;
import com.albertonietolozano.fresco.dto.request.RegisterRequest;
import com.albertonietolozano.fresco.dto.response.AuthResponse;

// Contrato del servicio de autenticación: registro de nuevos tenants y login de usuarios existentes.
public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
