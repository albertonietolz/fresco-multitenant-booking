package com.albertonietolozano.fresco.security;

import com.albertonietolozano.fresco.model.Employee;
import com.albertonietolozano.fresco.repository.EmployeeRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

// Filtro HTTP que intercepta cada petición, extrae el JWT y establece la autenticación en el SecurityContext.
// Soporta dos tipos de token: usuario estándar (subject = email) y empleado (subject = "emp:{id}").
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final EmployeeRepository employeeRepository;

    public JwtAuthFilter(JwtService jwtService, UserDetailsService userDetailsService,
                         EmployeeRepository employeeRepository) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.employeeRepository = employeeRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7);
            String subject = jwtService.extractSubject(token);

            if (subject != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (subject.startsWith("emp:")) {
                    handleEmployeeToken(token, subject);
                } else {
                    handleUserToken(token, subject, request);
                }
            }
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private void handleEmployeeToken(String token, String subject) {
        if (jwtService.isExpired(token)) return;

        Long employeeId = jwtService.extractEmployeeId(token);
        Long tenantId = jwtService.extractTenantId(token);

        Optional<Employee> empOpt = employeeRepository.findById(employeeId);
        if (empOpt.isEmpty()) return;

        Employee emp = empOpt.get();
        // Verificar que el empleado sigue activo y pertenece al tenant del token.
        if (!emp.getActive() || !emp.getTenantId().equals(tenantId)) return;

        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                subject, null,
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );

        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(authToken);
        SecurityContextHolder.setContext(ctx);
    }

    private void handleUserToken(String token, String email, HttpServletRequest request) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

        if (jwtService.isTokenValid(token, userDetails)) {
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authToken);
            SecurityContextHolder.setContext(context);
        }
    }
}
