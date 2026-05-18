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
}
