package com.qlcafe.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "Employee")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "identity_card", length = 20)
    private String identityCard;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 50)
    private String position;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    private Double salary;

    @OneToOne
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "is_active")
    private Boolean isActive = true;
}
