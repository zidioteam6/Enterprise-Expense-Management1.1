package com.expense.management.controller;

import com.expense.management.model.Expense;
import com.expense.management.model.User;
import com.expense.management.repository.ExpenseRepository;
import com.expense.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employee")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class EmployeeExpenseController {
    @Autowired
    private ExpenseRepository expenseRepository;
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/expenses")
    public ResponseEntity<List<Expense>> getEmployeeExpenses() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        List<Expense> userExpenses = expenseRepository.findAll().stream()
                .filter(e -> e.getUser() != null && e.getUser().getId().equals(user.getId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(userExpenses);
    }
} 