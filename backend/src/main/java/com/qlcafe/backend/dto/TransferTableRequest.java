package com.qlcafe.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TransferTableRequest {
    @NotNull(message = "Bàn đích không được để trống")
    private Integer targetTableId;
}
