package com.qlcafe.backend.controller;

import com.qlcafe.backend.dto.*;
import com.qlcafe.backend.entity.Order;
import com.qlcafe.backend.repository.OrderDetailRepository;
import com.qlcafe.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;
    private final OrderDetailRepository orderDetailRepository;

    public OrderController(OrderService orderService, OrderDetailRepository orderDetailRepository) {
        this.orderService = orderService;
        this.orderDetailRepository = orderDetailRepository;
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'STAFF')")
    public ResponseEntity<Order> createOrder(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'STAFF')")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'STAFF')")
    public ResponseEntity<Order> getOrderById(@PathVariable Integer id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Order> updateOrder(@PathVariable Integer id, @Valid @RequestBody OrderUpdateRequest request) {
        return ResponseEntity.ok(orderService.updateOrder(id, request));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'STAFF')")
    public ResponseEntity<Order> addItem(@PathVariable Integer id, @Valid @RequestBody OrderDetailRequest request) {
        return ResponseEntity.ok(orderService.addItemToOrder(id, request));
    }

    @PutMapping("/{id}/items/{detailId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'STAFF')")
    public ResponseEntity<Order> updateItem(
            @PathVariable Integer id,
            @PathVariable Integer detailId,
            @RequestBody OrderDetailRequest request
    ) {
        return ResponseEntity.ok(orderService.updateOrderItem(id, detailId, request));
    }

    @DeleteMapping("/{id}/items/{detailId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'STAFF')")
    public ResponseEntity<Order> removeItem(@PathVariable Integer id, @PathVariable Integer detailId) {
        return ResponseEntity.ok(orderService.removeItemFromOrder(id, detailId));
    }

    @PutMapping("/{id}/transfer-table")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'STAFF')")
    public ResponseEntity<Order> transferTable(
            @PathVariable Integer id,
            @Valid @RequestBody TransferTableRequest request
    ) {
        return ResponseEntity.ok(orderService.transferTable(id, request.getTargetTableId()));
    }

    @PostMapping("/{id}/merge")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'STAFF')")
    public ResponseEntity<Order> mergeOrders(
            @PathVariable Integer id,
            @Valid @RequestBody MergeOrderRequest request
    ) {
        return ResponseEntity.ok(orderService.mergeOrders(id, request.getSourceOrderId()));
    }

    @PutMapping("/{id}/checkout")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'STAFF')")
    public ResponseEntity<Order> checkout(
            @PathVariable Integer id,
            @RequestBody(required = false) CheckoutRequest request
    ) {
        return ResponseEntity.ok(orderService.checkout(id, request));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'STAFF')")
    public ResponseEntity<Order> cancelOrder(@PathVariable Integer id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<MessageResponse> deleteOrder(@PathVariable Integer id) {
        orderService.deleteOrder(id);
        return ResponseEntity.ok(new MessageResponse("Đã xóa đơn hàng #" + id + " thành công"));
    }

    @GetMapping("/top-products")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'STAFF')")
    public ResponseEntity<List<TopProductDTO>> getTopSellingProducts() {
        List<Object[]> rawData = orderDetailRepository.findTopSellingProducts();
        List<TopProductDTO> result = rawData.stream()
                .map(row -> new TopProductDTO(
                        (String) row[0],
                        ((Number) row[1]).longValue(),
                        ((Number) row[2]).doubleValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
