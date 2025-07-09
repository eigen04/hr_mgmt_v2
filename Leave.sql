-- MySQL dump 10.13  Distrib 8.0.20, for Win64 (x86_64)
--
-- Host: localhost    Database: hr_sys
-- ------------------------------------------------------
-- Server version	8.0.20

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Admin (Administration)','This department manages organizational operations, resources, and personnel functions to ensure efficient workflow and policy implementation across all units.');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holidays`
--

DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holidays` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `type` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_holiday_date` (`date`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
INSERT INTO `holidays` VALUES (1,'Independence Day','2025-08-15','CUSTOM',NULL),(2,'Holiday','2025-06-29','SUNDAY',NULL),(3,'Holiday','2025-06-22','SUNDAY',NULL),(4,'Holiday','2025-06-15','SUNDAY',NULL),(5,'Holiday','2025-06-08','SUNDAY',NULL),(6,'Holiday','2025-06-01','SUNDAY',NULL),(7,'Holiday','2025-06-14','SATURDAY_2_4',NULL),(8,'Holiday','2025-06-28','SATURDAY_2_4',NULL),(9,'Samvatsari','2025-08-27','CUSTOM',NULL),(10,'Janmasthami','2025-08-16','CUSTOM',NULL),(11,'Eid','2025-06-07','CUSTOM',NULL),(12,'Makar Sankranti','2025-01-14','CUSTOM',NULL),(13,'Maha Shivratri','2025-02-26','CUSTOM',NULL),(14,'Holi','2025-03-14','CUSTOM',NULL),(15,'Holi','2025-03-15','CUSTOM',NULL),(16,'Ramjan-Eid','2025-03-31','CUSTOM',NULL),(17,'Mahavir Jyanti','2025-04-10','CUSTOM',NULL),(18,'Dr. Saheb Ambedkar\'s Birthday','2025-04-14','CUSTOM',NULL),(19,'Good friday','2025-04-18','CUSTOM',NULL),(20,'Parshuram Jayanti','2025-04-29','CUSTOM',NULL),(21,'EID','2025-09-05','CUSTOM',NULL),(22,'Gandhi\'s birthday','2025-10-02','CUSTOM',NULL),(23,'Diwali','2025-10-20','CUSTOM',NULL),(24,'Bhai bij','2025-10-23','CUSTOM',NULL),(25,'Vikramsamvant New year Day','2025-10-22','CUSTOM',NULL),(26,'Sardar patel birthday','2025-10-31','CUSTOM',NULL),(27,'Guru Nanak birthday','2025-11-05','CUSTOM',NULL),(28,'Christmas','2025-12-25','CUSTOM',NULL),(29,'Holiday','2025-01-05','SUNDAY',NULL),(30,'Holiday','2025-01-12','SUNDAY',NULL),(31,'Holiday','2025-01-19','SUNDAY',NULL),(32,'Holiday','2025-01-26','SUNDAY',NULL),(33,'Holiday','2025-01-11','SATURDAY_2_4',NULL),(34,'Holiday','2025-01-25','SATURDAY_2_4',NULL),(35,'Holiday','2025-02-02','SUNDAY',NULL),(37,'Holiday','2025-02-09','SUNDAY',NULL),(38,'Holiday','2025-02-16','SUNDAY',NULL),(39,'Holiday','2025-02-23','SUNDAY',NULL),(40,'Holiday','2025-02-08','SATURDAY_2_4',NULL),(41,'Holiday','2025-02-22','SATURDAY_2_4',NULL),(42,'Holiday','2025-12-07','SUNDAY',NULL),(43,'Holiday','2025-12-14','SUNDAY',NULL),(44,'Holiday','2025-12-21','SUNDAY',NULL),(45,'Holiday','2025-12-28','SUNDAY',NULL),(46,'Holiday','2025-12-13','SATURDAY_2_4',NULL),(47,'Holiday','2025-12-27','SATURDAY_2_4',NULL),(48,'Holiday','2025-07-06','SUNDAY',NULL),(49,'Holiday','2025-07-13','SUNDAY',NULL),(50,'Holiday','2025-07-20','SUNDAY',NULL),(51,'Holiday','2025-07-27','SUNDAY',NULL),(52,'Holiday','2025-07-12','SATURDAY_2_4',NULL),(53,'Holiday','2025-07-26','SATURDAY_2_4',NULL),(54,'Holiday','2025-08-03','SUNDAY',NULL),(55,'Holiday','2025-08-10','SUNDAY',NULL),(56,'Holiday','2025-08-17','SUNDAY',NULL),(57,'Holiday','2025-08-24','SUNDAY',NULL),(58,'Holiday','2025-08-31','SUNDAY',NULL),(59,'Holiday','2025-08-09','SATURDAY_2_4',NULL),(60,'Holiday','2025-08-23','SATURDAY_2_4',NULL),(61,'Holiday','2025-03-02','SUNDAY',NULL),(62,'Holiday','2025-03-09','SUNDAY',NULL),(63,'Holiday','2025-03-16','SUNDAY',NULL),(64,'Holiday','2025-03-23','SUNDAY',NULL),(65,'Holiday','2025-03-30','SUNDAY',NULL),(66,'Holiday','2025-03-08','SATURDAY_2_4',NULL),(67,'Holiday','2025-03-22','SATURDAY_2_4',NULL),(68,'Holiday','2025-04-06','SUNDAY',NULL),(69,'Holiday','2025-04-13','SUNDAY',NULL),(70,'Holiday','2025-04-20','SUNDAY',NULL),(71,'Holiday','2025-04-27','SUNDAY',NULL),(72,'Holiday','2025-04-12','SATURDAY_2_4',NULL),(73,'Holiday','2025-04-26','SATURDAY_2_4',NULL),(74,'Holiday','2025-05-04','SUNDAY',NULL),(75,'Holiday','2025-05-11','SUNDAY',NULL),(76,'Holiday','2025-05-18','SUNDAY',NULL),(77,'Holiday','2025-05-25','SUNDAY',NULL),(78,'Holiday','2025-05-10','SATURDAY_2_4',NULL),(79,'Holiday','2025-05-24','SATURDAY_2_4',NULL),(80,'Holiday','2025-11-02','SUNDAY',NULL),(81,'Holiday','2025-11-09','SUNDAY',NULL),(82,'Holiday','2025-11-16','SUNDAY',NULL),(83,'Holiday','2025-11-23','SUNDAY',NULL),(84,'Holiday','2025-11-30','SUNDAY',NULL),(85,'Holiday','2025-11-08','SATURDAY_2_4',NULL),(86,'Holiday','2025-11-22','SATURDAY_2_4',NULL),(87,'Holiday','2025-10-05','SUNDAY',NULL),(88,'Holiday','2025-10-12','SUNDAY',NULL),(89,'Holiday','2025-10-19','SUNDAY',NULL),(90,'Holiday','2025-10-26','SUNDAY',NULL),(91,'Holiday','2025-10-11','SATURDAY_2_4',NULL),(92,'Holiday','2025-10-25','SATURDAY_2_4',NULL),(93,'Holiday','2025-09-07','SUNDAY',NULL),(94,'Holiday','2025-09-14','SUNDAY',NULL),(95,'Holiday','2025-09-21','SUNDAY',NULL),(96,'Holiday','2025-09-28','SUNDAY',NULL),(97,'Holiday','2025-09-13','SATURDAY_2_4',NULL),(98,'Holiday','2025-09-27','SATURDAY_2_4',NULL);
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_applications`
--

DROP TABLE IF EXISTS `leave_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_applications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `leave_type` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `applied_on` date NOT NULL,
  `remaining_leaves` double NOT NULL,
  `is_half_day` bit(1) DEFAULT NULL,
  `approver_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `leave_applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_applications`
--

LOCK TABLES `leave_applications` WRITE;
/*!40000 ALTER TABLE `leave_applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `monthly_cl_accrual`
--

DROP TABLE IF EXISTS `monthly_cl_accrual`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monthly_cl_accrual` (
  `user_id` bigint NOT NULL,
  `accrual` double DEFAULT NULL,
  `month` int NOT NULL,
  PRIMARY KEY (`user_id`,`month`),
  CONSTRAINT `FKpm1fbt35iy512t8xu335kk7em` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `monthly_cl_accrual`
--

LOCK TABLES `monthly_cl_accrual` WRITE;
/*!40000 ALTER TABLE `monthly_cl_accrual` DISABLE KEYS */;
/*!40000 ALTER TABLE `monthly_cl_accrual` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `expiry_date` datetime(6) NOT NULL,
  `token` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK71lqwbwtklmljk3qlsugr1mig` (`token`),
  KEY `FKk3ndxg5xp6v7wd4gjyusp15gq` (`user_id`),
  CONSTRAINT `FKk3ndxg5xp6v7wd4gjyusp15gq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pending_signups`
--

DROP TABLE IF EXISTS `pending_signups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pending_signups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `role` varchar(255) NOT NULL,
  `gender` varchar(255) NOT NULL,
  `reporting_to_id` bigint DEFAULT NULL,
  `employee_id` varchar(255) NOT NULL,
  `join_date` date NOT NULL,
  `status` varchar(255) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `reporting_to_id` (`reporting_to_id`),
  CONSTRAINT `pending_signups_ibfk_1` FOREIGN KEY (`reporting_to_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pending_signups`
--

LOCK TABLES `pending_signups` WRITE;
/*!40000 ALTER TABLE `pending_signups` DISABLE KEYS */;
/*!40000 ALTER TABLE `pending_signups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'HR','Responsible for managing department tasks and overseeing team operations.');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `department` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `casual_leave_used` double NOT NULL DEFAULT '0',
  `casual_leave_remaining` double NOT NULL DEFAULT '0',
  `earned_leave_used` double DEFAULT '0',
  `earned_leave_remaining` double NOT NULL DEFAULT '0',
  `maternity_leave_used` double NOT NULL DEFAULT '0',
  `maternity_leave_remaining` double NOT NULL DEFAULT '182',
  `paternity_leave_used` double NOT NULL DEFAULT '0',
  `paternity_leave_remaining` double NOT NULL DEFAULT '15',
  `department_id` bigint DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'PENDING',
  `leave_without_payment` double NOT NULL,
  `half_day_lwp` double NOT NULL,
  `reporting_to` bigint DEFAULT NULL,
  `join_date` date NOT NULL DEFAULT (curdate()),
  `earned_leave_remaining_first_half` double DEFAULT NULL,
  `earned_leave_remaining_second_half` double DEFAULT NULL,
  `earned_leave_used_first_half` double NOT NULL DEFAULT '0',
  `earned_leave_used_second_half` double NOT NULL DEFAULT '0',
  `last_initialized_year` int DEFAULT NULL,
  `employee_id` varchar(255) NOT NULL,
  `disapprove_reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_id` (`employee_id`),
  KEY `fk_user_department` (`department_id`),
  KEY `fk_reporting_to` (`reporting_to`),
  CONSTRAINT `fk_reporting_to` FOREIGN KEY (`reporting_to`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_user_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-09 21:22:56
