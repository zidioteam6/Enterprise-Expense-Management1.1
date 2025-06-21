package com.expense.management.controller;

import com.expense.management.dto.LoginRequest;
import com.expense.management.dto.SignupRequest;
import com.expense.management.model.User;
import com.expense.management.repository.UserRepository;
import com.expense.management.services.UserService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import com.expense.management.model.Role;
import com.expense.management.repository.RoleRepository;
import com.expense.management.services.AuditService;
import com.expense.management.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/auth")
public class UserController {

    private final UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    UserController(UserService userService) {
        this.userService = userService;
    }

    @PostConstruct
    public void testPasswordEncoderBean() {
        System.out.println(">>> PasswordEncoder loaded: " + passwordEncoder.getClass().getName());
    }

    @GetMapping("/userEmail")
    public ResponseEntity<?> getUserByEmail(@RequestParam String email) {
        try {
            User user = userService.getUser(email);
            if (user != null) {
                return ResponseEntity.ok(user);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching user: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // Validate request
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
            }
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
            }

            logger.debug("Attempting to authenticate user with email: {}", request.getEmail());

            // Attempt authentication
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );

            logger.debug("Authentication successful for user: {}", request.getEmail());

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate JWT token
            String jwt = jwtTokenProvider.generateToken(authentication);
            
            // Get user details
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            User user = userOpt.orElseThrow(() -> {
                logger.error("User not found after successful authentication: {}", request.getEmail());
                return new RuntimeException("User not found after authentication.");
            });

            logger.debug("User details retrieved successfully: {}", user.getEmail());

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", user.getRole().getName(),
                "isAuthenticated", true
            ));

            return ResponseEntity.ok()
                .header("Authorization", "Bearer " + jwt)
                .body(response);

        } catch (Exception e) {
            logger.error("Authentication failed for user: {}, error: {}", request.getEmail(), e.getMessage());
            String errorMessage = "Authentication failed";
            if (e.getMessage() != null && e.getMessage().contains("Bad credentials")) {
                errorMessage = "Invalid email or password";
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                    "message", errorMessage,
                    "error", e.getMessage(),
                    "isAuthenticated", false
                ));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(@RequestBody SignupRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(400).body(Map.of("message", "Email already registered."));
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // Get the default ROLE_EMPLOYEE role
        Role defaultRole = roleRepository.findByName("ROLE_EMPLOYEE")
            .orElseThrow(() -> new RuntimeException("Default role not found"));

        User newUser = new User();
        newUser.setFullName(request.getFullName());
        newUser.setEmail(request.getEmail());
        newUser.setPassword(encodedPassword);
        newUser.setRole(defaultRole); // Set default role

        userRepository.save(newUser);

        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }

    @PutMapping("/users/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        try {
            if (!request.containsKey("role")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Role is required"));
            }

            String roleName = "ROLE_" + request.get("role").toUpperCase();
            Role newRole = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Log the role change
            auditService.logEvent(
                user.getEmail(),
                "UPDATE_USER_ROLE",
                String.format("Changed role of user %s from %s to %s by %s", 
                    user.getEmail(), 
                    user.getRole().getName(), 
                    newRole.getName(),
                    SecurityContextHolder.getContext().getAuthentication().getName()),
                "SUCCESS"
            );

            user.setRole(newRole);
            user = userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                "message", "User role updated successfully",
                "user", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "fullName", user.getFullName(),
                    "role", user.getRole().getName()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Error updating user role: " + e.getMessage()));
        }
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            List<Map<String, Object>> userList = users.stream().map(user -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", user.getId());
                map.put("email", user.getEmail());
                map.put("fullName", user.getFullName());
                map.put("role", user.getRole().getName());
                return map;
            }).toList();
            return ResponseEntity.ok(userList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching users: " + e.getMessage());
        }
    }
}
