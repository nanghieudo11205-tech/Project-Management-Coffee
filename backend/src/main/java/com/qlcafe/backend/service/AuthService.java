package com.qlcafe.backend.service;

import com.qlcafe.backend.dto.AccountResponse;
import com.qlcafe.backend.dto.AuthRequest;
import com.qlcafe.backend.dto.AuthResponse;
import com.qlcafe.backend.dto.ForgotPasswordRequest;
import com.qlcafe.backend.dto.GoogleAuthRequest;
import com.qlcafe.backend.dto.ResetPasswordRequest;
import com.qlcafe.backend.entity.Account;
import com.qlcafe.backend.entity.Employee;
import com.qlcafe.backend.exception.BusinessException;
import com.qlcafe.backend.exception.ConflictException;
import com.qlcafe.backend.exception.ResourceNotFoundException;
import com.qlcafe.backend.repository.AccountRepository;
import com.qlcafe.backend.repository.EmployeeRepository;
import com.qlcafe.backend.security.JwtTokenProvider;
import com.qlcafe.backend.security.TokenBlacklistService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {
    private static final Set<String> VALID_ROLES = Set.of("ADMIN", "MANAGER", "EMPLOYEE", "STAFF");

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final AccountRepository accountRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.google.client-id:}")
    private String googleClientId;

    @Value("${app.google.allow-mock:false}")
    private boolean allowGoogleMock;

    @Value("${app.google.allow-auto-register:false}")
    private boolean allowGoogleAutoRegister;

    @Value("${app.auth.allow-self-register:true}")
    private boolean allowSelfRegister;

    private final Map<String, ResetCodeEntry> resetCodes = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    private record ResetCodeEntry(String code, Instant expiresAt) {}

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtTokenProvider tokenProvider,
            TokenBlacklistService tokenBlacklistService,
            AccountRepository accountRepository,
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.tokenBlacklistService = tokenBlacklistService;
        this.accountRepository = accountRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse login(AuthRequest request) {
        if (request == null || request.getUsername() == null || request.getUsername().trim().isEmpty()
                || request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new BusinessException("Tên đăng nhập và mật khẩu không được để trống");
        }

        String username = request.getUsername().trim();
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Tên đăng nhập hoặc mật khẩu không đúng"));
        String jwt = tokenProvider.generateToken(authentication);
        return new AuthResponse(jwt, account.getUsername(), account.getRole());
    }

    @Transactional
    public void register(AuthRequest request) {
        if (!allowSelfRegister) {
            throw new AccessDeniedException("Hệ thống hiện tắt tự đăng ký. Vui lòng liên hệ Quản trị viên để cấp tài khoản.");
        }
        if (request == null || request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new BusinessException("Tên đăng nhập không được để trống");
        }
        String username = request.getUsername().trim();
        if (username.length() < 3 || username.length() > 50) {
            throw new BusinessException("Tên đăng nhập phải từ 3 đến 50 ký tự");
        }
        validatePasswordPolicy(request.getPassword());

        if (accountRepository.findByUsername(username).isPresent()) {
            throw new ConflictException("Tên đăng nhập đã tồn tại");
        }

        Account account = new Account();
        account.setUsername(username);
        account.setPassword(passwordEncoder.encode(request.getPassword()));
        account.setRole("EMPLOYEE");
        account.setIsActive(true);
        accountRepository.save(account);
    }

    public String requestPasswordReset(ForgotPasswordRequest request) {
        String identifier = request.getIdentifier().trim();
        Account account = accountRepository.findByUsername(identifier)
                .or(() -> accountRepository.findByEmailIgnoreCase(identifier))
                .orElse(null);

        if (account != null && Boolean.TRUE.equals(account.getIsActive())) {
            String code = String.format("%06d", secureRandom.nextInt(1_000_000));
            resetCodes.put(account.getUsername(), new ResetCodeEntry(code, Instant.now().plusSeconds(900)));
        }
        return "Nếu tài khoản tồn tại và đang hoạt động, yêu cầu khôi phục mật khẩu đã được ghi nhận. Vui lòng liên hệ Quản trị viên để được hỗ trợ cấp lại mật khẩu.";
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String username = request.getUsername().trim();
        ResetCodeEntry entry = resetCodes.get(username);
        if (entry == null || entry.expiresAt().isBefore(Instant.now()) || !entry.code().equals(request.getResetCode().trim())) {
            throw new BusinessException("Mã xác nhận không hợp lệ hoặc đã hết hạn");
        }
        validatePasswordPolicy(request.getNewPassword());
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
        ensureAccountIsActive(account);
        account.setPassword(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(account);
        resetCodes.remove(username);
    }

    private void validatePasswordPolicy(String password) {
        if (password == null || password.length() < 8) {
            throw new BusinessException("Mật khẩu phải có ít nhất 8 ký tự");
        }
        boolean hasLetter = password.chars().anyMatch(Character::isLetter);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        if (!hasLetter || !hasDigit) {
            throw new BusinessException("Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số");
        }
    }

    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            try {
                Date expiry = tokenProvider.getExpirationDateFromJWT(token);
                tokenBlacklistService.blacklist(token, expiry);
            } catch (Exception ignored) {
                // Token đã hết hạn hoặc không hợp lệ thì không cần đưa vào blacklist
            }
        }
        SecurityContextHolder.clearContext();
    }

    public AccountResponse getCurrentUser(String username) {
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
        return AccountResponse.fromEntity(account);
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        if (request == null || request.getIdToken() == null || request.getIdToken().trim().isEmpty()) {
            throw new BusinessException("Google ID token không được để trống");
        }

        String idToken = request.getIdToken().trim();
        String email;
        String googleSub = null;

        if (idToken.startsWith("demo-google-token-") || idToken.startsWith("mock-google-token-")) {
            if (!allowGoogleMock) {
                throw new BadCredentialsException("Chế độ Google mock đang tắt. Vui lòng dùng Google ID Token hợp lệ.");
            }
            email = idToken.replace("demo-google-token-", "").replace("mock-google-token-", "");
            if (!email.contains("@")) {
                email = email + "@gmail.com";
            }
        } else {
            Map<String, Object> body = verifyGoogleTokenWithGoogle(idToken);
            Object emailVerifiedObj = body.get("email_verified");
            if (emailVerifiedObj != null && !"true".equalsIgnoreCase(String.valueOf(emailVerifiedObj))) {
                throw new BadCredentialsException("Email Google chưa được xác minh");
            }

            if (googleClientId != null && !googleClientId.trim().isEmpty()) {
                String aud = (String) body.get("aud");
                if (!googleClientId.trim().equals(aud)) {
                    throw new BadCredentialsException("Google Client ID không khớp với cấu hình hệ thống");
                }
            }

            email = (String) body.get("email");
            googleSub = body.get("sub") != null ? String.valueOf(body.get("sub")) : null;
        }

        if (email == null || email.trim().isEmpty()) {
            throw new BadCredentialsException("Không thể xác định email tài khoản Google");
        }
        final String normalizedEmail = email.toLowerCase().trim();

        Account account = findAccountForGoogle(googleSub, normalizedEmail);
        if (account == null) {
            if (!allowGoogleAutoRegister) {
                throw new AccessDeniedException(
                        "Tài khoản Google (" + normalizedEmail + ") chưa được liên kết hoặc chưa được cấp quyền truy cập hệ thống"
                );
            }
            account = new Account();
            account.setUsername(normalizedEmail);
            account.setEmail(normalizedEmail);
            account.setGoogleId(googleSub);
            account.setPassword(null);
            account.setRole("EMPLOYEE");
            account.setIsActive(true);
            account = accountRepository.save(account);
        } else {
            ensureAccountIsActive(account);
            if (!VALID_ROLES.contains(account.getRole())) {
                throw new AccessDeniedException("Vai trò tài khoản không hợp lệ để truy cập hệ thống");
            }
            boolean updated = false;
            if (googleSub != null && (account.getGoogleId() == null || account.getGoogleId().isBlank())) {
                account.setGoogleId(googleSub);
                updated = true;
            }
            if (account.getEmail() == null || account.getEmail().isBlank()) {
                account.setEmail(normalizedEmail);
                updated = true;
            }
            if (updated) {
                account = accountRepository.save(account);
            }
        }

        String jwt = tokenProvider.generateToken(account.getUsername(), account.getRole());
        return new AuthResponse(jwt, account.getUsername(), account.getRole());
    }

    private Map<String, Object> verifyGoogleTokenWithGoogle(String idToken) {
        try {
            String googleVerifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    googleVerifyUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("email")) {
                throw new BadCredentialsException("Không tìm thấy thông tin email từ Google Token");
            }
            return body;
        } catch (BadCredentialsException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadCredentialsException("Xác thực tài khoản Google thất bại hoặc token đã hết hạn");
        }
    }

    private Account findAccountForGoogle(String googleSub, String normalizedEmail) {
        if (googleSub != null && !googleSub.isBlank()) {
            Account bySub = accountRepository.findByGoogleId(googleSub).orElse(null);
            if (bySub != null) {
                return bySub;
            }
        }
        return accountRepository.findByEmailIgnoreCase(normalizedEmail)
                .or(() -> accountRepository.findByUsername(normalizedEmail))
                .orElse(null);
    }

    private void ensureAccountIsActive(Account account) {
        if (!Boolean.TRUE.equals(account.getIsActive())) {
            throw new DisabledException("Tài khoản đã bị khóa hoặc ngừng hoạt động");
        }
        Employee linkedEmployee = employeeRepository.findByAccountId(account.getId()).orElse(null);
        if (linkedEmployee != null && Boolean.FALSE.equals(linkedEmployee.getIsActive())) {
            throw new DisabledException("Nhân viên liên kết với tài khoản đã ngừng hoạt động");
        }
    }
}
