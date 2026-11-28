package com.qlcafe.backend.service;

import com.qlcafe.backend.dto.CheckoutRequest;
import com.qlcafe.backend.dto.OrderDetailRequest;
import com.qlcafe.backend.dto.OrderRequest;
import com.qlcafe.backend.dto.OrderUpdateRequest;
import com.qlcafe.backend.entity.*;
import com.qlcafe.backend.exception.BusinessException;
import com.qlcafe.backend.exception.ConflictException;
import com.qlcafe.backend.exception.ResourceNotFoundException;
import com.qlcafe.backend.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class OrderService {
    private static final Set<String> VALID_ORDER_TYPES = Set.of("DINE_IN", "TAKEAWAY");
    private static final Set<String> VALID_ORDER_STATUSES = Set.of("PENDING", "PAID", "CANCELLED");
    private static final Set<String> VALID_PAYMENT_METHODS = Set.of("CASH", "BANKING");

    private final OrderRepository orderRepository;
    private final CafeTableRepository cafeTableRepository;
    private final ProductRepository productRepository;
    private final AccountRepository accountRepository;
    private final PaymentRepository paymentRepository;

    public OrderService(
            OrderRepository orderRepository,
            CafeTableRepository cafeTableRepository,
            ProductRepository productRepository,
            AccountRepository accountRepository,
            PaymentRepository paymentRepository
    ) {
        this.orderRepository = orderRepository;
        this.cafeTableRepository = cafeTableRepository;
        this.productRepository = productRepository;
        this.accountRepository = accountRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public Order createOrder(OrderRequest request) {
        if (request == null || request.getDetails() == null || request.getDetails().isEmpty()) {
            throw new BusinessException("Đơn hàng phải có ít nhất một món");
        }

        String orderType = resolveOrderType(request.getOrderType(), request.getTableId());
        Account account = resolveCurrentAccount();

        CafeTable table = null;
        if ("DINE_IN".equals(orderType)) {
            table = lockAvailableTable(request.getTableId());
            table.setStatus("OCCUPIED");
            cafeTableRepository.save(table);
        }

        Order order = new Order();
        order.setCafeTable(table);
        order.setAccount(account);
        order.setOrderType(orderType);
        order.setCreatedAt(LocalDateTime.now());
        order.setStatus("PENDING");

        for (OrderDetailRequest detailReq : request.getDetails()) {
            addOrMergeDetail(order, detailReq);
        }

        order.setTotalAmount(recalculateTotal(order));
        return orderRepository.save(order);
    }

    @Transactional
    public Order addItemToOrder(Integer orderId, OrderDetailRequest detailReq) {
        Order order = lockPendingOrder(orderId);
        addOrMergeDetail(order, detailReq);
        order.setTotalAmount(recalculateTotal(order));
        return orderRepository.save(order);
    }

    @Transactional
    public Order updateOrderItem(Integer orderId, Integer detailId, OrderDetailRequest detailReq) {
        Order order = lockPendingOrder(orderId);
        if (detailReq == null || detailReq.getQuantity() == null || detailReq.getQuantity() <= 0) {
            throw new BusinessException("Số lượng món phải lớn hơn 0");
        }

        OrderDetail detail = order.getOrderDetails().stream()
                .filter(d -> Objects.equals(d.getId(), detailId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món trong đơn hàng với ID: " + detailId));

        detail.setQuantity(detailReq.getQuantity());
        if (detailReq.getNote() != null) {
            detail.setNote(normalizeNote(detailReq.getNote()));
        }

        order.setTotalAmount(recalculateTotal(order));
        return orderRepository.save(order);
    }

    @Transactional
    public Order removeItemFromOrder(Integer orderId, Integer detailId) {
        Order order = lockPendingOrder(orderId);
        OrderDetail detail = order.getOrderDetails().stream()
                .filter(d -> Objects.equals(d.getId(), detailId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món trong đơn hàng với ID: " + detailId));

        if (order.getOrderDetails().size() <= 1) {
            throw new BusinessException("Đơn hàng phải có ít nhất một món. Vui lòng hủy đơn nếu muốn bỏ toàn bộ món");
        }

        order.getOrderDetails().remove(detail);
        order.setTotalAmount(recalculateTotal(order));
        return orderRepository.save(order);
    }

    @Transactional
    public Order transferTable(Integer orderId, Integer targetTableId) {
        if (targetTableId == null) {
            throw new BusinessException("Bàn đích không được để trống");
        }

        Order order = lockPendingOrder(orderId);
        CafeTable sourceTable = order.getCafeTable();
        if (sourceTable != null && Objects.equals(sourceTable.getId(), targetTableId)) {
            throw new BusinessException("Đơn hàng hiện đang ở bàn này rồi");
        }

        CafeTable targetTable;
        if (sourceTable != null) {
            // Lock both tables in consistent ID order to prevent deadlocks
            int firstId = Math.min(sourceTable.getId(), targetTableId);
            int secondId = Math.max(sourceTable.getId(), targetTableId);
            CafeTable first = lockTableOrThrow(firstId);
            CafeTable second = lockTableOrThrow(secondId);
            sourceTable = Objects.equals(first.getId(), sourceTable.getId()) ? first : second;
            targetTable = Objects.equals(first.getId(), targetTableId) ? first : second;
        } else {
            targetTable = lockTableOrThrow(targetTableId);
        }

        ensureTableIsAvailable(targetTable);

        if (sourceTable != null) {
            sourceTable.setStatus("AVAILABLE");
            cafeTableRepository.save(sourceTable);
        }

        targetTable.setStatus("OCCUPIED");
        cafeTableRepository.save(targetTable);

        order.setCafeTable(targetTable);
        order.setOrderType("DINE_IN");
        return orderRepository.save(order);
    }

    @Transactional
    public Order mergeOrders(Integer targetOrderId, Integer sourceOrderId) {
        if (targetOrderId == null || sourceOrderId == null) {
            throw new BusinessException("Thiếu thông tin đơn hàng cần gộp");
        }
        if (Objects.equals(targetOrderId, sourceOrderId)) {
            throw new BusinessException("Không thể gộp cùng một đơn hàng");
        }

        // Lock both orders in consistent ID order to prevent deadlocks
        int firstId = Math.min(targetOrderId, sourceOrderId);
        int secondId = Math.max(targetOrderId, sourceOrderId);
        Order first = orderRepository.findByIdWithLock(firstId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + firstId));
        Order second = orderRepository.findByIdWithLock(secondId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + secondId));

        Order targetOrder = Objects.equals(first.getId(), targetOrderId) ? first : second;
        Order sourceOrder = Objects.equals(first.getId(), sourceOrderId) ? first : second;

        ensurePending(targetOrder);
        ensurePending(sourceOrder);

        for (OrderDetail srcDetail : sourceOrder.getOrderDetails()) {
            mergeDetailEntity(targetOrder, srcDetail);
        }

        targetOrder.setTotalAmount(recalculateTotal(targetOrder));

        if (sourceOrder.getCafeTable() != null
                && (targetOrder.getCafeTable() == null
                || !Objects.equals(sourceOrder.getCafeTable().getId(), targetOrder.getCafeTable().getId()))) {
            CafeTable srcTable = lockTableOrThrow(sourceOrder.getCafeTable().getId());
            srcTable.setStatus("AVAILABLE");
            cafeTableRepository.save(srcTable);
        }

        sourceOrder.getOrderDetails().clear();
        sourceOrder.setTotalAmount(BigDecimal.ZERO);
        sourceOrder.setStatus("CANCELLED");

        orderRepository.save(sourceOrder);
        return orderRepository.save(targetOrder);
    }

    @Transactional
    public Order checkout(Integer orderId) {
        return checkout(orderId, new CheckoutRequest());
    }

    @Transactional
    public Order checkout(Integer orderId, CheckoutRequest request) {
        Order order = orderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if ("PAID".equalsIgnoreCase(order.getStatus())) {
            throw new ConflictException("Đơn hàng #" + orderId + " đã được thanh toán trước đó");
        }
        if ("CANCELLED".equalsIgnoreCase(order.getStatus())) {
            throw new ConflictException("Không thể thanh toán đơn hàng đã bị hủy");
        }
        if (paymentRepository.existsByOrderIdAndPaymentStatus(orderId, "SUCCESS")) {
            throw new ConflictException("Đơn hàng #" + orderId + " đã có giao dịch thanh toán thành công");
        }
        if (order.getOrderDetails() == null || order.getOrderDetails().isEmpty()) {
            throw new BusinessException("Không thể thanh toán đơn hàng trống");
        }

        String paymentMethod = resolvePaymentMethod(request != null ? request.getPaymentMethod() : null);
        BigDecimal finalAmount = recalculateTotal(order);

        Payment payment = paymentRepository.findByOrderId(orderId).orElseGet(Payment::new);
        payment.setOrder(order);
        payment.setAmount(finalAmount);
        payment.setPaymentMethod(paymentMethod);
        payment.setPaymentStatus("SUCCESS");
        payment.setPaidAt(LocalDateTime.now());
        payment = paymentRepository.save(payment);

        order.setTotalAmount(finalAmount);
        order.setPaymentMethod(paymentMethod);
        order.setStatus("PAID");
        order.setPayment(payment);

        if (order.getCafeTable() != null) {
            CafeTable table = lockTableOrThrow(order.getCafeTable().getId());
            table.setStatus("AVAILABLE");
            cafeTableRepository.save(table);
        }

        return orderRepository.save(order);
    }

    @Transactional
    public Order cancelOrder(Integer orderId) {
        Order order = lockPendingOrder(orderId);
        order.setStatus("CANCELLED");

        if (order.getCafeTable() != null) {
            CafeTable table = lockTableOrThrow(order.getCafeTable().getId());
            table.setStatus("AVAILABLE");
            cafeTableRepository.save(table);
        }

        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrderById(Integer id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));
    }

    @Transactional
    public void deleteOrder(Integer id) {
        Order order = orderRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));

        if ("PAID".equalsIgnoreCase(order.getStatus())) {
            throw new ConflictException("Không thể xóa đơn hàng đã thanh toán");
        }

        if ("PENDING".equalsIgnoreCase(order.getStatus()) && order.getCafeTable() != null) {
            CafeTable table = lockTableOrThrow(order.getCafeTable().getId());
            table.setStatus("AVAILABLE");
            cafeTableRepository.save(table);
        }

        orderRepository.delete(order);
    }

    @Transactional
    public Order updateOrder(Integer id, OrderUpdateRequest request) {
        Order order = lockPendingOrder(id);

        if (request.getDetails() != null && !request.getDetails().isEmpty()) {
            order.getOrderDetails().clear();
            orderRepository.flush();
            for (OrderDetailRequest detailReq : request.getDetails()) {
                addOrMergeDetail(order, detailReq);
            }
            order.setTotalAmount(recalculateTotal(order));
        }

        if (request.getTableId() != null
                && (order.getCafeTable() == null || !Objects.equals(order.getCafeTable().getId(), request.getTableId()))) {
            transferTable(id, request.getTableId());
        }

        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            String nextStatus = request.getStatus().trim().toUpperCase();
            if (!VALID_ORDER_STATUSES.contains(nextStatus)) {
                throw new BusinessException("Trạng thái đơn hàng không hợp lệ");
            }
            if ("PAID".equals(nextStatus)) {
                return checkout(id, new CheckoutRequest());
            }
            if ("CANCELLED".equals(nextStatus)) {
                return cancelOrder(id);
            }
        }

        return orderRepository.save(order);
    }

    // ===== Private Helpers =====

    private Order lockPendingOrder(Integer orderId) {
        Order order = orderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));
        ensurePending(order);
        return order;
    }

    private void ensurePending(Order order) {
        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new ConflictException("Đơn hàng #" + order.getId() + " đã ở trạng thái " + order.getStatus() + ", không thể thao tác");
        }
    }

    private CafeTable lockTableOrThrow(Integer tableId) {
        CafeTable table = cafeTableRepository.findByIdWithLock(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn với ID: " + tableId));
        if ("DELETED".equalsIgnoreCase(table.getStatus())) {
            throw new ResourceNotFoundException("Bàn với ID " + tableId + " đã bị xóa");
        }
        return table;
    }

    private CafeTable lockAvailableTable(Integer tableId) {
        if (tableId == null) {
            throw new BusinessException("Bàn không được để trống cho đơn tại quán");
        }
        CafeTable table = lockTableOrThrow(tableId);
        ensureTableIsAvailable(table);
        return table;
    }

    private void ensureTableIsAvailable(CafeTable table) {
        if ("OCCUPIED".equalsIgnoreCase(table.getStatus())
                || orderRepository.existsByCafeTableIdAndStatus(table.getId(), "PENDING")) {
            throw new ConflictException("Bàn " + table.getName() + " đang có đơn hàng hoạt động");
        }
    }

    private Account resolveCurrentAccount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
            throw new BusinessException("Không xác định được tài khoản nhân viên đang đăng nhập");
        }
        return accountRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + auth.getName()));
    }

    private String resolveOrderType(String requestedType, Integer tableId) {
        String resolved;
        if (requestedType == null || requestedType.trim().isEmpty()) {
            resolved = tableId != null ? "DINE_IN" : "TAKEAWAY";
        } else {
            resolved = requestedType.trim().toUpperCase();
        }
        if (!VALID_ORDER_TYPES.contains(resolved)) {
            throw new BusinessException("Loại đơn hàng không hợp lệ (chỉ chấp nhận DINE_IN hoặc TAKEAWAY)");
        }
        if ("DINE_IN".equals(resolved) && tableId == null) {
            throw new BusinessException("Đơn tại quán (DINE_IN) bắt buộc phải chọn bàn");
        }
        if ("TAKEAWAY".equals(resolved) && tableId != null) {
            throw new BusinessException("Đơn mang đi (TAKEAWAY) không được gắn bàn");
        }
        return resolved;
    }

    private String resolvePaymentMethod(String requestedMethod) {
        if (requestedMethod == null || requestedMethod.trim().isEmpty()) {
            return "CASH";
        }
        String normalized = requestedMethod.trim().toUpperCase();
        if (!VALID_PAYMENT_METHODS.contains(normalized)) {
            throw new BusinessException("Phương thức thanh toán không hợp lệ (chỉ chấp nhận CASH hoặc BANKING)");
        }
        return normalized;
    }

    private void addOrMergeDetail(Order order, OrderDetailRequest detailReq) {
        if (detailReq == null || detailReq.getProductId() == null) {
            throw new BusinessException("Mã sản phẩm không được để trống");
        }
        if (detailReq.getQuantity() == null || detailReq.getQuantity() <= 0) {
            throw new BusinessException("Số lượng món phải lớn hơn 0");
        }

        Product product = productRepository.findById(detailReq.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + detailReq.getProductId()));
        if (!Boolean.TRUE.equals(product.getIsAvailable())) {
            throw new BusinessException("Sản phẩm '" + product.getName() + "' hiện đã hết hàng hoặc ngừng bán");
        }

        String note = normalizeNote(detailReq.getNote());
        OrderDetail existing = order.getOrderDetails().stream()
                .filter(d -> Objects.equals(d.getProduct().getId(), product.getId())
                        && Objects.equals(normalizeNote(d.getNote()), note))
                .findFirst()
                .orElse(null);

        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + detailReq.getQuantity());
            existing.setPrice(product.getPrice());
        } else {
            OrderDetail detail = new OrderDetail();
            detail.setOrder(order);
            detail.setProduct(product);
            detail.setQuantity(detailReq.getQuantity());
            detail.setPrice(product.getPrice());
            detail.setNote(note);
            order.getOrderDetails().add(detail);
        }
    }

    private void mergeDetailEntity(Order targetOrder, OrderDetail srcDetail) {
        String note = normalizeNote(srcDetail.getNote());
        OrderDetail existing = targetOrder.getOrderDetails().stream()
                .filter(d -> Objects.equals(d.getProduct().getId(), srcDetail.getProduct().getId())
                        && Objects.equals(normalizeNote(d.getNote()), note))
                .findFirst()
                .orElse(null);

        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + srcDetail.getQuantity());
        } else {
            OrderDetail copy = new OrderDetail();
            copy.setOrder(targetOrder);
            copy.setProduct(srcDetail.getProduct());
            copy.setQuantity(srcDetail.getQuantity());
            copy.setPrice(srcDetail.getPrice());
            copy.setNote(note);
            targetOrder.getOrderDetails().add(copy);
        }
    }

    private BigDecimal recalculateTotal(Order order) {
        BigDecimal total = BigDecimal.ZERO;
        for (OrderDetail detail : order.getOrderDetails()) {
            BigDecimal line = detail.getPrice().multiply(BigDecimal.valueOf(detail.getQuantity()));
            total = total.add(line);
        }
        return total;
    }

    private String normalizeNote(String note) {
        if (note == null) {
            return null;
        }
        String trimmed = note.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
