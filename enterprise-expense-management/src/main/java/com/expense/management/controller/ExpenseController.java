package com.expense.management.controller;

import com.expense.management.model.Budget;
import com.expense.management.model.Expense;
import com.expense.management.model.ExpenseStatus;
import com.expense.management.model.User;
import com.expense.management.enums.ApprovalLevel;
import com.expense.management.repository.ExpenseRepository;
import com.expense.management.services.ExpenseService;
import com.expense.management.services.CloudinaryService;
import com.expense.management.util.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// PDF generation imports
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Element;
import com.itextpdf.text.Font;
import com.itextpdf.text.FontFactory;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.BaseFont;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final AuditLogController auditLogController;
	
	@Autowired
	ExpenseService expenseService;

	@Autowired
	ExpenseRepository expenseRepository;

	@Autowired
	com.expense.management.repository.UserRepository userRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    ExpenseController(AuditLogController auditLogController) {
        this.auditLogController = auditLogController;
    }
	
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> createExpense(
			 @RequestParam("amount") double amount,
		        @RequestParam("category") String category,
		        @RequestParam("description") String description,
		        @RequestParam("date") String dateString,
		        @RequestParam(value = "priority", required = false) String priority,
		        @RequestParam(value = "comments", required = false) String comments,
		        @RequestParam(value = "attachment", required = false) MultipartFile attachment) throws IOException {
	    
		 Expense expense = new Expense();
		    expense.setAmount(amount);
		    expense.setCategory(category);
		    expense.setDescription(description);
		    expense.setPriority(priority != null ? priority : "MEDIUM");
		    
		    // Auto-approve expenses under $100
		    if (amount <= 100.0) {
		        expense.setApprovalStatus(ExpenseStatus.APPROVED);
		    } else {
		        expense.setApprovalStatus(ExpenseStatus.PENDING);
		    }

        // Set approval level for 3-level approval workflow (only for expenses that need approval)
        if (amount > 100.0) {
            if (amount < 3000) {
                expense.setApprovalLevel(ApprovalLevel.MANAGER);
            } else if (amount < 20000) {
                expense.setApprovalLevel(ApprovalLevel.FINANCE);
            } else {
                expense.setApprovalLevel(ApprovalLevel.ADMIN);
            }
		    }
		    
		    expense.setComments(comments);
		    expense.setDate(LocalDate.parse(dateString));
		    
		    // Handle receipt upload to Cloudinary
		    if (attachment != null && !attachment.isEmpty()) {
		        try {
		            Map<String, Object> uploadResult = cloudinaryService.uploadReceipt(attachment);
		            String receiptUrl = cloudinaryService.getSecureUrl(uploadResult);
		            expense.setReceiptUrl(receiptUrl);
		            expense.setAttachmentType(attachment.getContentType());
		        } catch (Exception e) {
		            return ResponseEntity.badRequest().body(Map.of("error", "Receipt upload failed: " + e.getMessage()));
		        }
		    }

		    // Associate with current user
		    String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(userEmail).orElse(null);
		    expense.setUser(user);

		    expenseService.add(expense);
		    
		    // Create a custom response object to avoid circular reference
		    Map<String, Object> response = new HashMap<>();
		    response.put("message", "Expense saved successfully");
		    
		    Map<String, Object> expenseData = new HashMap<>();
		    expenseData.put("id", expense.getId());
		    expenseData.put("amount", expense.getAmount());
		    expenseData.put("category", expense.getCategory());
		    expenseData.put("description", expense.getDescription());
		    expenseData.put("date", expense.getDate());
		    expenseData.put("approvalStatus", expense.getApprovalStatus());
		    expenseData.put("comments", expense.getComments());
		    expenseData.put("priority", expense.getPriority());
		    expenseData.put("receiptUrl", expense.getReceiptUrl());
		    
		    response.put("expense", expenseData);
		    
		    return ResponseEntity.ok(response);
	}
	
    @GetMapping
    public ResponseEntity<?> getAllExpenses() {
        List<Expense> expenses = expenseService.getAll();

        // Create clean expense data without circular references
        List<Map<String, Object>> cleanExpenses = expenses.stream()
                .map(expense -> {
                    Map<String, Object> cleanExpense = new HashMap<>();
                    cleanExpense.put("id", expense.getId());
                    cleanExpense.put("amount", expense.getAmount());
                    cleanExpense.put("category", expense.getCategory());
                    cleanExpense.put("description", expense.getDescription());
                    cleanExpense.put("date", expense.getDate());
                    cleanExpense.put("approvalStatus", expense.getApprovalStatus());
                    cleanExpense.put("approvalLevel", expense.getApprovalLevel());
                    cleanExpense.put("priority", expense.getPriority());
                    cleanExpense.put("comments", expense.getComments());
                    cleanExpense.put("attachmentType", expense.getAttachmentType());

                    // Add user information without circular reference
                    if (expense.getUser() != null) {
                        Map<String, Object> userInfo = new HashMap<>();
                        userInfo.put("id", expense.getUser().getId());
                        userInfo.put("email", expense.getUser().getEmail());
                        userInfo.put("fullName", expense.getUser().getFullName());
                        userInfo.put("role",
                                expense.getUser().getRole() != null ? expense.getUser().getRole().getName() : null);
                        cleanExpense.put("user", userInfo);
                    }

                    return cleanExpense;
                })
                .collect(java.util.stream.Collectors.toList());

        return new ResponseEntity<>(cleanExpenses, HttpStatus.OK);
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
    public ResponseEntity<?> deleteExpense(@PathVariable Long expenseId) {
        System.out.println("=== DELETE EXPENSE ENDPOINT CALLED ===");
        System.out.println("Expense ID: " + expenseId);
        System.out.println("Current user: " + SecurityContextHolder.getContext().getAuthentication().getName());
        
        try {
            // Use Spring Data JPA repository instead of HibernateUtil
            Expense expense = expenseRepository.findByIdWithUser(expenseId).orElse(null);
            
            System.out.println("Found expense: " + (expense != null ? "YES" : "NO"));
            if (expense != null) {
                System.out.println(
                        "Expense user: " + (expense.getUser() != null ? expense.getUser().getEmail() : "NULL"));
                System.out.println("Expense status: " + expense.getApprovalStatus());
            }
            
            if (expense == null) {
                System.out.println("Expense not found, returning 404");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Expense not found."));
            }
            
            // Get current user
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            if (expense.getUser() == null || !expense.getUser().getEmail().equals(userEmail)) {
                System.out.println("User not authorized to delete this expense");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "You are not allowed to delete this expense."));
            }
            
            if (expense.getApprovalStatus() != ExpenseStatus.PENDING) {
                System.out.println("Expense is not pending, cannot delete");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Only pending expenses can be deleted."));
            }

            // Delete receipt from Cloudinary if exists
            if (expense.getReceiptUrl() != null && !expense.getReceiptUrl().isEmpty()) {
                try {
                    String publicId = cloudinaryService.extractPublicIdFromUrl(expense.getReceiptUrl());
                    if (publicId != null) {
                        cloudinaryService.deleteFile(publicId);
                    }
                } catch (Exception e) {
                    System.out.println("Warning: Failed to delete receipt from Cloudinary: " + e.getMessage());
                    // Continue with expense deletion even if Cloudinary deletion fails
                }
            }

            // Delete receipt from Cloudinary if exists
            if (expense.getReceiptUrl() != null && !expense.getReceiptUrl().isEmpty()) {
                try {
                    String publicId = cloudinaryService.extractPublicIdFromUrl(expense.getReceiptUrl());
                    if (publicId != null) {
                        cloudinaryService.deleteFile(publicId);
                    }
                } catch (Exception e) {
                    System.out.println("Warning: Failed to delete receipt from Cloudinary: " + e.getMessage());
                    // Continue with expense deletion even if Cloudinary deletion fails
                }
            }
            
            // Delete receipt from Cloudinary if exists
            if (expense.getReceiptUrl() != null && !expense.getReceiptUrl().isEmpty()) {
                try {
                    String publicId = cloudinaryService.extractPublicIdFromUrl(expense.getReceiptUrl());
                    if (publicId != null) {
                        cloudinaryService.deleteFile(publicId);
                    }
                } catch (Exception e) {
                    System.out.println("Warning: Failed to delete receipt from Cloudinary: " + e.getMessage());
                    // Continue with expense deletion even if Cloudinary deletion fails
                }
            }
            
            System.out.println("Deleting expense...");
            expenseRepository.delete(expense);
            System.out.println("Expense deleted successfully!");
            return ResponseEntity.ok(Map.of("message", "Expense deleted successfully!"));
        } catch (Exception e) {
            System.out.println("Error deleting expense: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error deleting expense."));
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
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User manager = userRepository.findByEmail(email).orElse(null);
        if (manager == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Manager not found");
        }
        boolean result = expenseService.approve(id, manager.getId());
        return result ? ResponseEntity.ok("updated!") : ResponseEntity.ok("failed!");
    }

    // Reject expense by ID
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectExpense(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User manager = userRepository.findByEmail(email).orElse(null);
        if (manager == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Manager not found");
        }
        boolean result = expenseService.reject(id, manager.getId());
        return result ? ResponseEntity.ok("rejected!") : ResponseEntity.ok("failed!");
    }

    // Endpoint to get all expenses processed by the current manager
    @GetMapping("/processed/manager")
    public ResponseEntity<List<Map<String, Object>>> getProcessedByManager() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User manager = userRepository.findByEmail(email).orElse(null);
        if (manager == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Expense> processed = expenseRepository.findByApprovedByManagerId(manager.getId());
        // Return clean expense data with user info
        List<Map<String, Object>> cleanExpenses = processed.stream()
            .map(expense -> {
                Map<String, Object> cleanExpense = new HashMap<>();
                cleanExpense.put("id", expense.getId());
                cleanExpense.put("amount", expense.getAmount());
                cleanExpense.put("category", expense.getCategory());
                cleanExpense.put("description", expense.getDescription());
                cleanExpense.put("date", expense.getDate());
                cleanExpense.put("approvalStatus", expense.getApprovalStatus());
                cleanExpense.put("approvalLevel", expense.getApprovalLevel());
                cleanExpense.put("priority", expense.getPriority());
                cleanExpense.put("comments", expense.getComments());
                cleanExpense.put("attachmentType", expense.getAttachmentType());
                cleanExpense.put("receiptUrl", expense.getReceiptUrl());
                // Add user information
                if (expense.getUser() != null) {
                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("id", expense.getUser().getId());
                    userInfo.put("email", expense.getUser().getEmail());
                    userInfo.put("fullName", expense.getUser().getFullName());
                    cleanExpense.put("user", userInfo);
                }
                return cleanExpense;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(cleanExpenses);
    }

    // Role-specific endpoints for 3-level approval workflow
    
    // Get expenses pending manager approval
    @GetMapping("/pending/manager")
    public ResponseEntity<?> getExpensesPendingManagerApproval() {
        List<Expense> expenses = expenseService.getExpensesPendingManagerApproval();
        return ResponseEntity.ok(createCleanExpenseList(expenses));
    }

    // Get expenses pending finance approval (approved by manager)
    @GetMapping("/pending/finance")
    public ResponseEntity<?> getExpensesPendingFinanceApproval() {
        List<Expense> expenses = expenseService.getExpensesPendingFinanceApproval();
        return ResponseEntity.ok(createCleanExpenseList(expenses));
    }

    // Get expenses pending admin approval (approved by finance)
    @GetMapping("/pending/admin")
    public ResponseEntity<?> getExpensesPendingAdminApproval() {
        List<Expense> expenses = expenseService.getExpensesPendingAdminApproval();
        return ResponseEntity.ok(createCleanExpenseList(expenses));
    }

    // Get fully approved expenses (for employee dashboard)
    @GetMapping("/approved")
    public ResponseEntity<?> getFullyApprovedExpenses() {
        List<Expense> expenses = expenseService.getFullyApprovedExpenses();
        return ResponseEntity.ok(createCleanExpenseList(expenses));
    }

    // Endpoint to get all expenses processed by the current finance user
    @GetMapping("/processed/finance")
    public ResponseEntity<List<Map<String, Object>>> getProcessedByFinance() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User finance = userRepository.findByEmail(email).orElse(null);
        if (finance == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        // Find all expenses where approvalLevel is ADMIN or status is APPROVED/REJECTED and finance approved them
        // For now, show all expenses where approvalLevel is ADMIN or status is APPROVED/REJECTED, but only if amount > 100
        List<Expense> processed = expenseRepository.findAll().stream()
            .filter(e -> (e.getApprovalLevel() == ApprovalLevel.ADMIN ||
                          e.getApprovalStatus() == ExpenseStatus.APPROVED ||
                          e.getApprovalStatus() == ExpenseStatus.REJECTED)
                      && e.getAmount() > 100.0)
            .collect(Collectors.toList());
        List<Map<String, Object>> cleanExpenses = processed.stream()
            .map(expense -> {
                Map<String, Object> cleanExpense = new HashMap<>();
                cleanExpense.put("id", expense.getId());
                cleanExpense.put("amount", expense.getAmount());
                cleanExpense.put("category", expense.getCategory());
                cleanExpense.put("description", expense.getDescription());
                cleanExpense.put("date", expense.getDate());
                cleanExpense.put("approvalStatus", expense.getApprovalStatus());
                cleanExpense.put("approvalLevel", expense.getApprovalLevel());
                cleanExpense.put("priority", expense.getPriority());
                cleanExpense.put("comments", expense.getComments());
                cleanExpense.put("attachmentType", expense.getAttachmentType());
                cleanExpense.put("receiptUrl", expense.getReceiptUrl());
                // Add user information
                if (expense.getUser() != null) {
                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("id", expense.getUser().getId());
                    userInfo.put("email", expense.getUser().getEmail());
                    userInfo.put("fullName", expense.getUser().getFullName());
                    cleanExpense.put("user", userInfo);
                }
                return cleanExpense;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(cleanExpenses);
    }

    // Helper method to create clean expense list without circular references
    private List<Map<String, Object>> createCleanExpenseList(List<Expense> expenses) {
        return expenses.stream()
                .map(expense -> {
                    Map<String, Object> cleanExpense = new HashMap<>();
                    cleanExpense.put("id", expense.getId());
                    cleanExpense.put("amount", expense.getAmount());
                    cleanExpense.put("category", expense.getCategory());
                    cleanExpense.put("description", expense.getDescription());
                    cleanExpense.put("date", expense.getDate());
                    cleanExpense.put("approvalStatus", expense.getApprovalStatus());
                    cleanExpense.put("approvalLevel", expense.getApprovalLevel());
                    cleanExpense.put("priority", expense.getPriority());
                    cleanExpense.put("comments", expense.getComments());
                    cleanExpense.put("attachmentType", expense.getAttachmentType());
                    cleanExpense.put("receiptUrl", expense.getReceiptUrl());

                    // Add user information without circular reference
                    if (expense.getUser() != null) {
                        Map<String, Object> userInfo = new HashMap<>();
                        userInfo.put("id", expense.getUser().getId());
                        userInfo.put("email", expense.getUser().getEmail());
                        userInfo.put("fullName", expense.getUser().getFullName());
                        userInfo.put("role",
                                expense.getUser().getRole() != null ? expense.getUser().getRole().getName() : null);
                        cleanExpense.put("user", userInfo);
                    }

                    return cleanExpense;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/export/{format}")
    public ResponseEntity<byte[]> exportExpenses(@PathVariable String format) {
        try {
            // Get current user
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            com.expense.management.model.User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found".getBytes());
            }
            // Get user's expenses
            List<Expense> userExpenses = expenseService.getAllByUser(user);
            // Only include PENDING, APPROVED, or REJECTED
            userExpenses = userExpenses.stream()
                .filter(e -> Arrays.asList(ExpenseStatus.PENDING, ExpenseStatus.APPROVED, ExpenseStatus.REJECTED)
                    .contains(e.getApprovalStatus()))
                .collect(Collectors.toList());
            
            if (format.equalsIgnoreCase("pdf")) {
                byte[] pdfBytes = generatePdfReport(userExpenses);
                return ResponseEntity.ok()
                        .header("Content-Disposition", "attachment; filename=expenses_report.pdf")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(pdfBytes);
            } else if (format.equalsIgnoreCase("xlsx")) {
                byte[] excelBytes = generateExcelReport(userExpenses);
                return ResponseEntity.ok()
                        .header("Content-Disposition", "attachment; filename=expenses_report.xlsx")
                        .contentType(MediaType
                                .parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(excelBytes);
            } else {
                return ResponseEntity.badRequest().body("Unsupported format".getBytes());
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating report".getBytes());
        }
    }
    
    private byte[] generatePdfReport(List<Expense> expenses) throws DocumentException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, baos);
        
        document.open();
        
        // Add title
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        Paragraph title = new Paragraph("Expense Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        document.add(new Paragraph(" ")); // Spacing
        
        // Add date
        Font dateFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
        Paragraph date = new Paragraph(
                "Generated on: " + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")), dateFont);
        document.add(date);
        document.add(new Paragraph(" ")); // Spacing
        
        // Create table
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        
        // Add headers
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        String[] headers = { "Date", "Category", "Description", "Amount", "Status" };
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(5);
            table.addCell(cell);
        }
        
        // Add data
        Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        double totalAmount = 0;
        for (Expense expense : expenses) {
            table.addCell(new PdfPCell(new Phrase(expense.getDate().toString(), dataFont)));
            table.addCell(new PdfPCell(new Phrase(expense.getCategory(), dataFont)));
            table.addCell(new PdfPCell(new Phrase(expense.getDescription(), dataFont)));
            table.addCell(new PdfPCell(new Phrase("$" + String.format("%.2f", expense.getAmount()), dataFont)));
            table.addCell(new PdfPCell(new Phrase(expense.getApprovalStatus().toString(), dataFont)));
            totalAmount += expense.getAmount();
        }
        
        document.add(table);
        document.add(new Paragraph(" ")); // Spacing
        
        // Add total
        Font totalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        Paragraph total = new Paragraph("Total Amount: $" + String.format("%.2f", totalAmount), totalFont);
        document.add(total);
        
        document.close();
        return baos.toByteArray();
    }
    
    private String generateCsvReport(List<Expense> expenses) {
        StringBuilder csv = new StringBuilder();
        csv.append("Date,Category,Description,Amount,Status\n");
        
        for (Expense expense : expenses) {
            csv.append(expense.getDate()).append(",")
               .append(expense.getCategory()).append(",")
               .append("\"").append(expense.getDescription().replace("\"", "\"\"")).append("\",")
               .append(expense.getAmount()).append(",")
               .append(expense.getApprovalStatus()).append("\n");
        }
        
        return csv.toString();
    }

    private byte[] generateExcelReport(List<Expense> expenses) throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Expenses");
            int rowIdx = 0;
            // Header
            Row header = sheet.createRow(rowIdx++);
            String[] columns = { "Date", "Category", "Description", "Amount", "Status" };
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
            }
            // Data
            for (Expense expense : expenses) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(expense.getDate() != null ? expense.getDate().toString() : "");
                row.createCell(1).setCellValue(expense.getCategory() != null ? expense.getCategory() : "");
                row.createCell(2).setCellValue(expense.getDescription() != null ? expense.getDescription() : "");
                row.createCell(3).setCellValue(expense.getAmount());
                row.createCell(4).setCellValue(
                        expense.getApprovalStatus() != null ? expense.getApprovalStatus().toString() : "");
            }
            // Autosize columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }
            // Write to byte array
            try (java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream()) {
                workbook.write(bos);
                return bos.toByteArray();
            }
        }
    }

    @PutMapping("/{expenseId}")
    public ResponseEntity<?> updateExpense(@PathVariable Long expenseId, @RequestBody Map<String, Object> updates) {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Expense expense = expenseRepository.findByIdWithUser(expenseId).orElse(null);
            if (expense == null) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Expense not found.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            if (expense.getUser() == null || !expense.getUser().getEmail().equals(userEmail)) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "You are not allowed to edit this expense.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            // Prepare updated values, fallback to current if not provided
            double amount = updates.containsKey("amount") && updates.get("amount") != null
                    ? Double.parseDouble(updates.get("amount").toString())
                    : expense.getAmount();
            String category = updates.containsKey("category") && updates.get("category") != null
                    ? updates.get("category").toString()
                    : expense.getCategory();
            String description = updates.containsKey("description") && updates.get("description") != null
                    ? updates.get("description").toString()
                    : expense.getDescription();
            java.time.LocalDate date = updates.containsKey("date") && updates.get("date") != null
                    ? java.time.LocalDate.parse(updates.get("date").toString())
                    : expense.getDate();
            String comments = updates.containsKey("comments") && updates.get("comments") != null
                    ? updates.get("comments").toString()
                    : expense.getComments();
            String priority = updates.containsKey("priority") && updates.get("priority") != null
                    ? updates.get("priority").toString()
                    : expense.getPriority();

            // Set approval status based on amount after any edit
            double AUTO_APPROVAL_THRESHOLD = 100.0;
                if (amount < AUTO_APPROVAL_THRESHOLD) {
                    expense.setApprovalStatus(ExpenseStatus.APPROVED);
                } else {
                    expense.setApprovalStatus(ExpenseStatus.PENDING);
            }

            // Set approval level for 3-level approval workflow (only for expenses that need approval)
            if (amount > AUTO_APPROVAL_THRESHOLD) {
                if (amount < 3000) {
                    expense.setApprovalLevel(ApprovalLevel.MANAGER);
                } else if (amount < 20000) {
                    expense.setApprovalLevel(ApprovalLevel.FINANCE);
                } else {
                    expense.setApprovalLevel(ApprovalLevel.ADMIN);
                }
            }

            // Update other fields
            expense.setAmount(amount);
            expense.setCategory(category);
            expense.setDescription(description);
            expense.setDate(date);
            expense.setComments(comments);
            expense.setPriority(priority);
            expenseRepository.save(expense);
            return ResponseEntity.ok(expense);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error updating expense.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/export/yearly-trend/{year}")
    public ResponseEntity<byte[]> exportYearlyTrendReport(@PathVariable int year) {
        try {
            // Get current user
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            com.expense.management.model.User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found".getBytes());
            }
            // Get user's expenses for the year
            List<Expense> userExpenses = expenseService.getAllByUser(user);
            // Filter for the given year
            List<Expense> yearlyExpenses = userExpenses.stream()
                    .filter(e -> e.getDate() != null && e.getDate().getYear() == year)
                    .toList();

            // Aggregate by month
            Map<Integer, Double> monthTotals = new HashMap<>();
            for (int m = 1; m <= 12; m++)
                monthTotals.put(m, 0.0);
            for (Expense e : yearlyExpenses) {
                int month = e.getDate().getMonthValue();
                monthTotals.put(month, monthTotals.get(month) + e.getAmount());
            }

            // Generate PDF
            byte[] pdfBytes = generateYearlyTrendPdf(year, monthTotals);

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=yearly_trend_report_" + year + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating yearly trend report".getBytes());
        }
    }

    private byte[] generateYearlyTrendPdf(int year, Map<Integer, Double> monthTotals)
            throws com.itextpdf.text.DocumentException {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        com.itextpdf.text.Document document = new com.itextpdf.text.Document();
        com.itextpdf.text.pdf.PdfWriter.getInstance(document, baos);

        document.open();

        com.itextpdf.text.Font titleFont = com.itextpdf.text.FontFactory
                .getFont(com.itextpdf.text.FontFactory.HELVETICA_BOLD, 18);
        com.itextpdf.text.Paragraph title = new com.itextpdf.text.Paragraph("Yearly Expense Trend Report - " + year,
                titleFont);
        title.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        document.add(title);
        document.add(new com.itextpdf.text.Paragraph(" "));

        com.itextpdf.text.pdf.PdfPTable table = new com.itextpdf.text.pdf.PdfPTable(2);
        table.setWidthPercentage(60);
        table.setHorizontalAlignment(com.itextpdf.text.Element.ALIGN_CENTER);

        com.itextpdf.text.Font headerFont = com.itextpdf.text.FontFactory
                .getFont(com.itextpdf.text.FontFactory.HELVETICA_BOLD, 12);
        com.itextpdf.text.pdf.PdfPCell monthHeader = new com.itextpdf.text.pdf.PdfPCell(
                new com.itextpdf.text.Phrase("Month", headerFont));
        com.itextpdf.text.pdf.PdfPCell totalHeader = new com.itextpdf.text.pdf.PdfPCell(
                new com.itextpdf.text.Phrase("Total Spent", headerFont));
        monthHeader.setHorizontalAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        totalHeader.setHorizontalAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        table.addCell(monthHeader);
        table.addCell(totalHeader);

        com.itextpdf.text.Font dataFont = com.itextpdf.text.FontFactory.getFont(com.itextpdf.text.FontFactory.HELVETICA,
                11);
        double yearlyTotal = 0;
        for (int m = 1; m <= 12; m++) {
            String monthName = java.time.Month.of(m).name();
            double total = monthTotals.get(m);
            table.addCell(new com.itextpdf.text.pdf.PdfPCell(new com.itextpdf.text.Phrase(monthName, dataFont)));
            table.addCell(new com.itextpdf.text.pdf.PdfPCell(
                    new com.itextpdf.text.Phrase("$" + String.format("%.2f", total), dataFont)));
            yearlyTotal += total;
        }
        document.add(table);
        document.add(new com.itextpdf.text.Paragraph(" "));

        com.itextpdf.text.Font totalFont = com.itextpdf.text.FontFactory
                .getFont(com.itextpdf.text.FontFactory.HELVETICA_BOLD, 14);
        com.itextpdf.text.Paragraph total = new com.itextpdf.text.Paragraph(
                "Yearly Total: $" + String.format("%.2f", yearlyTotal), totalFont);
        total.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        document.add(total);

        document.close();
        return baos.toByteArray();
    }

    @GetMapping("/export/monthly-detailed/{year}/{month}")
    public ResponseEntity<byte[]> exportMonthlyDetailedReport(@PathVariable int year, @PathVariable int month) {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            com.expense.management.model.User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found".getBytes());
            }
            // Get user's expenses for the month
            List<Expense> userExpenses = expenseService.getAllByUser(user);
            List<Expense> monthlyExpenses = userExpenses.stream()
                    .filter(e -> e.getDate() != null && e.getDate().getYear() == year
                            && e.getDate().getMonthValue() == month)
                    .toList();

            // Generate PDF
            byte[] pdfBytes = generateMonthlyDetailedPdf(year, month, monthlyExpenses);

            return ResponseEntity.ok()
                    .header("Content-Disposition",
                            "attachment; filename=monthly_detailed_report_" + year + "_" + month + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating monthly detailed report".getBytes());
        }
    }

    private byte[] generateMonthlyDetailedPdf(int year, int month, List<Expense> expenses)
            throws com.itextpdf.text.DocumentException {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        com.itextpdf.text.Document document = new com.itextpdf.text.Document();
        com.itextpdf.text.pdf.PdfWriter.getInstance(document, baos);

        document.open();

        com.itextpdf.text.Font titleFont = com.itextpdf.text.FontFactory
                .getFont(com.itextpdf.text.FontFactory.HELVETICA_BOLD, 18);
        com.itextpdf.text.Paragraph title = new com.itextpdf.text.Paragraph(
                "Detailed Monthly Expense Report - " + year + "-" + String.format("%02d", month), titleFont);
        title.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        document.add(title);
        document.add(new com.itextpdf.text.Paragraph(" "));

        com.itextpdf.text.pdf.PdfPTable table = new com.itextpdf.text.pdf.PdfPTable(5);
        table.setWidthPercentage(100);

        com.itextpdf.text.Font headerFont = com.itextpdf.text.FontFactory
                .getFont(com.itextpdf.text.FontFactory.HELVETICA_BOLD, 12);
        String[] headers = { "Date", "Category", "Description", "Amount", "Status" };
        for (String header : headers) {
            com.itextpdf.text.pdf.PdfPCell cell = new com.itextpdf.text.pdf.PdfPCell(
                    new com.itextpdf.text.Phrase(header, headerFont));
            cell.setHorizontalAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
            cell.setPadding(5);
            table.addCell(cell);
        }

        com.itextpdf.text.Font dataFont = com.itextpdf.text.FontFactory.getFont(com.itextpdf.text.FontFactory.HELVETICA,
                10);
        double totalAmount = 0;
        for (Expense expense : expenses) {
            table.addCell(new com.itextpdf.text.pdf.PdfPCell(
                    new com.itextpdf.text.Phrase(expense.getDate().toString(), dataFont)));
            table.addCell(
                    new com.itextpdf.text.pdf.PdfPCell(new com.itextpdf.text.Phrase(expense.getCategory(), dataFont)));
            table.addCell(new com.itextpdf.text.pdf.PdfPCell(
                    new com.itextpdf.text.Phrase(expense.getDescription(), dataFont)));
            table.addCell(new com.itextpdf.text.pdf.PdfPCell(
                    new com.itextpdf.text.Phrase("$" + String.format("%.2f", expense.getAmount()), dataFont)));
            table.addCell(new com.itextpdf.text.pdf.PdfPCell(
                    new com.itextpdf.text.Phrase(expense.getApprovalStatus().toString(), dataFont)));
            totalAmount += expense.getAmount();
        }

        document.add(table);
        document.add(new com.itextpdf.text.Paragraph(" "));

        com.itextpdf.text.Font totalFont = com.itextpdf.text.FontFactory
                .getFont(com.itextpdf.text.FontFactory.HELVETICA_BOLD, 14);
        com.itextpdf.text.Paragraph total = new com.itextpdf.text.Paragraph(
                "Monthly Total: $" + String.format("%.2f", totalAmount), totalFont);
        total.setAlignment(com.itextpdf.text.Element.ALIGN_RIGHT);
        document.add(total);

        document.close();
        return baos.toByteArray();
    }

    @GetMapping("/export/category-spending/{year}")
    public ResponseEntity<byte[]> exportCategorySpendingReport(@PathVariable int year) {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            com.expense.management.model.User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found".getBytes());
            }
            // Get user's expenses for the year
            List<Expense> userExpenses = expenseService.getAllByUser(user);
            List<Expense> yearlyExpenses = userExpenses.stream()
                    .filter(e -> e.getDate() != null && e.getDate().getYear() == year)
                    .toList();

            // Aggregate by category
            Map<String, Double> categoryTotals = new HashMap<>();
            double total = 0;
            for (Expense e : yearlyExpenses) {
                categoryTotals.put(e.getCategory(), categoryTotals.getOrDefault(e.getCategory(), 0.0) + e.getAmount());
                total += e.getAmount();
            }

            // Generate PDF
            byte[] pdfBytes = generateCategorySpendingPdf(year, categoryTotals, total);

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=category_spending_report_" + year + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating category spending report".getBytes());
        }
    }

    private byte[] generateCategorySpendingPdf(int year, Map<String, Double> categoryTotals, double total)
            throws com.itextpdf.text.DocumentException {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        com.itextpdf.text.Document document = new com.itextpdf.text.Document();
        com.itextpdf.text.pdf.PdfWriter.getInstance(document, baos);

        document.open();

        com.itextpdf.text.Font titleFont = com.itextpdf.text.FontFactory
                .getFont(com.itextpdf.text.FontFactory.HELVETICA_BOLD, 18);
        com.itextpdf.text.Paragraph title = new com.itextpdf.text.Paragraph("Category Spending Report - " + year,
                titleFont);
        title.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        document.add(title);
        document.add(new com.itextpdf.text.Paragraph(" "));

        com.itextpdf.text.pdf.PdfPTable table = new com.itextpdf.text.pdf.PdfPTable(3);
        table.setWidthPercentage(80);
        table.setHorizontalAlignment(com.itextpdf.text.Element.ALIGN_CENTER);

        com.itextpdf.text.Font headerFont = com.itextpdf.text.FontFactory
                .getFont(com.itextpdf.text.FontFactory.HELVETICA_BOLD, 12);
        String[] headers = { "Category", "Total Spent", "Percent" };
        for (String header : headers) {
            com.itextpdf.text.pdf.PdfPCell cell = new com.itextpdf.text.pdf.PdfPCell(
                    new com.itextpdf.text.Phrase(header, headerFont));
            cell.setHorizontalAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
            cell.setPadding(5);
            table.addCell(cell);
        }

        com.itextpdf.text.Font dataFont = com.itextpdf.text.FontFactory.getFont(com.itextpdf.text.FontFactory.HELVETICA,
                11);
        for (Map.Entry<String, Double> entry : categoryTotals.entrySet()) {
            table.addCell(new com.itextpdf.text.pdf.PdfPCell(new com.itextpdf.text.Phrase(entry.getKey(), dataFont)));
            table.addCell(new com.itextpdf.text.pdf.PdfPCell(
                    new com.itextpdf.text.Phrase("$" + String.format("%.2f", entry.getValue()), dataFont)));
            double percent = total > 0 ? (entry.getValue() / total) * 100 : 0;
            table.addCell(new com.itextpdf.text.pdf.PdfPCell(
                    new com.itextpdf.text.Phrase(String.format("%.2f%%", percent), dataFont)));
        }
        document.add(table);
        document.add(new com.itextpdf.text.Paragraph(" "));

        com.itextpdf.text.Font totalFont = com.itextpdf.text.FontFactory
                .getFont(com.itextpdf.text.FontFactory.HELVETICA_BOLD, 14);
        com.itextpdf.text.Paragraph totalPara = new com.itextpdf.text.Paragraph(
                "Yearly Total: $" + String.format("%.2f", total), totalFont);
        totalPara.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        document.add(totalPara);

        document.close();
        return baos.toByteArray();
    }

}
