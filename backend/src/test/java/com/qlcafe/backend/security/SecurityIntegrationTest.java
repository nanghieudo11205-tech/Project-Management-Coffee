package com.qlcafe.backend.security;

import com.qlcafe.backend.entity.Account;
import com.qlcafe.backend.entity.Employee;
import com.qlcafe.backend.repository.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @MockBean private AccountRepository accountRepository;
    @MockBean private EmployeeRepository employeeRepository;
    @MockBean private OrderRepository orderRepository;
    @MockBean private OrderDetailRepository orderDetailRepository;
    @MockBean private CafeTableRepository cafeTableRepository;
    @MockBean private ProductRepository productRepository;
    @MockBean private CategoryRepository categoryRepository;
    @MockBean private PaymentRepository paymentRepository;

    private Account adminAccount;
    private Account managerAccount;
    private Account employeeAccount;
    private Account lockedAccount;

    @BeforeEach
    void setUp() {
        String encodedPwd = passwordEncoder.encode("Secret@123");
        adminAccount = new Account(1, "admin_test", encodedPwd, "admin@cafe.vn", null, "ADMIN", true);
        managerAccount = new Account(2, "manager_test", encodedPwd, "manager@cafe.vn", null, "MANAGER", true);
        employeeAccount = new Account(3, "emp_test", encodedPwd, "emp@cafe.vn", null, "EMPLOYEE", true);
        lockedAccount = new Account(4, "locked_test", encodedPwd, "locked@cafe.vn", null, "EMPLOYEE", false);

        when(accountRepository.findByUsername("admin_test")).thenReturn(Optional.of(adminAccount));
        when(accountRepository.findByUsername("manager_test")).thenReturn(Optional.of(managerAccount));
        when(accountRepository.findByUsername("emp_test")).thenReturn(Optional.of(employeeAccount));
        when(accountRepository.findByUsername("locked_test")).thenReturn(Optional.of(lockedAccount));
        when(accountRepository.findAll()).thenReturn(List.of(adminAccount, managerAccount, employeeAccount));

        when(employeeRepository.findByAccountId(1)).thenReturn(Optional.empty());
        when(employeeRepository.findByAccountId(2)).thenReturn(Optional.empty());
        when(employeeRepository.findByAccountId(3)).thenReturn(Optional.empty());
        when(employeeRepository.findByAccountId(4)).thenReturn(Optional.empty());
        when(employeeRepository.findAll()).thenReturn(List.of(
                new Employee(1, "Nguyễn Văn A", "0901234567", null, null, "Barista", null, null, employeeAccount, true)
        ));
        when(orderRepository.findDailyRevenue()).thenReturn(Collections.emptyList());
        when(cafeTableRepository.findByStatusNot("DELETED")).thenReturn(Collections.emptyList());
    }

    @Test
    void login_withWrongPassword_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin_test\",\"password\":\"WrongPass\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withLockedAccount_returns403() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"locked_test\",\"password\":\"Secret@123\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void protectedEndpoints_withoutToken_return401() throws Exception {
        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        mockMvc.perform(get("/api/accounts"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void expiredToken_returns401WithMessage() throws Exception {
        String expiredJwt = Jwts.builder()
                .setSubject("admin_test")
                .setIssuedAt(new Date(System.currentTimeMillis() - 120_000))
                .setExpiration(new Date(System.currentTimeMillis() - 60_000))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS512)
                .compact();

        mockMvc.perform(get("/api/orders")
                        .header("Authorization", "Bearer " + expiredJwt))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("hết hạn")));
    }

    @Test
    void logout_invalidatesTokenImmediately() throws Exception {
        String token = tokenProvider.generateToken("emp_test", "EMPLOYEE");

        mockMvc.perform(get("/api/tables")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/tables")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("đăng xuất")));
    }

    @Test
    void employee_cannotAccessAdminOrManagerEndpoints_returns403() throws Exception {
        String empToken = tokenProvider.generateToken("emp_test", "EMPLOYEE");

        // Employee CAN access tables
        mockMvc.perform(get("/api/tables").header("Authorization", "Bearer " + empToken))
                .andExpect(status().isOk());

        // Employee CANNOT access accounts, employees, revenue, create category/product
        mockMvc.perform(get("/api/accounts").header("Authorization", "Bearer " + empToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/accounts/1")
                        .header("Authorization", "Bearer " + empToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/employees").header("Authorization", "Bearer " + empToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/revenue/stats").header("Authorization", "Bearer " + empToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + empToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void manager_canAccessEmployeesAndRevenue_butCannotAccessAccounts_returns403() throws Exception {
        String managerToken = tokenProvider.generateToken("manager_test", "MANAGER");

        mockMvc.perform(get("/api/employees").header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/revenue/stats").header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/accounts").header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void apiResponses_neverExposePasswordField() throws Exception {
        String adminToken = tokenProvider.generateToken("admin_test", "ADMIN");

        mockMvc.perform(get("/api/accounts").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString("password"))))
                .andExpect(content().string(not(containsString("$2a$"))));

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString("password"))))
                .andExpect(content().string(not(containsString("$2a$"))));

        mockMvc.perform(get("/api/employees").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString("password"))))
                .andExpect(content().string(not(containsString("$2a$"))));
    }
}
