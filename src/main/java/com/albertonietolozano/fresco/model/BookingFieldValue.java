package com.albertonietolozano.fresco.model;

import jakarta.persistence.*;
import lombok.*;

// Entidad que almacena el valor de un campo personalizado para una reserva concreta.
@Entity
@Table(name = "booking_field_values")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingFieldValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long bookingId;

    @Column(nullable = false)
    private Long customFieldId;

    private String value;
}
