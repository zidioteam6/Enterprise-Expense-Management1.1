package com.expense.management.controller;

import com.expense.management.dto.DashboardDTO;
import com.expense.management.model.Expense;
import com.expense.management.model.User;
import com.expense.management.repository.ExpenseRepository;
import com.expense.management.repository.UserRepository;
import com.expense.management.services.DashboardService;
import com.expense.management.services.ExpenseService;
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
@RequestMapping("/api/employee/dashboard")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class EmployeeDashboardController {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<DashboardDTO> getEmployeeDashboard() {
        // Get current user email
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        // Get all this user's expenses (not just approved)
        List<Expense> userExpenses = expenseService.getAllByUser(user);
        DashboardDTO dashboard = dashboardService.getDashboardData(userExpenses);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/expenses")
    public ResponseEntity<List<Expense>> getEmployeeExpenses() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        // Get only this user's fully approved expenses
        List<Expense> userApprovedExpenses = expenseService.getAllByUser(user).stream()
                .filter(e -> e.getApprovalStatus().toString().equals("APPROVED"))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(userApprovedExpenses);
    }
} 