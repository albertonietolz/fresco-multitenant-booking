package com.albertonietolozano.fresco.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

// Entidad que representa un empleado de un tenant.
@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tenantId;

    private Long userId;

    @Column(nullable = false)
    private String name;

    private String email;

    private String phone;

    @Column(nullable = false)
    private Boolean active;

    // PIN en texto plano asignado por el dueño (visible en el dashboard para comunicárselo al empleado).
    private String pin;

    // BCrypt del PIN (para la autenticación en el portal de empleados).
    private String pinHash;

    // Vacío = atiende todos los servicios; con IDs = solo esos servicios.
    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "employee_services", joinColumns = @JoinColumn(name = "employee_id"))
    @Column(name = "service_id")
    private List<Long> serviceIds = new ArrayList<>();
}
