package com.qlcafe.backend.repository;

import com.qlcafe.backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Integer> {
    List<Employee> findByIsActiveTrue();
    Optional<Employee> findByAccountId(Integer accountId);
}
