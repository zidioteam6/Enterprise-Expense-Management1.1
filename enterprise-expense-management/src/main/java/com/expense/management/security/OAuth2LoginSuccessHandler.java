package com.expense.management.security;

import com.expense.management.model.Role;
import com.expense.management.model.User;
import com.expense.management.repository.RoleRepository;
import com.expense.management.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                      Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = getEmailFromOAuth2User(oAuth2User);
        String name = getNameFromOAuth2User(oAuth2User);

        // Find or create user
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> createNewUser(email, name));

        // Create authentication token
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
            user.getEmail(),
            null,
            Collections.singletonList(new SimpleGrantedAuthority(user.getRole().getName()))
        );

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(auth);

        // Create user info object
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("email", user.getEmail());
        userInfo.put("fullName", user.getFullName());
        userInfo.put("roles", user.getRole().getName());
        userInfo.put("isAuthenticated", true);

        // Convert user info to JSON and URL encode it
        String userInfoJson = objectMapper.writeValueAsString(userInfo);
        String encodedUserInfo = URLEncoder.encode(userInfoJson, StandardCharsets.UTF_8.toString());

        // Set authentication in security context
        SecurityContextHolder.getContext().setAuthentication(auth);

        // Construct the redirect URL with token and user info as query parameters
        String redirectUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/dashboard")
                .queryParam("token", token)
                .queryParam("user", encodedUserInfo)
                .build().toUriString();

        // Redirect to the frontend application
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private String getEmailFromOAuth2User(OAuth2User oAuth2User) {
        // For GitHub, email might be null in the initial OAuth2User
        if (oAuth2User.getAttribute("email") != null) {
            return oAuth2User.getAttribute("email");
        }
        
        // For GitHub, we might need to use login as a fallback
        if (oAuth2User.getAttribute("login") != null) {
            return oAuth2User.getAttribute("login") + "@github.com";
        }
        
        throw new RuntimeException("Email not found from OAuth2 provider");
    }

    private String getNameFromOAuth2User(OAuth2User oAuth2User) {
        // Try to get name from different possible attributes
        if (oAuth2User.getAttribute("name") != null) {
            return oAuth2User.getAttribute("name");
        }
        if (oAuth2User.getAttribute("login") != null) {
            return oAuth2User.getAttribute("login");
        }
        if (oAuth2User.getAttribute("email") != null) {
            return oAuth2User.getAttribute("email");
        }
        return "Unknown User";
    }

    private User createNewUser(String email, String name) {
        Role defaultRole = roleRepository.findByName("ROLE_EMPLOYEE")
                .orElseThrow(() -> new RuntimeException("Default role not found"));

        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFullName(name);
        newUser.setRole(defaultRole);
        // Set a secure random password for OAuth2 users
        String randomPassword = UUID.randomUUID().toString();
        newUser.setPassword(passwordEncoder.encode(randomPassword));
        return userRepository.save(newUser);
    }
}