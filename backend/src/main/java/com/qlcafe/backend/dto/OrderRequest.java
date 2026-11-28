package com.qlcafe.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {
    private Integer tableId;
    private String orderType;

    @NotEmpty(message = "Đơn hàng phải có ít nhất một món")
    @Valid
    private List<OrderDetailRequest> details;
}
