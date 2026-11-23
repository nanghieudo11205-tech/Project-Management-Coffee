package com.qlcafe.backend.service;

import com.qlcafe.backend.dto.OrderRequest;
import com.qlcafe.backend.dto.OrderUpdateRequest;
import com.qlcafe.backend.dto.OrderDetailRequest;
import com.qlcafe.backend.entity.CafeTable;
import com.qlcafe.backend.entity.Order;
import com.qlcafe.backend.entity.OrderDetail;
import com.qlcafe.backend.entity.Product;
import com.qlcafe.backend.repository.CafeTableRepository;
import com.qlcafe.backend.repository.OrderDetailRepository;
import com.qlcafe.backend.repository.OrderRepository;
import com.qlcafe.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import com.qlcafe.backend.entity.Account;
import com.qlcafe.backend.repository.AccountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final CafeTableRepository cafeTableRepository;
    private final ProductRepository productRepository;
    private final AccountRepository accountRepository;

    public OrderService(OrderRepository orderRepository, OrderDetailRepository orderDetailRepository,
            CafeTableRepository cafeTableRepository, ProductRepository productRepository,
            AccountRepository accountRepository) {
        this.orderRepository = orderRepository;
        this.orderDetailRepository = orderDetailRepository;
        this.cafeTableRepository = cafeTableRepository;
        this.productRepository = productRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public Order createOrder(OrderRequest request) {
        Order order = new Order();
        order.setCreatedAt(LocalDateTime.now());
        order.setStatus("PENDING");

        if (request.getTableId() != null) {
            CafeTable table = cafeTableRepository.findById(request.getTableId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn"));
            table.setStatus("OCCUPIED");
            cafeTableRepository.save(table);
            order.setCafeTable(table);
            order.setOrderType(request.getOrderType() != null ? request.getOrderType() : "DINE_IN");
        } else {
            order.setCafeTable(null);
            order.setOrderType("TAKEAWAY");
        }

        if (request.getPaymentMethod() != null) {
            order.setPaymentMethod(request.getPaymentMethod());
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
            Account account = accountRepository.findByUsername(auth.getName()).orElse(null);
            order.setAccount(account);
        }

        order = orderRepository.save(order);

        double totalAmount = 0;
        for (OrderDetailRequest detailReq : request.getDetails()) {
            Product product = productRepository.findById(detailReq.getProductId()).orElseThrow();
            OrderDetail detail = new OrderDetail();
            detail.setOrder(order);
            detail.setProduct(product);
            detail.setQuantity(detailReq.getQuantity());
            detail.setPrice(product.getPrice());
            detail.setNote(detailReq.getNote());
            orderDetailRepository.save(detail);
            totalAmount += product.getPrice() * detailReq.getQuantity();
        }

        order.setTotalAmount(totalAmount);
        return orderRepository.save(order);
    }

    @Transactional
    public Order checkout(Integer orderId, String paymentMethod) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus("PAID");

        if (paymentMethod != null && !paymentMethod.isBlank()) {
            order.setPaymentMethod(paymentMethod);
        }

        CafeTable table = order.getCafeTable();
        if (table != null) {
            table.setStatus("AVAILABLE");
            cafeTableRepository.save(table);
        }

        return orderRepository.save(order);
    }

    @Transactional
    public Order switchTable(Integer currentTableId, Integer targetTableId) {
        CafeTable currentTable = cafeTableRepository.findById(currentTableId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn hiện tại"));
        CafeTable targetTable = cafeTableRepository.findById(targetTableId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn muốn chuyển tới"));

        if (!"AVAILABLE".equalsIgnoreCase(targetTable.getStatus())) {
            throw new RuntimeException("Bàn đích đang có khách, không thể chuyển tới");
        }

        // Tìm đơn hàng đang phục vụ tại bàn hiện tại
        Order order = orderRepository.findAll().stream()
                .filter(o -> o.getCafeTable() != null 
                        && o.getCafeTable().getId().equals(currentTableId) 
                        && "PENDING".equalsIgnoreCase(o.getStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Bàn hiện tại không có đơn hàng đang phục vụ"));

        currentTable.setStatus("AVAILABLE");
        cafeTableRepository.save(currentTable);

        targetTable.setStatus("OCCUPIED");
        cafeTableRepository.save(targetTable);

        order.setCafeTable(targetTable);
        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrderById(Integer id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + id));
    }

    @Transactional
    public void deleteOrder(Integer id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + id));

        // Nếu đơn hàng đang PENDING, trả bàn về AVAILABLE
        if ("PENDING".equals(order.getStatus()) && order.getCafeTable() != null) {
            CafeTable table = order.getCafeTable();
            table.setStatus("AVAILABLE");
            cafeTableRepository.save(table);
        }

        // Cascade sẽ tự động xóa tất cả OrderDetail liên quan
        orderRepository.delete(order);
    }

    @Transactional
    public Order updateOrder(Integer id, OrderUpdateRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + id));

        String oldStatus = order.getStatus();

        // 1. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (Nếu có thay đổi)
        if (request.getStatus() != null) {
            order.setStatus(request.getStatus());
        }

        if (request.getOrderType() != null) {
            order.setOrderType(request.getOrderType());
        }

        if (request.getPaymentMethod() != null) {
            order.setPaymentMethod(request.getPaymentMethod());
        }

        // Kiểm tra xem có sự thay đổi bàn hay không
        boolean tableChanged = request.getTableId() != null &&
                (order.getCafeTable() == null || !order.getCafeTable().getId().equals(request.getTableId()));

        // =============================================================
        // HÀNH ĐỘNG A: GIẢI PHÓNG BÀN CŨ
        // =============================================================
        if (order.getCafeTable() != null) {
            boolean isOrderMovingToCompletedOrCancelled = "PAID".equalsIgnoreCase(request.getStatus())
                    || "CANCELLED".equalsIgnoreCase(request.getStatus());
            boolean wasOrderPending = "PENDING".equalsIgnoreCase(oldStatus);

            // Dọn bàn cũ về AVAILABLE nếu:
            // TH1: Đơn hàng đang phục vụ nhưng khách đổi sang bàn khác (tableChanged)
            // TH2: Đơn hàng chuyển sang Đã thanh toán / Đã hủy
            // (isOrderMovingToCompletedOrCancelled)
            if ((tableChanged && wasOrderPending) || (isOrderMovingToCompletedOrCancelled && wasOrderPending)) {
                CafeTable oldTable = order.getCafeTable();
                oldTable.setStatus("AVAILABLE");
                cafeTableRepository.save(oldTable);
            }
        }

        // =============================================================
        // HÀNH ĐỘNG B: XỬ LÝ BÀN HIỆN TẠI / BÀN MỚI
        // =============================================================
        if (request.getTableId() != null) {
            // Lấy cái bàn mục tiêu ra (dù là bàn cũ giữ nguyên hay bàn mới đổi sang)
            CafeTable targetTable = cafeTableRepository.findById(request.getTableId()).orElseThrow();

            // Nếu trạng thái HIỆN TẠI của đơn hàng là PENDING (Đang phục vụ)
            // Thì bất kể bạn vừa đổi bàn hay vừa khôi phục đơn từ Hủy về, cái bàn này BẮT
            // BUỘC phải là OCCUPIED
            if ("PENDING".equalsIgnoreCase(order.getStatus())) {
                targetTable.setStatus("OCCUPIED");
                cafeTableRepository.save(targetTable);
            }

            // Gắn bàn vào đơn hàng
            order.setCafeTable(targetTable);
        }

        // 3. CẬP NHẬT CHI TIẾT SẢN PHẨM (Giữ nguyên code chuẩn của bạn)
        if (request.getDetails() != null && !request.getDetails().isEmpty()) {
            order.getOrderDetails().clear();
            orderRepository.flush();

            double totalAmount = 0;
            for (OrderDetailRequest detailReq : request.getDetails()) {
                Product product = productRepository.findById(detailReq.getProductId()).orElseThrow();
                OrderDetail detail = new OrderDetail();
                detail.setOrder(order);
                detail.setProduct(product);
                detail.setQuantity(detailReq.getQuantity());
                detail.setPrice(product.getPrice());
                detail.setNote(detailReq.getNote());
                order.getOrderDetails().add(detail);
                totalAmount += product.getPrice() * detailReq.getQuantity();
            }
            order.setTotalAmount(totalAmount);
        }

        return orderRepository.save(order);
    }
}