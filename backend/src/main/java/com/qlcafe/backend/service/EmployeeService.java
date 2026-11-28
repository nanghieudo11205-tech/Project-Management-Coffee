package com.qlcafe.backend.service;

import com.qlcafe.backend.dto.EmployeeRequest;
import com.qlcafe.backend.entity.Account;
import com.qlcafe.backend.entity.Employee;
import com.qlcafe.backend.exception.ConflictException;
import com.qlcafe.backend.exception.ResourceNotFoundException;
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
        return employeeRepository.findAll();
    }

    public Employee getEmployeeById(Integer id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));
    }

    @Transactional
    public Employee createEmployee(EmployeeRequest request) {
        Employee employee = new Employee();
        applyRequest(employee, request, null);
        if (request.getIsActive() == null) {
            employee.setIsActive(true);
        }
        return employeeRepository.save(employee);
    }

    @Transactional
    public Employee updateEmployee(Integer id, EmployeeRequest request) {
        Employee employee = getEmployeeById(id);
        applyRequest(employee, request, id);
        return employeeRepository.save(employee);
    }

    @Transactional
    public void deactivateEmployee(Integer id) {
        Employee employee = getEmployeeById(id);
        employee.setIsActive(false);
        employeeRepository.save(employee);
    }

    private void applyRequest(Employee employee, EmployeeRequest request, Integer currentEmployeeId) {
        employee.setFullName(request.getFullName().trim());
        employee.setPhoneNumber(request.getPhoneNumber());
        employee.setIdentityCard(request.getIdentityCard());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setPosition(request.getPosition());
        employee.setHireDate(request.getHireDate());
        employee.setSalary(request.getSalary());

        if (request.getIsActive() != null) {
            employee.setIsActive(request.getIsActive());
        }

        if (request.getAccountId() != null) {
            boolean alreadyLinked = currentEmployeeId == null
                    ? employeeRepository.existsByAccountId(request.getAccountId())
                    : employeeRepository.existsByAccountIdAndIdNot(request.getAccountId(), currentEmployeeId);
            if (alreadyLinked) {
                throw new ConflictException("Tài khoản đã được liên kết với nhân viên khác");
            }
            Account account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + request.getAccountId()));
            employee.setAccount(account);
        } else {
            employee.setAccount(null);
        }
    }
}
