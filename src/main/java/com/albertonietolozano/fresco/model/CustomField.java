package com.albertonietolozano.fresco.model;

import com.albertonietolozano.fresco.model.enums.FieldType;
import jakarta.persistence.*;
import lombok.*;

// Entidad que define un campo personalizado asociado a un tenant o a un servicio concreto.
@Entity
@Table(name = "custom_fields")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomField {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tenantId;

    private Long serviceId;

    @Column(nullable = false)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FieldType fieldType;

    @Column(nullable = false)
    private Boolean required;

    private Integer fieldOrder;
}
