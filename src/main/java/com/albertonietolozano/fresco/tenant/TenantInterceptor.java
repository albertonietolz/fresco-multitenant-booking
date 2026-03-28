package com.albertonietolozano.fresco.tenant;

import com.albertonietolozano.fresco.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

// Interceptor que extrae el tenantId del token JWT y lo establece en TenantContext antes de cada petición autenticada.
@Component
public class TenantInterceptor implements HandlerInterceptor {

    private final JwtService jwtService;

    public TenantInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()) {
            // Se vuelve a leer el token del header porque Spring Security almacena UserDetails, no el token raw.
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                Long tenantId = jwtService.extractTenantId(token);
                TenantContext.setTenantId(tenantId);
            }
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        TenantContext.clear();
    }
}
