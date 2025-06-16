package com.expense.management.services;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.expense.management.model.AuditLog;
import com.expense.management.repository.AuditLogRepository;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAll();
    }

    public AuditLog logEvent(String user, String action, String details, String status) {
        AuditLog log = new AuditLog(user, action, details, status);
        return auditLogRepository.save(log);
    }
}

