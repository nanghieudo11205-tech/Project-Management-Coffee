package com.qlcafe.backend.dto;

import lombok.Data;

@Data
public class CheckoutRequest {
    private String paymentMethod = "CASH";
}
