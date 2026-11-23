package com.qlcafe.backend.service;

import com.qlcafe.backend.dto.EmployeeRequest;
import com.qlcafe.backend.entity.Account;
import com.qlcafe.backend.entity.Employee;
import com.qlcafe.backend.repository.AccountRepository;
import com.qlcafe.backend.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final AccountRepository accountRepository;

    public EmployeeService(EmployeeRepository employeeRepository, AccountRepository accountRepository) {
        this.employeeRepository = employeeRepository;
        this.accountRepository = accountRepository;
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findByIsActiveTrue();
    }

    public Employee getEmployeeById(Integer id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên với ID: " + id));
    }

    @Transactional
    public Employee createEmployee(EmployeeRequest request) {
        Employee employee = new Employee();
        mapRequestToEmployee(request, employee);
        employee.setIsActive(true);
        return employeeRepository.save(employee);
    }

    @Transactional
    public Employee updateEmployee(Integer id, EmployeeRequest request) {
        Employee employee = getEmployeeById(id);
        mapRequestToEmployee(request, employee);
        if (request.getIsActive() != null) {
            employee.setIsActive(request.getIsActive());
        }
        return employeeRepository.save(employee);
    }

    @Transactional
    public void deleteEmployee(Integer id) {
        Employee employee = getEmployeeById(id);
        employee.setIsActive(false); // Soft delete
        employeeRepository.save(employee);
    }

    private void mapRequestToEmployee(EmployeeRequest request, Employee employee) {
        employee.setFullName(request.getFullName());
        employee.setPhoneNumber(request.getPhoneNumber());
        employee.setIdentityCard(request.getIdentityCard());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setPosition(request.getPosition());
        employee.setHireDate(request.getHireDate());
        employee.setSalary(request.getSalary());

        if (request.getAccountId() != null) {
            Account account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với ID: " + request.getAccountId()));
            employee.setAccount(account);
        } else {
            employee.setAccount(null);
        }
    }
}
