package com.qlcafe.backend.service;

import com.qlcafe.backend.dto.AccountRequest;
import com.qlcafe.backend.dto.AccountResponse;
import com.qlcafe.backend.entity.Account;
import com.qlcafe.backend.exception.BusinessException;
import com.qlcafe.backend.exception.ConflictException;
import com.qlcafe.backend.exception.ResourceNotFoundException;
import com.qlcafe.backend.repository.AccountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class AccountService {
    private static final Set<String> VALID_ROLES = Set.of("ADMIN", "MANAGER", "EMPLOYEE", "STAFF");

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public AccountService(AccountRepository accountRepository, PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(AccountResponse::fromEntity)
                .toList();
    }

    public AccountResponse getAccountById(Integer id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + id));
        return AccountResponse.fromEntity(account);
    }

    @Transactional
    public AccountResponse createAccount(AccountRequest request) {
        if (request == null || request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new BusinessException("Tên đăng nhập không được để trống");
        }
        String username = request.getUsername().trim();
        if (accountRepository.findByUsername(username).isPresent()) {
            throw new ConflictException("Tên đăng nhập đã tồn tại");
        }

        String normalizedEmail = normalizeEmail(request.getEmail());
        if (normalizedEmail != null && accountRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            throw new ConflictException("Email đã được liên kết với tài khoản khác");
        }

        String role = resolveRole(request.getRole());
        String encodedPassword = null;
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            if (request.getPassword().length() < 6) {
                throw new BusinessException("Mật khẩu phải có ít nhất 6 ký tự");
            }
            encodedPassword = passwordEncoder.encode(request.getPassword());
        } else if (normalizedEmail == null) {
            throw new BusinessException("Mật khẩu không được để trống nếu chưa liên kết email Google");
        }

        Account account = new Account();
        account.setUsername(username);
        account.setPassword(encodedPassword);
        account.setEmail(normalizedEmail);
        account.setGoogleId(normalizeOptional(request.getGoogleId()));
        account.setRole(role);
        account.setIsActive(request.getIsActive() == null || request.getIsActive());
        return AccountResponse.fromEntity(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse updateAccount(Integer id, AccountRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + id));

        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            account.setRole(resolveRole(request.getRole()));
        }
        if (request.getEmail() != null) {
            String normalizedEmail = normalizeEmail(request.getEmail());
            if (normalizedEmail != null && accountRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, id)) {
                throw new ConflictException("Email đã được liên kết với tài khoản khác");
            }
            account.setEmail(normalizedEmail);
        }
        if (request.getGoogleId() != null) {
            account.setGoogleId(normalizeOptional(request.getGoogleId()));
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            if (request.getPassword().length() < 6) {
                throw new BusinessException("Mật khẩu phải có ít nhất 6 ký tự");
            }
            account.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getIsActive() != null) {
            if (!request.getIsActive()) {
                preventSelfLockOrDelete(account, "Không thể tự khóa tài khoản đang đăng nhập");
            }
            account.setIsActive(request.getIsActive());
        }

        return AccountResponse.fromEntity(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse updateAccountStatus(Integer id, boolean active) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + id));
        if (!active) {
            preventSelfLockOrDelete(account, "Không thể tự khóa tài khoản đang đăng nhập");
        }
        account.setIsActive(active);
        return AccountResponse.fromEntity(accountRepository.save(account));
    }

    @Transactional
    public void deleteAccount(Integer id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + id));
        preventSelfLockOrDelete(account, "Không thể tự xóa tài khoản đang đăng nhập");
        accountRepository.delete(account);
    }

    private void preventSelfLockOrDelete(Account target, String message) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && target.getUsername().equalsIgnoreCase(auth.getName())) {
            throw new BusinessException(message);
        }
    }

    private String resolveRole(String rawRole) {
        if (rawRole == null || rawRole.trim().isEmpty()) {
            return "EMPLOYEE";
        }
        String normalized = rawRole.trim().toUpperCase();
        if (!VALID_ROLES.contains(normalized)) {
            throw new BusinessException("Vai trò không hợp lệ (chỉ chấp nhận ADMIN, MANAGER, EMPLOYEE hoặc STAFF)");
        }
        return normalized;
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String trimmed = email.trim().toLowerCase();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeOptional(String val) {
        if (val == null) {
            return null;
        }
        String trimmed = val.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
