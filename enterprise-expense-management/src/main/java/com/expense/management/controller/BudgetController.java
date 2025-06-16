package com.expense.management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class BudgetController {

    // For simplicity, we'll use a static variable for now. 
    // In a real application, this would be fetched from/saved to a database.
    private static double MONTHLY_BUDGET = 50000.00;

    @GetMapping("/monthly-budget")
    public ResponseEntity<Map<String, Double>> getMonthlyBudget() {
        return ResponseEntity.ok(Collections.singletonMap("budget", MONTHLY_BUDGET));
    }

    @PostMapping("/monthly-budget")
    public ResponseEntity<String> setMonthlyBudget(@RequestBody Map<String, Double> request) {
        Double newBudget = request.get("budget");
        if (newBudget != null) {
            MONTHLY_BUDGET = newBudget;
            return ResponseEntity.ok("Monthly budget updated successfully to " + newBudget);
        } else {
            return ResponseEntity.badRequest().body("Budget value not provided.");
        }
    }
} 