package com.qlcafe.backend.dto;

import com.qlcafe.backend.entity.Account;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponse {
    private Integer id;
    private String username;
    private String email;
    private String role;
    private Boolean isActive;
    private boolean googleLinked;

    public static AccountResponse fromEntity(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .username(account.getUsername())
                .email(account.getEmail())
                .role(account.getRole())
                .isActive(Boolean.TRUE.equals(account.getIsActive()))
                .googleLinked(account.getGoogleId() != null && !account.getGoogleId().isBlank())
                .build();
    }
}
