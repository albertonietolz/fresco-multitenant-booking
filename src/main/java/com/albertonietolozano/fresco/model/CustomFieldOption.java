package com.albertonietolozano.fresco.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "custom_field_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomFieldOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "custom_field_id", nullable = false)
    private Long customFieldId;

    @Column(nullable = false)
    private String label;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
