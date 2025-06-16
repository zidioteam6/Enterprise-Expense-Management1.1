package com.expense.management.model;


import jakarta.persistence.*;

@Entity
@Table(name = "budget")
public class Budget {
    @Id
    @Column(length = 191)
    private String category;

    @Column(name = "budget_limit")
    private double budgetLimit;

    // Constructors
    public Budget() {}

    public Budget(String category, double budgetLimit) {
        this.category = category;
        this.budgetLimit = budgetLimit;
    }

    // Getters and setters
    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getBudgetLimit() {
        return budgetLimit;
    }

    public void setBudgetLimit(double budgetLimit) {
        this.budgetLimit = budgetLimit;
    }
}

