package com.qlcafe.backend.repository;

import com.qlcafe.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findByOrderId(Integer orderId);

    boolean existsByOrderIdAndPaymentStatus(Integer orderId, String paymentStatus);
}
