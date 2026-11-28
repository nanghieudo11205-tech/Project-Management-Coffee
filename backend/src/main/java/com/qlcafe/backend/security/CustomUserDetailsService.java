package com.qlcafe.backend.security;

import com.qlcafe.backend.entity.Account;
import com.qlcafe.backend.entity.Employee;
import com.qlcafe.backend.repository.AccountRepository;
import com.qlcafe.backend.repository.EmployeeRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final AccountRepository accountRepository;
    private final EmployeeRepository employeeRepository;

    public CustomUserDetailsService(AccountRepository accountRepository, EmployeeRepository employeeRepository) {
        this.accountRepository = accountRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        boolean active = Boolean.TRUE.equals(account.getIsActive());
        if (active) {
            Employee linkedEmployee = employeeRepository.findByAccountId(account.getId()).orElse(null);
            if (linkedEmployee != null && Boolean.FALSE.equals(linkedEmployee.getIsActive())) {
                active = false;
            }
        }
        return new CustomUserDetails(account, active);
    }
}
