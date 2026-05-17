package com.albertonietolozano.fresco.service.impl;

import com.albertonietolozano.fresco.dto.request.LoginRequest;
import com.albertonietolozano.fresco.dto.request.RegisterRequest;
import com.albertonietolozano.fresco.dto.response.AuthResponse;
import com.albertonietolozano.fresco.model.Tenant;
import com.albertonietolozano.fresco.model.User;
import com.albertonietolozano.fresco.model.enums.Role;
import com.albertonietolozano.fresco.repository.TenantRepository;
import com.albertonietolozano.fresco.repository.UserRepository;
import com.albertonietolozano.fresco.security.JwtService;
import com.albertonietolozano.fresco.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

// Implementación del servicio de autenticación: crea tenant y usuario en el registro, valida credenciales en el login.
@Service
public class AuthServiceImpl implements AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public AuthServiceImpl(
            TenantRepository tenantRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            UserDetailsService userDetailsService
    ) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (tenantRepository.existsBySlug(request.tenantSlug())) {
            throw new IllegalArgumentException("El slug '" + request.tenantSlug() + "' ya está en uso.");
        }
        if (tenantRepository.existsByEmail(request.tenantEmail())) {
            throw new IllegalArgumentException("El email del negocio ya está registrado.");
        }
        if (userRepository.existsByEmail(request.userEmail())) {
            throw new IllegalArgumentException("El email de usuario ya está registrado.");
        }

        Tenant tenant = Tenant.builder()
                .name(request.tenantName())
                .slug(request.tenantSlug())
                .email(request.tenantEmail())
                .phone(request.tenantPhone())
                .address(request.tenantAddress())
                .createdAt(LocalDateTime.now())
                .active(true)
                .build();

        // Se reasigna tenant para obtener el id generado por BD, necesario para asociarlo al usuario.
        tenant = tenantRepository.save(tenant);

        User user = User.builder()
                .tenantId(tenant.getId())
                .name(request.userName())
                .email(request.userEmail())
                .password(passwordEncoder.encode(request.userPassword()))
                .role(Role.OWNER)
                .createdAt(LocalDateTime.now())
                .active(true)
                .build();

        user = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails, tenant.getId());

        return new AuthResponse(token, tenant.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        // authenticate() verifica email y contraseña contra BCrypt; lanza BadCredentialsException si fallan.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails, user.getTenantId());

        return new AuthResponse(token, user.getTenantId(), user.getName(), user.getEmail(), user.getRole());
    }
}
