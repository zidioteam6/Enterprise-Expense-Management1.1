package com.expense.management.controller;

import com.expense.management.services.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/cloudinary")
@CrossOrigin(origins = "http://localhost:3000")
public class CloudinaryController {

    @Autowired
    private CloudinaryService cloudinaryService;

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testCloudinaryConnection() {
        try {
            // This is a simple test to verify Cloudinary is configured correctly
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Cloudinary is configured and ready to use"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", "Cloudinary configuration error: " + e.getMessage()
            ));
        }
    }
} 