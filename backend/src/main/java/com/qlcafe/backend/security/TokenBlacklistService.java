package com.qlcafe.backend.security;

import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {
    private final Map<String, Date> blacklistedTokens = new ConcurrentHashMap<>();

    public void blacklist(String token, Date expiresAt) {
        if (token == null || token.isBlank()) {
            return;
        }
        Date expiry = expiresAt != null ? expiresAt : new Date(System.currentTimeMillis() + 86_400_000L);
        blacklistedTokens.put(token, expiry);
        cleanupExpired();
    }

    public boolean isBlacklisted(String token) {
        if (token == null) {
            return false;
        }
        Date expiry = blacklistedTokens.get(token);
        if (expiry == null) {
            return false;
        }
        if (expiry.before(new Date())) {
            blacklistedTokens.remove(token);
            return false;
        }
        return true;
    }

    private void cleanupExpired() {
        Date now = new Date();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue().before(now));
    }
}
