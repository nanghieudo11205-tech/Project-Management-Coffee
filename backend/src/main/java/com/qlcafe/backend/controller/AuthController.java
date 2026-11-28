package com.qlcafe.backend.controller;

import com.qlcafe.backend.dto.AccountResponse;
import com.qlcafe.backend.dto.AuthRequest;
import com.qlcafe.backend.dto.AuthResponse;
import com.qlcafe.backend.dto.ForgotPasswordRequest;
import com.qlcafe.backend.dto.GoogleAuthRequest;
import com.qlcafe.backend.dto.MessageResponse;
import com.qlcafe.backend.dto.ResetPasswordRequest;
import com.qlcafe.backend.security.JwtAuthenticationFilter;
import com.qlcafe.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody AuthRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageResponse("Đăng ký tài khoản thành công"));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(new MessageResponse(authService.requestPasswordReset(request)));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(new MessageResponse("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại."));
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(HttpServletRequest request) {
        String token = JwtAuthenticationFilter.getJwtFromRequest(request);
        authService.logout(token);
        return ResponseEntity.ok(new MessageResponse("Đăng xuất thành công"));
    }

    @GetMapping("/me")
    public ResponseEntity<AccountResponse> me(Authentication authentication) {
        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }
}
