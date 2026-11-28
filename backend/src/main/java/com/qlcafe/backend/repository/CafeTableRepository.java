package com.qlcafe.backend.repository;

import com.qlcafe.backend.entity.CafeTable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CafeTableRepository extends JpaRepository<CafeTable, Integer> {
    List<CafeTable> findByStatusNot(String status);

    boolean existsByNameIgnoreCaseAndStatusNot(String name, String status);

    boolean existsByNameIgnoreCaseAndStatusNotAndIdNot(String name, String status, Integer id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM CafeTable t WHERE t.id = :id")
    Optional<CafeTable> findByIdWithLock(@Param("id") Integer id);
}
