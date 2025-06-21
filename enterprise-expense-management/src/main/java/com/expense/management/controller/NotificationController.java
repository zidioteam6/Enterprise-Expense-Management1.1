package com.expense.management.controller;

import com.expense.management.model.Notification;
import com.expense.management.model.User;
import com.expense.management.repository.NotificationRepository;
import com.expense.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get all notifications for the current user
     */
    @GetMapping
    public ResponseEntity<?> getUserNotifications() {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(userEmail).orElse(null);
            
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }

            List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
            
            // Convert to clean format without circular references
            List<Map<String, Object>> cleanNotifications = notifications.stream()
                .map(notification -> {
                    Map<String, Object> cleanNotification = new HashMap<>();
                    cleanNotification.put("id", notification.getId());
                    cleanNotification.put("title", notification.getTitle());
                    cleanNotification.put("message", notification.getMessage());
                    cleanNotification.put("isRead", notification.isRead());
                    cleanNotification.put("createdAt", notification.getCreatedAt());
                    return cleanNotification;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(cleanNotifications);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch notifications"));
        }
    }

    /**
     * Mark a notification as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(userEmail).orElse(null);
            
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }

            Notification notification = notificationRepository.findById(id).orElse(null);
            if (notification == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Notification not found"));
            }

            // Check if the notification belongs to the current user
            if (!notification.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Not authorized to access this notification"));
            }

            notification.setRead(true);
            notificationRepository.save(notification);

            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to mark notification as read"));
        }
    }

    /**
     * Mark all notifications as read for the current user
     */
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(userEmail).orElse(null);
            
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }

            List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
            for (Notification notification : notifications) {
                notification.setRead(true);
            }
            notificationRepository.saveAll(notifications);

            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to mark notifications as read"));
        }
    }

    /**
     * Delete a notification
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(userEmail).orElse(null);
            
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }

            Notification notification = notificationRepository.findById(id).orElse(null);
            if (notification == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Notification not found"));
            }

            // Check if the notification belongs to the current user
            if (!notification.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Not authorized to delete this notification"));
            }

            notificationRepository.delete(notification);

            return ResponseEntity.ok(Map.of("message", "Notification deleted"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete notification"));
        }
    }

    /**
     * Get unread notification count for the current user
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(userEmail).orElse(null);
            
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }

            List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
            long unreadCount = notifications.stream().filter(n -> !n.isRead()).count();

            return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get unread count"));
        }
    }
} 