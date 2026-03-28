package com.albertonietolozano.fresco.model;

import jakarta.persistence.*;
import lombok.*;

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
}
