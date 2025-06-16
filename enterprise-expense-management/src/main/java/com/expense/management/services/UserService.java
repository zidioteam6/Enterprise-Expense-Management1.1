package com.expense.management.services;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.expense.management.model.User;
import com.expense.management.repository.UserRepository;

// In service/UserService.java
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditService auditService;

    public User updateUser(User user, String performedBy) {
        User updatedUser = userRepository.save(user);

        // Using the new logEvent method with appropriate parameters
        auditService.logEvent(
                performedBy, // user
                "UPDATE_USER", // action
                "Updated user: " + updatedUser.getFullName(), // details
                "SUCCESS" // status
        );

        return updatedUser;
    }

    public User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElse(null);
    }
}
