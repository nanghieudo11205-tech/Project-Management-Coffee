package com.qlcafe.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderDetailRequest {
    @NotNull(message = "Mã sản phẩm không được để trống")
    private Integer productId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng món phải lớn hơn 0")
    private Integer quantity;

    private String note;
}
