package com.qlcafe.backend.dto;
import lombok.Data;
import java.util.List;

@Data
public class OrderUpdateRequest {
    private Integer tableId;
    private String status;
    private String orderType;
    private String paymentMethod;
    private List<OrderDetailRequest> details;
}
