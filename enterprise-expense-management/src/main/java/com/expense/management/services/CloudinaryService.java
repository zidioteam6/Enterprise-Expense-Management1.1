package com.expense.management.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    /**
     * Upload a receipt file to Cloudinary
     * @param file The file to upload (image or PDF)
     * @return Cloudinary upload result containing URL and other metadata
     * @throws IOException if upload fails
     */
    public Map<String, Object> uploadReceipt(MultipartFile file) throws IOException {
        // Validate file
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new IllegalArgumentException("Only images and PDF files are allowed");
        }

        // Validate file size (10MB max)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must be less than 10MB");
        }

        // Upload to Cloudinary with specific folder and transformations
        Map<String, Object> uploadParams = ObjectUtils.asMap(
            "folder", "expense_receipts",
            "resource_type", "auto",
            "allowed_formats", new String[]{"jpg", "jpeg", "png", "gif", "pdf"},
            "transformation", "q_auto,f_auto"
        );

        return cloudinary.uploader().upload(file.getBytes(), uploadParams);
    }

    /**
     * Get the secure URL from upload result
     * @param uploadResult The result from Cloudinary upload
     * @return The secure URL of the uploaded file
     */
    public String getSecureUrl(Map<String, Object> uploadResult) {
        return (String) uploadResult.get("secure_url");
    }

    /**
     * Get the public ID from upload result (useful for deletion)
     * @param uploadResult The result from Cloudinary upload
     * @return The public ID of the uploaded file
     */
    public String getPublicId(Map<String, Object> uploadResult) {
        return (String) uploadResult.get("public_id");
    }

    /**
     * Delete a file from Cloudinary using its public ID
     * @param publicId The public ID of the file to delete
     * @return Deletion result
     * @throws IOException if deletion fails
     */
    public Map<String, Object> deleteFile(String publicId) throws IOException {
        if (publicId == null || publicId.trim().isEmpty()) {
            throw new IllegalArgumentException("Public ID cannot be null or empty");
        }
        return cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }

    /**
     * Extract public ID from Cloudinary URL
     * @param cloudinaryUrl The Cloudinary URL
     * @return The public ID
     */
    public String extractPublicIdFromUrl(String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.trim().isEmpty()) {
            return null;
        }
        
        // Extract public ID from URL like: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
        String[] parts = cloudinaryUrl.split("/upload/");
        if (parts.length < 2) {
            return null;
        }
        
        String afterUpload = parts[1];
        // Remove version prefix if present (v1234567890/)
        if (afterUpload.contains("/")) {
            String[] versionParts = afterUpload.split("/", 2);
            if (versionParts.length > 1) {
                return versionParts[1].split("\\.")[0]; // Remove file extension
            }
        }
        
        return afterUpload.split("\\.")[0]; // Remove file extension
    }
} 