package com.qlcafe.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EmployeeRequest {
    @NotBlank(message = "Họ tên nhân viên không được để trống")
    private String fullName;

    private String phoneNumber;
    private String identityCard;
    private LocalDate dateOfBirth;
    private String position;
    private LocalDate hireDate;

    @DecimalMin(value = "0.0", inclusive = true, message = "Lương nhân viên không được âm")
    private BigDecimal salary;

    private Integer accountId;
    private Boolean isActive;
}
