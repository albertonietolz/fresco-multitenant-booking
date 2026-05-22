package com.albertonietolozano.fresco.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long tenantId;

    private String name;

    private String email;

    private String phone;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private Long preferredEmployeeId;

    private Long preferredServiceId;
}
