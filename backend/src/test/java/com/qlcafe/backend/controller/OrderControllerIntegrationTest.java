package com.qlcafe.backend.controller;

import com.qlcafe.backend.entity.*;
import com.qlcafe.backend.repository.*;
import com.qlcafe.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenProvider tokenProvider;

    @MockBean private AccountRepository accountRepository;
    @MockBean private EmployeeRepository employeeRepository;
    @MockBean private CafeTableRepository cafeTableRepository;
    @MockBean private ProductRepository productRepository;
    @MockBean private OrderRepository orderRepository;
    @MockBean private OrderDetailRepository orderDetailRepository;
    @MockBean private PaymentRepository paymentRepository;
    @MockBean private CategoryRepository categoryRepository;

    private Account staffAccount;
    private Account adminAccount;
    private CafeTable table1;
    private CafeTable table2;
    private Product coffee;
    private String staffToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        staffAccount = new Account(10, "staff_p5", "hash", "staff@cafe.vn", null, "STAFF", true);
        adminAccount = new Account(11, "admin_p5", "hash", "admin@cafe.vn", null, "ADMIN", true);
        table1 = new CafeTable(1, "Bàn 1", "AVAILABLE");
        table2 = new CafeTable(2, "Bàn 2", "AVAILABLE");
        coffee = new Product(1, "Cà phê Đen Đá", new BigDecimal("25000.00"), null, null, true);

        when(accountRepository.findByUsername("staff_p5")).thenReturn(Optional.of(staffAccount));
        when(accountRepository.findByUsername("admin_p5")).thenReturn(Optional.of(adminAccount));
        when(employeeRepository.findByAccountId(10)).thenReturn(Optional.empty());
        when(employeeRepository.findByAccountId(11)).thenReturn(Optional.empty());

        staffToken = tokenProvider.generateToken("staff_p5", "STAFF");
        adminToken = tokenProvider.generateToken("admin_p5", "ADMIN");
    }

    @Test
    void createDineInOrder_returns201AndMarksTableOccupied() throws Exception {
        when(cafeTableRepository.findByIdWithLock(1)).thenReturn(Optional.of(table1));
        when(orderRepository.existsByCafeTableIdAndStatus(1, "PENDING")).thenReturn(false);
        when(productRepository.findById(1)).thenReturn(Optional.of(coffee));
        when(cafeTableRepository.save(any(CafeTable.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(101);
            return o;
        });

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tableId\":1,\"orderType\":\"DINE_IN\",\"details\":[{\"productId\":1,\"quantity\":2}]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.orderType").value("DINE_IN"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.totalAmount").value(50000.00));
    }

    @Test
    void createTakeawayOrder_returns201WithoutTable() throws Exception {
        when(productRepository.findById(1)).thenReturn(Optional.of(coffee));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(102);
            return o;
        });

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tableId\":null,\"orderType\":\"TAKEAWAY\",\"details\":[{\"productId\":1,\"quantity\":1}]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(102))
                .andExpect(jsonPath("$.orderType").value("TAKEAWAY"))
                .andExpect(jsonPath("$.totalAmount").value(25000.00));
    }

    @Test
    void checkoutAndDuplicateCheckout_returns200Then409() throws Exception {
        table1.setStatus("OCCUPIED");
        Order order = new Order();
        order.setId(103);
        order.setCafeTable(table1);
        order.setAccount(staffAccount);
        order.setStatus("PENDING");
        order.setOrderType("DINE_IN");
        order.setCreatedAt(LocalDateTime.now());
        order.setOrderDetails(new ArrayList<>(List.of(
                new OrderDetail(1, order, coffee, 2, new BigDecimal("25000.00"), null)
        )));

        when(orderRepository.findByIdWithLock(103)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrderIdAndPaymentStatus(103, "SUCCESS")).thenReturn(false);
        when(paymentRepository.findByOrderId(103)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId(1);
            return p;
        });
        when(cafeTableRepository.findByIdWithLock(1)).thenReturn(Optional.of(table1));
        when(cafeTableRepository.save(any(CafeTable.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        // First checkout -> 200 OK
        mockMvc.perform(put("/api/orders/103/checkout")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentMethod\":\"BANKING\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.paymentMethod").value("BANKING"))
                .andExpect(jsonPath("$.payment.paymentStatus").value("SUCCESS"));

        // Second checkout on PAID order -> 409 Conflict
        mockMvc.perform(put("/api/orders/103/checkout")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentMethod\":\"CASH\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void cancelOrder_returns200AndFreesTable() throws Exception {
        table1.setStatus("OCCUPIED");
        Order order = new Order();
        order.setId(104);
        order.setCafeTable(table1);
        order.setAccount(staffAccount);
        order.setStatus("PENDING");
        order.setOrderType("DINE_IN");

        when(orderRepository.findByIdWithLock(104)).thenReturn(Optional.of(order));
        when(cafeTableRepository.findByIdWithLock(1)).thenReturn(Optional.of(table1));
        when(cafeTableRepository.save(any(CafeTable.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(put("/api/orders/104/cancel")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void transferTable_returns200AndMovesOrder() throws Exception {
        table1.setStatus("OCCUPIED");
        Order order = new Order();
        order.setId(105);
        order.setCafeTable(table1);
        order.setAccount(staffAccount);
        order.setStatus("PENDING");
        order.setOrderType("DINE_IN");

        when(orderRepository.findByIdWithLock(105)).thenReturn(Optional.of(order));
        when(cafeTableRepository.findByIdWithLock(1)).thenReturn(Optional.of(table1));
        when(cafeTableRepository.findByIdWithLock(2)).thenReturn(Optional.of(table2));
        when(orderRepository.existsByCafeTableIdAndStatus(2, "PENDING")).thenReturn(false);
        when(cafeTableRepository.save(any(CafeTable.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(put("/api/orders/105/transfer-table")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetTableId\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cafeTable.id").value(2));
    }

    @Test
    void rbac_staffVsAdmin_enforcedCorrectly() throws Exception {
        when(accountRepository.findAll()).thenReturn(List.of(staffAccount, adminAccount));
        when(orderRepository.findDailyRevenue()).thenReturn(List.of());

        // STAFF cannot view accounts or revenue -> 403
        mockMvc.perform(get("/api/accounts").header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/revenue/stats").header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());

        // ADMIN can view accounts and revenue -> 200
        mockMvc.perform(get("/api/accounts").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/revenue/stats").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }
}
