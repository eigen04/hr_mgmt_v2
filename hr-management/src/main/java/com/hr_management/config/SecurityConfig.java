package com.hr_management.config;

import com.hr_management.Util.JwtUtil;
import com.hr_management.filter.JwtAuthenticationFilter;
import com.hr_management.Repository.UserRepository;
import com.hr_management.Entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
            return org.springframework.security.core.userdetails.User
                    .withUsername(user.getUsername())
                    .password(user.getPassword())
                    .authorities("ROLE_" + user.getRole().toUpperCase())
                    .build();
        };
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtUtil, userDetailsService());
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        System.out.println("CORS Allowed Origins: " + configuration.getAllowedOrigins()); // Debug log

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/departments").permitAll()  // Public for signup
                .requestMatchers(HttpMethod.GET, "/api/roles").permitAll()  // Public for signup

                // Director-only endpoints
                .requestMatchers(HttpMethod.POST, "/api/departments").hasRole("DIRECTOR")
                .requestMatchers(HttpMethod.POST, "/api/roles").hasRole("DIRECTOR")
                .requestMatchers(HttpMethod.GET, "/api/departments/stats").hasRole("DIRECTOR")
                .requestMatchers(HttpMethod.GET, "/api/users/hods").hasRole("DIRECTOR")
                .requestMatchers(HttpMethod.PATCH, "/api/users/*/status").hasRole("DIRECTOR")

                // HR and Director endpoints
                .requestMatchers(HttpMethod.GET, "/api/hr/departments").hasAnyRole("HR", "DIRECTOR")
                .requestMatchers(HttpMethod.GET, "/api/hr/dashboard-metrics").hasAnyRole("HR", "DIRECTOR")

                // Assistant Director, HR, and Director can access department employees (department restriction handled in controller)
                .requestMatchers(HttpMethod.GET, "/api/hr/departments/*/employees")
                    .hasAnyRole("HR", "DIRECTOR", "ASSISTANT_DIRECTOR", "PROJECT_MANAGER")

                // Assistant Director, Director, and Project Manager can access department metrics (department restriction handled in controller)
                .requestMatchers(HttpMethod.GET, "/api/hr/department-metrics/*")
                    .hasAnyRole("DIRECTOR", "ASSISTANT_DIRECTOR", "PROJECT_MANAGER")

                // Leave endpoints for multiple roles
                .requestMatchers(HttpMethod.POST, "/api/leaves").hasAnyRole("EMPLOYEE", "PROJECT_MANAGER", "ASSISTANT_DIRECTOR", "DIRECTOR")
                .requestMatchers(HttpMethod.GET, "/api/leaves").hasAnyRole("EMPLOYEE", "PROJECT_MANAGER", "ASSISTANT_DIRECTOR", "DIRECTOR")
                .requestMatchers(HttpMethod.GET, "/api/leaves/balance").hasAnyRole("EMPLOYEE", "PROJECT_MANAGER", "ASSISTANT_DIRECTOR", "DIRECTOR")
                .requestMatchers(HttpMethod.GET, "/api/leaves/pending").hasAnyRole("PROJECT_MANAGER", "ASSISTANT_DIRECTOR", "DIRECTOR")
                .requestMatchers(HttpMethod.GET, "/api/leaves/stats").hasAnyRole("PROJECT_MANAGER", "ASSISTANT_DIRECTOR", "DIRECTOR")
                .requestMatchers(HttpMethod.POST, "/api/leaves/*/approve").hasAnyRole("PROJECT_MANAGER", "ASSISTANT_DIRECTOR", "DIRECTOR")
                .requestMatchers(HttpMethod.POST, "/api/leaves/*/reject").hasAnyRole("PROJECT_MANAGER", "ASSISTANT_DIRECTOR", "DIRECTOR")

                // Employee-only endpoints
                .requestMatchers("/api/employee/**").hasRole("EMPLOYEE")

                // Authenticated endpoints (e.g., /api/users/me, /api/departments/{id})
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}