package com.expense.management.controller;

import com.expense.management.model.Role;
import com.expense.management.model.User;
import com.expense.management.repository.RoleRepository;
import com.expense.management.repository.UserRepository;
import com.expense.management.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping(value = "/login", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.get("email"),
                    loginRequest.get("password")
                )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            
            User user = userRepository.findByEmail(loginRequest.get("email"))
                .orElseThrow(() -> new RuntimeException("User not found after authentication"));

            String roleName = (user.getRole() != null) ? user.getRole().getName() : "UNKNOWN_ROLE";

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", roleName,
                "isAuthenticated", true
            ));
            response.put("redirect", "/dashboard");

            return ResponseEntity.ok()
                .header("Authorization", "Bearer " + jwt)
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            return ResponseEntity.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                    "message", "Invalid email or password",
                    "error", e.getMessage(),
                    "isAuthenticated", false
                ));
        }
    }

    @PostMapping(value = "/signup", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> signup(@RequestBody Map<String, String> signupRequest) {
        try {
            // Validate required fields
            if (!signupRequest.containsKey("email") || !signupRequest.containsKey("password") 
                || !signupRequest.containsKey("fullName")) {
                return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("message", "Missing required fields"));
            }

            // Check if email already exists
            if (userRepository.existsByEmail(signupRequest.get("email"))) {
                return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("message", "Email is already taken"));
            }

            // Always assign EMPLOYEE role for new signups
            Role role = roleRepository.findByName("ROLE_EMPLOYEE")
                .orElseThrow(() -> new RuntimeException("Default role not found"));

            // Create new user
            User user = new User();
            user.setEmail(signupRequest.get("email"));
            user.setPassword(passwordEncoder.encode(signupRequest.get("password")));
            user.setFullName(signupRequest.get("fullName"));
            user.setRole(role);

            user = userRepository.save(user);

            // Generate token for auto-login after signup
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    user.getEmail(),
                    signupRequest.get("password")
                )
            );
            String jwt = tokenProvider.generateToken(authentication);

            // Return success response with token
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("token", jwt);
            response.put("user", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", user.getRole().getName(),
                "isAuthenticated", true
            ));
            response.put("redirect", "/dashboard");

            return ResponseEntity.ok()
                .header("Authorization", "Bearer " + jwt)
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                    "message", "Error during signup",
                    "error", e.getMessage(),
                    "isAuthenticated", false
                ));
        }
    }

    @PostMapping("/profile/image")
    public ResponseEntity<?> uploadProfileImage(@RequestParam("file") MultipartFile file) {
        try {
            // Get the currently authenticated user
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setProfileImage(file.getBytes());
            user.setProfileImageType(file.getContentType());
            userRepository.save(user);

            return ResponseEntity.ok().body("Profile image uploaded successfully!");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload image: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/profile/image")
    public ResponseEntity<?> getProfileImage() {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getProfileImage() != null && user.getProfileImageType() != null) {
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(user.getProfileImageType()))
                        .body(user.getProfileImage());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to retrieve image: " + e.getMessage());
        }
    }
} 