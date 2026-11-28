package com.qlcafe.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "Vui lòng nhập tên đăng nhập hoặc email")
    private String identifier;
}
