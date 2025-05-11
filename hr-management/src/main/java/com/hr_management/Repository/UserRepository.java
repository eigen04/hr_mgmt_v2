package com.hr_management.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.hr_management.Entity.User;
import java.util.Optional;
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    User findByEmail(String email);
    Optional<User> findByUsername(String username);
}