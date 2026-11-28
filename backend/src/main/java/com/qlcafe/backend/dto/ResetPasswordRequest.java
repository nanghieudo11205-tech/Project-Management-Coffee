package com.qlcafe.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;

    @NotBlank(message = "Mã xác nhận không được để trống")
    private String resetCode;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    private String newPassword;
}
