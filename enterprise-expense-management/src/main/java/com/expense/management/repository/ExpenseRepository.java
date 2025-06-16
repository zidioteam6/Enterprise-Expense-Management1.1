package com.expense.management.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.expense.management.model.Expense;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

}
