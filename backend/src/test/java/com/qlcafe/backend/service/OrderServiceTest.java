package com.qlcafe.backend.service;

import com.qlcafe.backend.dto.CheckoutRequest;
import com.qlcafe.backend.dto.OrderDetailRequest;
import com.qlcafe.backend.dto.OrderRequest;
import com.qlcafe.backend.entity.*;
import com.qlcafe.backend.exception.BusinessException;
import com.qlcafe.backend.exception.ConflictException;
import com.qlcafe.backend.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CafeTableRepository cafeTableRepository;
    @Mock private ProductRepository productRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private PaymentRepository paymentRepository;

    @InjectMocks
    private OrderService orderService;

    private Account staffAccount;
    private Product coffee;
    private Product tea;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("staff1", "pwd")
        );
        staffAccount = new Account(1, "staff1", "hash", null, null, "STAFF", true);
        coffee = new Product(10, "Cà phê đen", new BigDecimal("25000.00"), null, null, true);
        tea = new Product(11, "Trà đào", new BigDecimal("45000.00"), null, null, true);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createOrder_shouldRejectOccupiedTable() {
        CafeTable occupiedTable = new CafeTable(1, "Bàn 1", "OCCUPIED");
        when(accountRepository.findByUsername("staff1")).thenReturn(Optional.of(staffAccount));
        when(cafeTableRepository.findByIdWithLock(1)).thenReturn(Optional.of(occupiedTable));

        OrderRequest req = new OrderRequest();
        req.setTableId(1);
        OrderDetailRequest item = new OrderDetailRequest();
        item.setProductId(10);
        item.setQuantity(1);
        req.setDetails(List.of(item));

        assertThrows(ConflictException.class, () -> orderService.createOrder(req));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createOrder_takeaway_shouldSucceedWithoutTable() {
        when(accountRepository.findByUsername("staff1")).thenReturn(Optional.of(staffAccount));
        when(productRepository.findById(10)).thenReturn(Optional.of(coffee));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderRequest req = new OrderRequest();
        req.setTableId(null);
        OrderDetailRequest item = new OrderDetailRequest();
        item.setProductId(10);
        item.setQuantity(2);
        req.setDetails(List.of(item));

        Order created = orderService.createOrder(req);
        assertEquals("TAKEAWAY", created.getOrderType());
        assertNull(created.getCafeTable());
        assertEquals(new BigDecimal("50000.00"), created.getTotalAmount());
        assertEquals("PENDING", created.getStatus());
    }

    @Test
    void createOrder_shouldRejectNonPositiveQuantity() {
        when(accountRepository.findByUsername("staff1")).thenReturn(Optional.of(staffAccount));
        CafeTable available = new CafeTable(1, "Bàn 1", "AVAILABLE");
        when(cafeTableRepository.findByIdWithLock(1)).thenReturn(Optional.of(available));

        OrderRequest req = new OrderRequest();
        req.setTableId(1);
        OrderDetailRequest item = new OrderDetailRequest();
        item.setProductId(10);
        item.setQuantity(0);
        req.setDetails(List.of(item));

        assertThrows(BusinessException.class, () -> orderService.createOrder(req));
    }

    @Test
    void transferTable_shouldMoveOrderAndSwapTableStatuses() {
        CafeTable table1 = new CafeTable(1, "Bàn 1", "OCCUPIED");
        CafeTable table2 = new CafeTable(2, "Bàn 2", "AVAILABLE");

        Order order = new Order();
        order.setId(100);
        order.setStatus("PENDING");
        order.setCafeTable(table1);
        order.setOrderType("DINE_IN");

        when(orderRepository.findByIdWithLock(100)).thenReturn(Optional.of(order));
        when(cafeTableRepository.findByIdWithLock(1)).thenReturn(Optional.of(table1));
        when(cafeTableRepository.findByIdWithLock(2)).thenReturn(Optional.of(table2));
        when(orderRepository.existsByCafeTableIdAndStatus(2, "PENDING")).thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        Order result = orderService.transferTable(100, 2);

        assertEquals("AVAILABLE", table1.getStatus());
        assertEquals("OCCUPIED", table2.getStatus());
        assertEquals(2, result.getCafeTable().getId());
    }

    @Test
    void mergeOrders_shouldCombineItemsCancelSourceAndFreeTable() {
        CafeTable table1 = new CafeTable(1, "Bàn 1", "OCCUPIED");
        CafeTable table2 = new CafeTable(2, "Bàn 2", "OCCUPIED");

        Order target = new Order();
        target.setId(10);
        target.setStatus("PENDING");
        target.setCafeTable(table1);
        target.setOrderDetails(new ArrayList<>(List.of(
                new OrderDetail(1, target, coffee, 1, new BigDecimal("25000.00"), null)
        )));

        Order source = new Order();
        source.setId(20);
        source.setStatus("PENDING");
        source.setCafeTable(table2);
        source.setOrderDetails(new ArrayList<>(List.of(
                new OrderDetail(2, source, coffee, 2, new BigDecimal("25000.00"), null),
                new OrderDetail(3, source, tea, 1, new BigDecimal("45000.00"), null)
        )));

        when(orderRepository.findByIdWithLock(10)).thenReturn(Optional.of(target));
        when(orderRepository.findByIdWithLock(20)).thenReturn(Optional.of(source));
        when(cafeTableRepository.findByIdWithLock(2)).thenReturn(Optional.of(table2));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        Order merged = orderService.mergeOrders(10, 20);

        assertEquals(2, merged.getOrderDetails().size());
        assertEquals(new BigDecimal("120000.00"), merged.getTotalAmount());
        assertEquals("CANCELLED", source.getStatus());
        assertEquals(BigDecimal.ZERO, source.getTotalAmount());
        assertEquals("AVAILABLE", table2.getStatus());
    }

    @Test
    void checkout_shouldCreatePaymentFreeTableAndRejectDuplicate() {
        CafeTable table1 = new CafeTable(1, "Bàn 1", "OCCUPIED");
        Order order = new Order();
        order.setId(50);
        order.setStatus("PENDING");
        order.setCafeTable(table1);
        order.setOrderDetails(new ArrayList<>(List.of(
                new OrderDetail(1, order, coffee, 2, new BigDecimal("25000.00"), null)
        )));

        when(orderRepository.findByIdWithLock(50)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrderIdAndPaymentStatus(50, "SUCCESS")).thenReturn(false);
        when(paymentRepository.findByOrderId(50)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(cafeTableRepository.findByIdWithLock(1)).thenReturn(Optional.of(table1));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest req = new CheckoutRequest();
        req.setPaymentMethod("BANKING");

        Order paid = orderService.checkout(50, req);

        assertEquals("PAID", paid.getStatus());
        assertEquals("BANKING", paid.getPaymentMethod());
        assertEquals(new BigDecimal("50000.00"), paid.getTotalAmount());
        assertNotNull(paid.getPayment());
        assertEquals("SUCCESS", paid.getPayment().getPaymentStatus());
        assertNotNull(paid.getPayment().getPaidAt());
        assertEquals("AVAILABLE", table1.getStatus());

        // Duplicate checkout must fail with ConflictException
        assertThrows(ConflictException.class, () -> orderService.checkout(50, req));
    }
}
