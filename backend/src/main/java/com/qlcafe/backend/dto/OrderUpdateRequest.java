package com.qlcafe.backend.dto;

import jakarta.validation.Valid;
import lombok.Data;

import java.util.List;

@Data
public class OrderUpdateRequest {
    private Integer tableId;
    private String status;
    private String orderType;

    @Valid
    private List<OrderDetailRequest> details;
}
