package com.expense.management.controller;


import com.expense.management.model.Budget;
import com.expense.management.model.Expense;
import com.expense.management.model.ExpenseStatus;
import com.expense.management.enums.ApprovalLevel;
import com.expense.management.repository.ExpenseRepository;
import com.expense.management.services.ExpenseService;
import com.expense.management.util.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
//import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final AuditLogController auditLogController;
	
	@Autowired
	ExpenseService expenseService;

	@Autowired
	ExpenseRepository expenseRepository;


    ExpenseController(AuditLogController auditLogController) {
        this.auditLogController = auditLogController;
    }
	
	
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> createExpense(
			 @RequestParam("amount") double amount,
		        @RequestParam("category") String category,
		        @RequestParam("description") String description,
		        @RequestParam("date") String dateString,
		        @RequestParam(value = "comments", required = false) String comments,
		        @RequestParam(value = "receipt", required = false) MultipartFile receipt) throws IOException {
	    
		 Expense expense = new Expense();
		    expense.setAmount(amount);
		    expense.setCategory(category);
		    expense.setDescription(description);
		    
		    // Auto-approve expenses under $100
		    if (amount <= 100.0) {
		        expense.setApprovalStatus(ExpenseStatus.APPROVED);
		    } else {
		        expense.setApprovalStatus(ExpenseStatus.PENDING);
		    }
		    
		    expense.setComments(comments);
		    expense.setDate(LocalDate.parse(dateString));
		    
		    if (receipt != null && !receipt.isEmpty()) {
		        try {
		            expense.setAttachment(receipt.getBytes());
		            expense.setAttachmentType(receipt.getContentType());
		        } catch (IOException e) {
		            return ResponseEntity.badRequest().body(Map.of("error", "File processing error"));
		        }
		    }

		    expenseService.add(expense);
		    
		    return ResponseEntity.ok(Map.of(
		        "message", "Expense saved successfully",
		        "expense", expense
		    ));
	}
	
	
	
	
    @GetMapping
    public ResponseEntity<?> getAllExpenses() {
        return new ResponseEntity<>( expenseService.getAll(), HttpStatus.OK);
    }

    
    
    @GetMapping("/total")
    public double getTotalExpenses() {
        double totalExpenses = 0.0;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<Double> query = session.createQuery("select sum(e.amount) from Expense e", Double.class);
            totalExpenses = query.uniqueResult();
        }
        return totalExpenses;
    }

    @GetMapping("/category/{category}")
    public double getTotalExpensesByCategory(@PathVariable String category) {
        double totalExpenses = 0.0;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<Double> query = session
                    .createQuery("select sum(e.amount) from Expense e where e.category = :category", Double.class);
            query.setParameter("category", category);
            Double result = query.uniqueResult();
            if (result != null) {
                totalExpenses = result.doubleValue();
            }
        }
        return totalExpenses;
    }

    @PostMapping("/budget")
    public String setBudget(@RequestBody Budget budget) {
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            transaction = session.beginTransaction();
            session.saveOrUpdate(budget);
            transaction.commit();
            return "Budget set successfully!";
        } catch (Exception e) {
            if (transaction != null) {
                transaction.rollback();
            }
            e.printStackTrace();
            return "Error setting budget.";
        }
    }

    @GetMapping("/category-budget/{category}")
    public Budget getBudgetByCategory(@PathVariable String category) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<Budget> query = session.createQuery("from Budget where category = :category", Budget.class);
            query.setParameter("category", category);
            return query.uniqueResult();
        }
    }

    @DeleteMapping("/{expenseId}")
    public String deleteExpense(@PathVariable Long expenseId) {
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            transaction = session.beginTransaction();
            Expense expense = session.get(Expense.class, expenseId);
            if (expense != null) {
                session.delete(expense);
                transaction.commit();
                return "Expense deleted successfully!";
            }
            return "Expense not found.";
        } catch (Exception e) {
            if (transaction != null) {
                transaction.rollback();
            }
            e.printStackTrace();
            return "Error deleting expense.";
        }
    }

    @GetMapping("/month/{year}/{month}")
    public List<Expense> getExpensesByMonth(@PathVariable int year, @PathVariable int month) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<Expense> query = session.createQuery("FROM Expense WHERE YEAR(date) = :year AND MONTH(date) = :month",
                    Expense.class);
            query.setParameter("year", year);
            query.setParameter("month", month);
            return query.list();
        }
    }

    @GetMapping("/year/{year}")
    public List<Expense> getExpensesByYear(@PathVariable int year) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<Expense> query = session.createQuery("FROM Expense WHERE YEAR(date) = :year", Expense.class);
            query.setParameter("year", year);
            return query.list();
        }
    }

    @GetMapping("/category-wise")
    public Map<String, Double> getCategoryWiseExpenseData() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<Object[]> query = session.createQuery("SELECT category, SUM(amount) FROM Expense GROUP BY category",
                    Object[].class);
            List<Object[]> results = query.list();

            Map<String, Double> categoryExpenseMap = new HashMap<>();
            for (Object[] result : results) {
                String category = (String) result[0];
                Double totalExpense = (Double) result[1];
                categoryExpenseMap.put(category, totalExpense);
            }
            return categoryExpenseMap;
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<Map<String, String>> getExpenseCategories() {
        Map<String, String> categories = new HashMap<>();
        categories.put("TRAVEL", "✈️ Travel");
        categories.put("FOOD", "🍽️ Food");
        categories.put("OFFICE_SUPPLIES", "📦 Office Supplies");
        categories.put("UTILITIES", "💡 Utilities");
        categories.put("OTHER", "📝 Other");
        return ResponseEntity.ok(categories);
    }

    //////////////////////////////////////////////////

    // Approve expense by ID
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveExpense(@PathVariable Long id) {
    	boolean bol = expenseService.approve(id);
    	System.out.println(bol);
    	if(bol) {
    		return new ResponseEntity<>("updated!" ,HttpStatus.OK);
    	}
    	
    	
        return new ResponseEntity<>( "failed!" ,HttpStatus.OK);
    }

    // Reject expense by ID
//    @PutMapping("/{id}/reject")
//    public String rejectExpense(@PathVariable Long id) {
//        Transaction transaction = null;
//        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
//            transaction = session.beginTransaction();
//
//            Expense expense = session.get(Expense.class, id);
//            if (expense == null) {
//                return "Expense not found.";  
//            }
//
//            expense.setApprovalStatus(ExpenseStatus.REJECTED);
//            session.update(expense);
//
//            transaction.commit();
//            return "Expense rejected successfully!";
//        } catch (Exception e) {
//            if (transaction != null)
//                transaction.rollback();
//            e.printStackTrace();
//            return "Error rejecting expense.";
//        }
//    }

    ///////////////////////////////////

}

// package com.expense.management.controller;

// import com.expense.management.model.Expense;
// import com.expense.management.model.ExpenseStatus;
// import com.expense.management.util.HibernateUtil;
// import org.hibernate.Session;
// import org.hibernate.Transaction;
// import org.hibernate.query.Query;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.multipart.MultipartFile;

// import java.io.IOException;
// import java.time.LocalDate;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;

// @CrossOrigin(origins = "http://localhost:3000")
// @RestController
// @RequestMapping("/api/expenses")
// public class ExpenseController {

// @PostMapping
// public String addExpense(@RequestParam("amount") double amount,
// @RequestParam("category") String category,
// @RequestParam("description") String description,
// @RequestParam("date") String date,
// @RequestParam(value = "attachment", required = false) MultipartFile
// attachment) {
// Transaction transaction = null;
// try (Session session = HibernateUtil.getSessionFactory().openSession()) {
// // Create new expense and set details directly from request parameters
// Expense expense = new Expense();
// expense.setAmount(amount);
// expense.setCategory(category);
// expense.setDescription(description);
// expense.setDate(LocalDate.parse(date)); // Date format "YYYY-MM-DD"
// expense.setApprovalStatus(ExpenseStatus.PENDING); // Default status

// // Handle file attachment (optional)
// if (attachment != null && !attachment.isEmpty()) {
// expense.setAttachment(attachment.getBytes());
// expense.setAttachmentType(attachment.getContentType());
// }

// // Start transaction and save expense
// transaction = session.beginTransaction();
// session.save(expense);
// transaction.commit();

// return "Expense added successfully!";
// } catch (Exception e) {
// if (transaction != null) {
// transaction.rollback();
// }
// e.printStackTrace();
// return "Error adding expense.";
// }
// }

// // Endpoint to approve or reject an expense
// @PostMapping("/approve/{expenseId}")
// public String approveExpense(@PathVariable Long expenseId, @RequestParam
// ExpenseStatus status) {
// Transaction transaction = null;
// try (Session session = HibernateUtil.getSessionFactory().openSession()) {
// transaction = session.beginTransaction();

// Expense expense = session.get(Expense.class, expenseId);
// if (expense == null) {
// return "Expense not found.";
// }

// expense.setApprovalStatus(status);
// session.update(expense);
// transaction.commit();

// return "Expense " + status + " successfully!";
// } catch (Exception e) {
// if (transaction != null) {
// transaction.rollback();
// }
// e.printStackTrace();
// return "Error updating expense status.";
// }
// }

// // Get all expenses
// @GetMapping
// public List<Expense> getAllExpenses() {
// try (Session session = HibernateUtil.getSessionFactory().openSession()) {
// return session.createQuery("from Expense", Expense.class).list();
// }
// }

// // Get total expenses
// @GetMapping("/total")
// public double getTotalExpenses() {
// double totalExpenses = 0.0;
// try (Session session = HibernateUtil.getSessionFactory().openSession()) {
// Query<Double> query = session.createQuery("select sum(e.amount) from Expense
// e", Double.class);
// totalExpenses = query.uniqueResult();
// }
// return totalExpenses;
// }

// // Get total expenses by category
// @GetMapping("/category/{category}")
// public double getTotalExpensesByCategory(@PathVariable String category) {
// double totalExpenses = 0.0;
// try (Session session = HibernateUtil.getSessionFactory().openSession()) {
// Query<Double> query = session.createQuery("select sum(e.amount) from Expense
// e where e.category = :category", Double.class);
// query.setParameter("category", category);
// Double result = query.uniqueResult();
// if (result != null) {
// totalExpenses = result.doubleValue();
// }
// }
// return totalExpenses;
// }

// // Get expenses for a specific month and year
// @GetMapping("/month/{year}/{month}")
// public List<Expense> getExpensesByMonth(@PathVariable int year, @PathVariable
// int month) {
// try (Session session = HibernateUtil.getSessionFactory().openSession()) {
// Query<Expense> query = session.createQuery("FROM Expense WHERE YEAR(date) =
// :year AND MONTH(date) = :month", Expense.class);
// query.setParameter("year", year);
// query.setParameter("month", month);
// return query.list();
// }
// }

// // Get expenses for a specific year
// @GetMapping("/year/{year}")
// public List<Expense> getExpensesByYear(@PathVariable int year) {
// try (Session session = HibernateUtil.getSessionFactory().openSession()) {
// Query<Expense> query = session.createQuery("FROM Expense WHERE YEAR(date) =
// :year", Expense.class);
// query.setParameter("year", year);
// return query.list();
// }
// }

// // Get category-wise expense data
// @GetMapping("/category-wise")
// public Map<String, Double> getCategoryWiseExpenseData() {
// try (Session session = HibernateUtil.getSessionFactory().openSession()) {
// Query<Object[]> query = session.createQuery("SELECT category, SUM(amount)
// FROM Expense GROUP BY category", Object[].class);
// List<Object[]> results = query.list();

// Map<String, Double> categoryExpenseMap = new HashMap<>();
// for (Object[] result : results) {
// String category = (String) result[0];
// Double totalExpense = (Double) result[1];
// categoryExpenseMap.put(category, totalExpense);
// }
// return categoryExpenseMap;
// }
// }
// }
