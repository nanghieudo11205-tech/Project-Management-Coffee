package com.qlcafe.backend.service;

import com.qlcafe.backend.entity.CafeTable;
import com.qlcafe.backend.exception.BusinessException;
import com.qlcafe.backend.exception.ConflictException;
import com.qlcafe.backend.exception.ResourceNotFoundException;
import com.qlcafe.backend.repository.CafeTableRepository;
import com.qlcafe.backend.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class CafeTableService {
    private static final Set<String> VALID_ACTIVE_STATUSES = Set.of("AVAILABLE", "OCCUPIED");

    private final CafeTableRepository cafeTableRepository;
    private final OrderRepository orderRepository;

    public CafeTableService(CafeTableRepository cafeTableRepository, OrderRepository orderRepository) {
        this.cafeTableRepository = cafeTableRepository;
        this.orderRepository = orderRepository;
    }

    public List<CafeTable> getAllTables() {
        return cafeTableRepository.findByStatusNot("DELETED");
    }

    public CafeTable getTableById(Integer id) {
        CafeTable table = cafeTableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn với ID: " + id));
        if ("DELETED".equalsIgnoreCase(table.getStatus())) {
            throw new ResourceNotFoundException("Bàn đã bị xóa hoặc không tồn tại");
        }
        return table;
    }

    @Transactional
    public CafeTable saveTable(CafeTable table) {
        if (table == null || table.getName() == null || table.getName().trim().isEmpty()) {
            throw new BusinessException("Tên bàn không được để trống");
        }
        String trimmedName = table.getName().trim();
        if (cafeTableRepository.existsByNameIgnoreCaseAndStatusNot(trimmedName, "DELETED")) {
            throw new ConflictException("Tên bàn đã tồn tại");
        }

        String status = (table.getStatus() == null || table.getStatus().trim().isEmpty())
                ? "AVAILABLE"
                : table.getStatus().trim().toUpperCase();
        if (!VALID_ACTIVE_STATUSES.contains(status)) {
            throw new BusinessException("Trạng thái bàn không hợp lệ (chỉ chấp nhận AVAILABLE hoặc OCCUPIED)");
        }

        table.setName(trimmedName);
        table.setStatus(status);
        return cafeTableRepository.save(table);
    }

    @Transactional
    public CafeTable updateTableStatus(Integer id, String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new BusinessException("Trạng thái bàn không được để trống");
        }
        String normalizedStatus = status.trim().toUpperCase();
        if (!VALID_ACTIVE_STATUSES.contains(normalizedStatus)) {
            throw new BusinessException("Trạng thái bàn không hợp lệ (chỉ chấp nhận AVAILABLE hoặc OCCUPIED)");
        }

        CafeTable table = cafeTableRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn với ID: " + id));
        if ("DELETED".equalsIgnoreCase(table.getStatus())) {
            throw new ResourceNotFoundException("Bàn đã bị xóa hoặc không tồn tại");
        }

        if ("AVAILABLE".equals(normalizedStatus)
                && orderRepository.existsByCafeTableIdAndStatus(id, "PENDING")) {
            throw new ConflictException("Không thể chuyển bàn về AVAILABLE khi vẫn còn đơn hàng PENDING");
        }

        table.setStatus(normalizedStatus);
        return cafeTableRepository.save(table);
    }

    @Transactional
    public CafeTable updateTable(Integer id, String newName) {
        if (newName == null || newName.trim().isEmpty()) {
            throw new BusinessException("Tên bàn không được để trống");
        }
        String trimmedName = newName.trim();

        CafeTable table = cafeTableRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn với ID: " + id));
        if ("DELETED".equalsIgnoreCase(table.getStatus())) {
            throw new ResourceNotFoundException("Bàn đã bị xóa hoặc không tồn tại");
        }
        if ("OCCUPIED".equalsIgnoreCase(table.getStatus())
                || orderRepository.existsByCafeTableIdAndStatus(id, "PENDING")) {
            throw new ConflictException("Bàn đang có khách. Không thể sửa tên bàn");
        }
        if (cafeTableRepository.existsByNameIgnoreCaseAndStatusNotAndIdNot(trimmedName, "DELETED", id)) {
            throw new ConflictException("Tên bàn đã tồn tại");
        }

        table.setName(trimmedName);
        return cafeTableRepository.save(table);
    }

    @Transactional
    public CafeTable deleteTable(Integer id) {
        CafeTable table = cafeTableRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn với ID: " + id));
        if ("DELETED".equalsIgnoreCase(table.getStatus())) {
            throw new ResourceNotFoundException("Bàn đã bị xóa trước đó");
        }
        if ("OCCUPIED".equalsIgnoreCase(table.getStatus())
                || orderRepository.existsByCafeTableIdAndStatus(id, "PENDING")) {
            throw new ConflictException("Bàn đang có khách. Không thể xóa");
        }

        table.setStatus("DELETED");
        return cafeTableRepository.save(table);
    }
}
