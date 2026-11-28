package com.qlcafe.backend.repository;

import com.qlcafe.backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Integer> {
    Optional<Employee> findByAccountId(Integer accountId);

    boolean existsByAccountId(Integer accountId);

    boolean existsByAccountIdAndIdNot(Integer accountId, Integer id);

    List<Employee> findByIsActiveTrue();
}
