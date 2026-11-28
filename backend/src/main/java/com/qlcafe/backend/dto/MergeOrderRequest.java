package com.qlcafe.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MergeOrderRequest {
    @NotNull(message = "Đơn hàng nguồn cần gộp không được để trống")
    private Integer sourceOrderId;
}
