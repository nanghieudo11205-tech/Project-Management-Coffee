package com.qlcafe.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Account")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = true, length = 255)
    private String password;

    @Column(length = 100)
    private String email;

    @Column(name = "google_id", length = 100)
    private String googleId;

    @Column(nullable = false, length = 20)
    private String role;
}
