package com.qlcafe.backend.service;

import com.qlcafe.backend.dto.AuthResponse;
import com.qlcafe.backend.dto.GoogleAuthRequest;
import com.qlcafe.backend.entity.Account;
import com.qlcafe.backend.repository.AccountRepository;
import com.qlcafe.backend.repository.EmployeeRepository;
import com.qlcafe.backend.security.JwtTokenProvider;
import com.qlcafe.backend.security.TokenBlacklistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider tokenProvider;
    @Mock private TokenBlacklistService tokenBlacklistService;
    @Mock private AccountRepository accountRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "allowGoogleMock", true);
        ReflectionTestUtils.setField(authService, "allowGoogleAutoRegister", false);
    }

    @Test
    void googleLogin_whenMockDisabled_throwsBadCredentials() {
        ReflectionTestUtils.setField(authService, "allowGoogleMock", false);
        GoogleAuthRequest req = new GoogleAuthRequest();
        req.setIdToken("demo-google-token-staff@cafe.vn");

        assertThrows(BadCredentialsException.class, () -> authService.loginWithGoogle(req));
    }

    @Test
    void googleLogin_whenEmailNotLinkedInSystem_throwsAccessDenied() {
        GoogleAuthRequest req = new GoogleAuthRequest();
        req.setIdToken("demo-google-token-stranger@gmail.com");

        when(accountRepository.findByEmailIgnoreCase("stranger@gmail.com")).thenReturn(Optional.empty());
        when(accountRepository.findByUsername("stranger@gmail.com")).thenReturn(Optional.empty());

        assertThrows(AccessDeniedException.class, () -> authService.loginWithGoogle(req));
    }

    @Test
    void googleLogin_whenAccountLocked_throwsDisabledException() {
        GoogleAuthRequest req = new GoogleAuthRequest();
        req.setIdToken("demo-google-token-locked@cafe.vn");

        Account locked = new Account(5, "locked_emp", null, "locked@cafe.vn", null, "EMPLOYEE", false);
        when(accountRepository.findByEmailIgnoreCase("locked@cafe.vn")).thenReturn(Optional.of(locked));

        assertThrows(DisabledException.class, () -> authService.loginWithGoogle(req));
    }

    @Test
    void googleLogin_whenAccountLinkedAndActive_returnsJwt() {
        GoogleAuthRequest req = new GoogleAuthRequest();
        req.setIdToken("demo-google-token-nv1@cafe.vn");

        Account active = new Account(6, "nv1", null, "nv1@cafe.vn", null, "EMPLOYEE", true);
        when(accountRepository.findByEmailIgnoreCase("nv1@cafe.vn")).thenReturn(Optional.of(active));
        when(employeeRepository.findByAccountId(6)).thenReturn(Optional.empty());
        when(tokenProvider.generateToken("nv1", "EMPLOYEE")).thenReturn("jwt-token-123");

        AuthResponse res = authService.loginWithGoogle(req);

        assertEquals("jwt-token-123", res.getToken());
        assertEquals("nv1", res.getUsername());
        assertEquals("EMPLOYEE", res.getRole());
        verify(accountRepository, never()).save(any());
    }
}
