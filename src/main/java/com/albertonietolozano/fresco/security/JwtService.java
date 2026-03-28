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

    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    public String generateToken(UserDetails userDetails, Long tenantId) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                // El tenantId se incluye en el payload para recuperarlo en cada petición sin consultar BD.
                .claims(Map.of("tenantId", tenantId))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getExpiration()))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public Long extractTenantId(String token) {
        Object tenantId = parseClaims(token).get("tenantId");
        // Jackson deserializa números pequeños como Integer; el pattern matching evita el cast explícito.
        if (tenantId instanceof Integer i) {
            return i.longValue();
        }
        return (Long) tenantId;
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String email = extractEmail(token);
        return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return parseClaims(token).getExpiration().before(new Date());
    }

    private Claims parseClaims(String token) {
        // verifyWith comprueba la firma antes de devolver el payload; lanza excepción si el token fue manipulado.
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
