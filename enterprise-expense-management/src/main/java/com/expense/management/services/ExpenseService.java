package com.expense.management.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.expense.management.enums.ApprovalLevel;
import com.expense.management.model.Expense;
import com.expense.management.model.ExpenseStatus;
import com.expense.management.repository.ExpenseRepository;
import com.expense.management.repository.NotificationRepository;
import com.expense.management.model.Notification;
import com.expense.management.model.User;

@Service
public class ExpenseService {
	ExpenseRepository expenseRepository;
	@Autowired
	NotificationRepository notificationRepository;

	ExpenseService(ExpenseRepository expenseRepository) {
		this.expenseRepository = expenseRepository;
	}

	public List<Expense> getAll() {
		return expenseRepository.findAll();
	}

	public Expense add(Expense expense) {
		if (expense.getAmount() < 3000) {
			expense.setPriority("Low");
			expense.setApprovalLevel(ApprovalLevel.MANAGER);
		} else if (expense.getAmount() < 20000) {
			expense.setPriority("Medium");
			expense.setApprovalLevel(ApprovalLevel.FINANCE);
		} else {
			expense.setPriority("High");
			expense.setApprovalLevel(ApprovalLevel.ADMIN);
		}
		return expenseRepository.save(expense);
	}

	public boolean approve(long id, Long managerId) {
		Expense expense = expenseRepository.findByIdWithUser(id)
			.orElseThrow(() -> new RuntimeException("expense not found!"));
		User expenseUser = expense.getUser();
		
		// Debug logging
		System.out.println("=== EXPENSE APPROVAL DEBUG ===");
		System.out.println("Expense ID: " + id);
		System.out.println("Expense Description: " + expense.getDescription());
		System.out.println("Expense User: " + (expenseUser != null ? expenseUser.getEmail() : "NULL"));
		System.out.println("Manager ID: " + managerId);
		System.out.println("Current Approval Level: " + expense.getApprovalLevel());
		System.out.println("===============================");
		
		if (expense.getApprovalLevel() == ApprovalLevel.MANAGER) {
			expense.setApprovalLevel(ApprovalLevel.FINANCE);
			expense.setApprovedByManagerId(managerId);
			expenseRepository.save(expense);
			
			// Create notification for the expense submitter
			if (expenseUser != null) {
				Notification notif = new Notification();
				notif.setUser(expenseUser);
				notif.setTitle("Expense Approved by Manager");
				notif.setMessage("Manager approval for your expense '" + expense.getDescription() + "' is complete. Waiting for finance approval.");
				notificationRepository.save(notif);
				System.out.println("Notification created for user: " + expenseUser.getEmail());
			} else {
				System.out.println("WARNING: Expense user is null, cannot create notification!");
			}
			return true;
		} else if (expense.getApprovalLevel() == ApprovalLevel.FINANCE) {
			expense.setApprovalLevel(ApprovalLevel.ADMIN);
			expenseRepository.save(expense);
			
			// Create notification for the expense submitter
			if (expenseUser != null) {
				Notification notif = new Notification();
				notif.setUser(expenseUser);
				notif.setTitle("Expense Approved by Finance");
				notif.setMessage("Finance approval for your expense '" + expense.getDescription() + "' is complete. Waiting for admin approval.");
				notificationRepository.save(notif);
				System.out.println("Notification created for user: " + expenseUser.getEmail());
			} else {
				System.out.println("WARNING: Expense user is null, cannot create notification!");
			}
			return true;
		} else if (expense.getApprovalLevel() == ApprovalLevel.ADMIN) {
			expense.setApprovalStatus(ExpenseStatus.APPROVED);
			expenseRepository.save(expense);
			
			// Create notification for the expense submitter
			if (expenseUser != null) {
				Notification notif = new Notification();
				notif.setUser(expenseUser);
				notif.setTitle("Expense Fully Approved");
				notif.setMessage("Your expense '" + expense.getDescription() + "' is fully approved!");
				notificationRepository.save(notif);
				System.out.println("Notification created for user: " + expenseUser.getEmail());
			} else {
				System.out.println("WARNING: Expense user is null, cannot create notification!");
			}
			return true;
		}
		return false;
	}

	/**
	 * Reject expense - sets status to REJECTED
	 */
	public boolean reject(long id, Long managerId) {
		Expense expense = expenseRepository.findByIdWithUser(id)
			.orElseThrow(() -> new RuntimeException("expense not found!"));
		User expenseUser = expense.getUser();
		
		// Debug logging
		System.out.println("=== EXPENSE REJECTION DEBUG ===");
		System.out.println("Expense ID: " + id);
		System.out.println("Expense Description: " + expense.getDescription());
		System.out.println("Expense User: " + (expenseUser != null ? expenseUser.getEmail() : "NULL"));
		System.out.println("Manager ID: " + managerId);
		System.out.println("Current Approval Level: " + expense.getApprovalLevel());
		System.out.println("===============================");
		
		if (expense.getApprovalLevel() == ApprovalLevel.MANAGER) {
			expense.setApprovalStatus(ExpenseStatus.REJECTED);
			expense.setApprovedByManagerId(managerId);
			expenseRepository.save(expense);
			
			// Create notification for the expense submitter
			if (expenseUser != null) {
				Notification notif = new Notification();
				notif.setUser(expenseUser);
				notif.setTitle("Expense Rejected");
				notif.setMessage("Your expense '" + expense.getDescription() + "' has been rejected.");
				notificationRepository.save(notif);
				System.out.println("Notification created for user: " + expenseUser.getEmail());
			} else {
				System.out.println("WARNING: Expense user is null, cannot create notification!");
			}
			return true;
		}
		expense.setApprovalStatus(ExpenseStatus.REJECTED);
		expenseRepository.save(expense);
		
		// Create notification for the expense submitter
		if (expenseUser != null) {
			Notification notif = new Notification();
			notif.setUser(expenseUser);
			notif.setTitle("Expense Rejected");
			notif.setMessage("Your expense '" + expense.getDescription() + "' has been rejected.");
			notificationRepository.save(notif);
			System.out.println("Notification created for user: " + expenseUser.getEmail());
		} else {
			System.out.println("WARNING: Expense user is null, cannot create notification!");
		}
		return true;
	}

	/**
	 * Get expenses pending manager approval
	 */
	public List<Expense> getExpensesPendingManagerApproval() {
		return expenseRepository.findByApprovalLevelAndApprovalStatus(ApprovalLevel.MANAGER, ExpenseStatus.PENDING);
	}

	/**
	 * Get expenses pending finance approval (approved by manager)
	 */
	public List<Expense> getExpensesPendingFinanceApproval() {
		return expenseRepository.findByApprovalLevelAndApprovalStatus(ApprovalLevel.FINANCE, ExpenseStatus.PENDING);
	}

	/**
	 * Get expenses pending admin approval (approved by finance)
	 */
	public List<Expense> getExpensesPendingAdminApproval() {
		return expenseRepository.findByApprovalLevelAndApprovalStatus(ApprovalLevel.ADMIN, ExpenseStatus.PENDING);
	}

	/**
	 * Get fully approved expenses (for employee dashboard)
	 */
	public List<Expense> getFullyApprovedExpenses() {
		return expenseRepository.findByApprovalStatus(ExpenseStatus.APPROVED);
	}

	/**
	 * Get all expenses for a specific user
	 */
	public List<Expense> getAllByUser(com.expense.management.model.User user) {
		return expenseRepository.findByUser(user);
	}
}
