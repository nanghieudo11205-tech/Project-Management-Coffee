package com.qlcafe.backend.repository;

import com.qlcafe.backend.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Integer> {
    Optional<Account> findByUsername(String username);

    Optional<Account> findByEmailIgnoreCase(String email);

    Optional<Account> findByGoogleId(String googleId);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Integer id);
}
