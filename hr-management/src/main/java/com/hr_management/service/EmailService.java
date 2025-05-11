package com.hr_management.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${frontend.url}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("BISAG-N HR System - Password Reset Request");
        message.setText("Dear User,\n\n" +
                "You requested a password reset for your BISAG-N HR Management System account.\n" +
                "Please click the following link to reset your password:\n" +
                frontendUrl + "/reset-password?token=" + token + "\n\n" +
                "This link will expire in 1 hour. If you did not request a password reset, please ignore this email.\n\n" +
                "Best regards,\nBISAG-N Team");
        message.setFrom(fromEmail);

        mailSender.send(message);
    }
}