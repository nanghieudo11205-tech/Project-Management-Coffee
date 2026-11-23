package com.qlcafe.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private Integer tableId;
    private String orderType; // DINE_IN hoặc TAKEAWAY
    private String paymentMethod; // CASH hoặc BANKING
    private List<OrderDetailRequest> details;
}
