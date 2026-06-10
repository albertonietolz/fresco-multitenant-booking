package com.albertonietolozano.fresco.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tenantId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer duration;

    @Column
    private Integer capacity;

    /** Minutos de atención activa del profesional. Si se indica, el profesional queda libre después
     *  de este tiempo aunque la cita del cliente aún no haya terminado (p.ej. tiempo de espera de un tinte). */
    @Column
    private Integer chairTime;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Boolean active;

    @Column
    private Long defaultEmployeeId;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean allowPartySize = false;

    // "ANY" = cualquier día, "WEEKDAYS" = días concretos de la semana, "SPECIFIC" = fechas exactas.
    @Builder.Default
    @Column(nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'ANY'")
    private String schedulingMode = "ANY";

    // Días de la semana permitidos (CSV): "MONDAY,WEDNESDAY,FRIDAY"
    @Column(columnDefinition = "TEXT")
    private String allowedWeekdays;

    // Fechas concretas permitidas (CSV): "2026-06-01,2026-12-25"
    @Column(columnDefinition = "TEXT")
    private String specificDates;
}
