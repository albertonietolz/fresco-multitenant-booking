package com.albertonietolozano.fresco.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

// Servicio responsable de generar, firmar y validar tokens JWT.
@Service
public class JwtService {

    private static final long EMPLOYEE_TOKEN_TTL = 10L * 60 * 60 * 1000; // 10 horas

    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    public String generateToken(UserDetails userDetails, Long tenantId) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claims(Map.of("tenantId", tenantId))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getExpiration()))
                .signWith(getSigningKey())
                .compact();
    }

    // Token de empleado: subject = "emp:{employeeId}", claims incluyen tenantId y employeeId.
    public String generateEmployeeToken(Long employeeId, Long tenantId) {
        return Jwts.builder()
                .subject("emp:" + employeeId)
                .claims(Map.of("tenantId", tenantId, "employeeId", employeeId))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EMPLOYEE_TOKEN_TTL))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractSubject(String token) {
        return parseClaims(token).getSubject();
    }

    // Alias usado por JwtAuthFilter para tokens de usuario estándar.
    public String extractEmail(String token) {
        return extractSubject(token);
    }

    public Long extractTenantId(String token) {
        Object tenantId = parseClaims(token).get("tenantId");
        if (tenantId instanceof Integer i) return i.longValue();
        return (Long) tenantId;
    }

    public Long extractEmployeeId(String token) {
        Object employeeId = parseClaims(token).get("employeeId");
        if (employeeId instanceof Integer i) return i.longValue();
        return (Long) employeeId;
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String email = extractEmail(token);
        return email.equals(userDetails.getUsername()) && !isExpired(token);
    }

    public boolean isExpired(String token) {
        return parseClaims(token).getExpiration().before(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }
}
