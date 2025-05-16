package com.hr_management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.hr_management.Entity")
@EnableJpaRepositories(basePackages = "com.hr_management.Repository")
public class HrManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(HrManagementApplication.class, args);
    }
}