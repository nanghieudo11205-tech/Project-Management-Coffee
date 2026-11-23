package com.qlcafe.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class EmployeeRequest {
    private String fullName;
    private String phoneNumber;
    private String identityCard;
    private LocalDate dateOfBirth;
    private String position;
    private LocalDate hireDate;
    private Double salary;
    private Integer accountId;
    private Boolean isActive;
}
