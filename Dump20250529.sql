-- MySQL dump 10.13  Distrib 8.0.20, for Win64 (x86_64)
--
-- Host: localhost    Database: hr_system
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Defence ','This department focuses on national security, defense strategies, and military technology-related education or research.'),(2,'Software','This department focuses on software development, testing, deployment, and maintenance of digital solutions, supporting core IT infrastructure and innovation.'),(3,'Standardization','This department ensures compliance with national and international standards, promotes best practices, and develops protocols to maintain quality and consistency across operations.'),(4,'GIS (Geographic Information Systems)','This department specializes in spatial data analysis, mapping technologies, and the integration of geographic data to support planning and decision-making.'),(5,'Setcom (Satellite and Communication)','This department focuses on satellite-based communication systems, network infrastructure, and secure data transmission technologies for mission-critical applications.'),(6,'Admin (Administration)','This department manages organizational operations, resources, and personnel functions to ensure efficient workflow and policy implementation across all units.');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_applications`
--

LOCK TABLES `leave_applications` WRITE;
/*!40000 ALTER TABLE `leave_applications` DISABLE KEYS */;
INSERT INTO `leave_applications` VALUES (1,7,'HALF_DAY','2025-05-13','2025-05-13','feeling sick','APPROVED','2025-05-12',12,_binary '\0',NULL),(2,7,'EARNED','2025-05-14','2025-05-17','personal reasons','APPROVED','2025-05-12',20,_binary '\0',NULL),(3,8,'PATERNITY','2025-05-22','2025-06-05','sfght','REJECTED','2025-05-12',15,_binary '\0',9),(4,10,'PATERNITY','2025-05-15','2025-05-29','going to be father','APPROVED','2025-05-13',15,_binary '\0',NULL),(5,11,'ML','2025-05-15','2025-11-10','going to be mother','APPROVED','2025-05-13',-2,_binary '\0',NULL),(6,10,'HALF_DAY','2025-05-13','2025-05-13','feeling sick','APPROVED','2025-05-13',12,_binary '\0',NULL),(7,10,'PATERNITY','2025-05-21','2025-06-04','gugu','REJECTED','2025-05-13',0,_binary '\0',NULL),(8,10,'HALF_DAY','2025-05-12','2025-05-12','qsdd','APPROVED','2025-05-13',11,_binary '\0',NULL),(9,10,'PATERNITY','2025-05-15','2025-05-29','dfgh','REJECTED','2025-05-13',15,_binary '\0',NULL),(10,10,'EARNED','2025-05-13','2025-05-15','hvftu','APPROVED','2025-05-13',17,_binary '\0',NULL),(11,12,'EARNED','2025-05-15','2025-05-17','ghj','APPROVED','2025-05-14',17,_binary '\0',NULL),(12,12,'PATERNITY','2025-05-22','2025-06-05','fghj','APPROVED','2025-05-14',0,_binary '\0',NULL),(13,12,'EARNED','2025-05-14','2025-05-30','fvgbhnjm','APPROVED','2025-05-14',0,_binary '\0',NULL),(14,12,'CASUAL','2025-05-14','2025-05-25','aSQDFG','APPROVED','2025-05-14',-0.5,_binary '\0',NULL),(15,12,'HALF_DAY','2025-05-15','2025-05-15','asdf','APPROVED','2025-05-14',0,_binary '\0',NULL),(16,12,'CASUAL','2025-05-14','2025-05-22','hjkl','APPROVED','2025-05-14',-9.5,_binary '\0',NULL),(17,11,'HALF_DAY','2025-05-15','2025-05-15','vgbhn','REJECTED','2025-05-14',12,_binary '\0',11),(18,26,'HALF_DAY','2025-05-15','2025-05-15','not feeling well','APPROVED','2025-05-15',0,_binary '\0',25),(19,25,'HALF_DAY','2025-05-14','2025-05-14','sdfg','REJECTED','2025-05-15',12,_binary '\0',25),(20,27,'CL','2025-05-17','2025-05-22','sick','REJECTED','2025-05-16',12,_binary '\0',11),(21,27,'HALF_DAY','2025-05-17','2025-05-17','sick','REJECTED','2025-05-16',12,_binary '\0',11),(22,27,'PL','2025-05-20','2025-06-03','asdf','APPROVED','2025-05-17',0,_binary '\0',11),(23,10,'PL','2025-05-20','2025-05-24','qwerty','APPROVED','2025-05-17',0,_binary '\0',11),(24,28,'PL','2025-05-20','2025-05-24','asdfg','APPROVED','2025-05-17',0,_binary '\0',11),(25,29,'PL','2025-05-20','2025-05-24','qqww','APPROVED','2025-05-17',0,_binary '\0',11),(26,30,'PL','2025-05-20','2025-05-24','asdf','APPROVED','2025-05-17',0,_binary '\0',11),(27,31,'ML','2025-05-20','2025-06-20','asdfg\n','APPROVED','2025-05-17',0,_binary '\0',11),(28,32,'PL','2025-05-20','2025-05-22','asdf','APPROVED','2025-05-19',0,_binary '\0',11),(29,32,'CL','2025-05-19','2025-05-20','ass','APPROVED','2025-05-19',10,_binary '\0',11),(30,33,'HALF_DAY_CL','2025-05-20','2025-05-20','sick','APPROVED','2025-05-20',11.5,_binary '\0',11),(31,33,'PL','2025-05-21','2025-05-25','pl\n','APPROVED','2025-05-20',10,_binary '\0',11),(32,33,'HALF_DAY_CL','2025-05-20','2025-05-20','asdf','APPROVED','2025-05-20',11,_binary '\0',11),(33,33,'HALF_DAY_CL','2025-05-20','2025-05-20','asdf','REJECTED','2025-05-20',11,_binary '\0',11),(34,33,'HALF_DAY_CL','2025-05-20','2025-05-20','asdf','APPROVED','2025-05-20',10.5,_binary '\0',11),(35,33,'HALF_DAY_CL','2025-05-20','2025-05-20','cvb','REJECTED','2025-05-20',10.5,_binary '\0',11),(36,33,'HALF_DAY_CL','2025-05-21','2025-05-21','sdf','APPROVED','2025-05-20',10,_binary '\0',11),(37,33,'CL','2025-05-22','2025-05-24','sdf','APPROVED','2025-05-20',7,_binary '\0',11),(38,33,'EL','2025-05-23','2025-05-25','asdf','APPROVED','2025-05-20',17,_binary '\0',11),(39,33,'EL','2025-05-26','2025-05-31','asd','APPROVED','2025-05-20',11,_binary '\0',11),(40,33,'EL','2025-06-04','2025-06-09','asdfg','APPROVED','2025-05-20',5,_binary '\0',11),(41,33,'HALF_DAY_CL','2025-06-24','2025-06-24','adwe','APPROVED','2025-05-21',6.5,_binary '\0',11),(42,34,'HALF_DAY_CL','2025-05-26','2025-05-26','sdf','APPROVED','2025-05-26',11.5,_binary '\0',11),(43,34,'EL','2025-05-27','2025-05-29','fsdf','APPROVED','2025-05-26',17,_binary '\0',11),(44,34,'CL','2025-05-20','2025-05-23','qwedr','REJECTED','2025-05-26',11.5,_binary '\0',11),(45,34,'PL','2025-05-30','2025-06-03','asdfghj','APPROVED','2025-05-26',10,_binary '\0',11),(46,34,'PL','2025-06-24','2025-06-28','asdf','REJECTED','2025-05-26',10,_binary '\0',11),(47,35,'LWP','2025-05-26','2025-05-30','asd','APPROVED','2025-05-26',295,_binary '\0',11),(48,35,'HALF_DAY_LWP','2025-05-31','2025-05-31','asd','REJECTED','2025-05-26',295,_binary '\0',11),(49,35,'HALF_DAY_LWP','2025-05-31','2025-05-31','asd','APPROVED','2025-05-26',294.5,_binary '\0',11),(50,36,'EL','2025-05-30','2025-06-03','dfg','APPROVED','2025-05-26',15,_binary '\0',11),(51,36,'CL','2025-06-13','2025-06-16','sdfg','APPROVED','2025-05-26',10,_binary '\0',11),(52,36,'PL','2025-06-27','2025-07-11','sdfg','APPROVED','2025-05-26',0,_binary '\0',11),(53,36,'HALF_DAY_CL','2025-06-05','2025-06-05','sdf','APPROVED','2025-05-26',9.5,_binary '\0',11),(54,36,'LWP','2025-05-27','2025-05-29','sd','APPROVED','2025-05-26',297,_binary '\0',11),(55,36,'LWP','2025-06-17','2025-06-20','ADF','APPROVED','2025-05-26',293,_binary '\0',11),(56,37,'CL','2025-05-27','2025-06-02','sick','APPROVED','2025-05-27',6,_binary '\0',11),(57,37,'HALF_DAY_CL','2025-06-03','2025-06-03','as','APPROVED','2025-05-27',5.5,_binary '',11),(58,37,'EL','2025-06-04','2025-06-10','asdf','APPROVED','2025-05-27',13,_binary '\0',11),(59,37,'HALF_DAY_EL','2025-06-11','2025-06-11','sdfg\n','APPROVED','2025-05-27',12.5,_binary '',11),(60,37,'PL','2025-06-20','2025-07-04','asdfg','APPROVED','2025-05-27',0,_binary '\0',11),(61,37,'LWP','2025-06-12','2025-06-16','asdfg','APPROVED','2025-05-27',295,_binary '\0',11),(62,37,'HALF_DAY_LWP','2025-06-17','2025-06-17','asdf','APPROVED','2025-05-27',294.5,_binary '',11),(63,35,'LWP','2025-06-13','2025-06-16','dfghj','APPROVED','2025-05-28',290,_binary '\0',11),(64,35,'LWP','2025-06-27','2025-06-30','jmk,','APPROVED','2025-05-28',286,_binary '\0',11),(65,35,'HALF_DAY_LWP','2025-06-05','2025-06-05','sdf','APPROVED','2025-05-28',289.5,_binary '',11),(66,38,'HALF_DAY_CL','2025-05-28','2025-05-28','sdf','APPROVED','2025-05-28',11.5,_binary '',11),(67,38,'HALF_DAY_EL','2025-05-29','2025-05-29','sdf','APPROVED','2025-05-28',19.5,_binary '',11),(68,38,'HALF_DAY_LWP','2025-05-30','2025-05-30','sdf','APPROVED','2025-05-28',299.5,_binary '',11),(69,38,'CL','2025-05-31','2025-06-02','sdf','APPROVED','2025-05-28',9.5,_binary '\0',11),(70,38,'EL','2025-06-03','2025-06-09','sdfg','APPROVED','2025-05-28',12.5,_binary '\0',11),(71,38,'LWP','2025-06-10','2025-06-16','sdfg','APPROVED','2025-05-28',294.5,_binary '\0',11),(72,38,'PL','2025-06-17','2025-07-01','ASDF','APPROVED','2025-05-28',0,_binary '\0',11),(73,39,'HALF_DAY_CL','2025-05-28','2025-05-28','xdcf','APPROVED','2025-05-28',11.5,_binary '',25),(74,39,'HALF_DAY_EL','2025-05-29','2025-05-29','asdf','APPROVED','2025-05-28',19.5,_binary '',25),(75,39,'HALF_DAY_LWP','2025-05-30','2025-05-30','sd','APPROVED','2025-05-28',299.5,_binary '',25),(76,39,'EL','2025-05-31','2025-06-04','wer','APPROVED','2025-05-28',14.5,_binary '\0',25),(77,39,'EL','2025-06-05','2025-06-11','wer','REJECTED','2025-05-28',20,_binary '\0',25),(78,39,'CL','2025-06-27','2025-06-30','ert','APPROVED','2025-05-28',9.5,_binary '\0',25),(79,39,'PL','2025-07-01','2025-07-15','wer','APPROVED','2025-05-28',0,_binary '\0',25),(80,40,'CL','2025-05-28','2025-06-02','sdf','APPROVED','2025-05-28',7,_binary '\0',25),(81,40,'EL','2025-06-03','2025-06-09','sd','APPROVED','2025-05-28',13,_binary '\0',25),(82,40,'HALF_DAY_CL','2025-06-10','2025-06-10','sdf','APPROVED','2025-05-28',6.5,_binary '',25),(83,40,'HALF_DAY_EL','2025-06-11','2025-06-11','sd','APPROVED','2025-05-28',12.5,_binary '',25),(84,40,'LWP','2025-06-12','2025-06-16','sd','APPROVED','2025-05-28',297,_binary '\0',25),(85,40,'HALF_DAY_LWP','2025-06-17','2025-06-17','sdf','APPROVED','2025-05-28',296.5,_binary '',25),(86,40,'ML','2025-06-18','2025-12-16','sdfg','APPROVED','2025-05-28',0,_binary '\0',25),(87,41,'CL','2025-05-28','2025-06-02','sdf','APPROVED','2025-05-28',7,_binary '\0',25),(88,41,'EL','2025-06-03','2025-06-10','er','APPROVED','2025-05-28',12,_binary '\0',25),(89,41,'LWP','2025-06-17','2025-06-24','df','APPROVED','2025-05-28',293,_binary '\0',25),(90,41,'HALF_DAY_LWP','2025-06-12','2025-06-12','df','APPROVED','2025-05-28',292.5,_binary '',25),(91,41,'HALF_DAY_CL','2025-06-11','2025-06-11','dfg','APPROVED','2025-05-28',6.5,_binary '',25),(92,41,'HALF_DAY_EL','2025-06-16','2025-06-16','sdf','APPROVED','2025-05-28',11.5,_binary '',25),(93,41,'CL','2025-07-11','2025-07-14','sdfg','APPROVED','2025-05-28',4.5,_binary '\0',25),(94,26,'CL','2025-06-13','2025-06-16','sdfg','APPROVED','2025-05-28',10,_binary '\0',25),(95,26,'LWP','2025-06-27','2025-06-30','sdf','APPROVED','2025-05-28',298,_binary '\0',25);
/*!40000 ALTER TABLE `leave_applications` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` VALUES (1,'2025-05-11 01:01:54.314389','810e171f-1e73-4fee-8399-b6941fb6af79',5),(3,'2025-05-15 15:55:43.429036','de6c95eb-4404-4c4e-b357-253ce06ee217',25);
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'HR','Responsible for managing department tasks and overseeing team operations.'),(2,'Director','Responsible for overseeing department functions and strategic decisions.'),(3,'Employee','Handles day-to-day tasks and operations assigned by supervisors or department heads.\n\n'),(4,'hod','Leads a specific department, manages faculty/staff, and ensures departmental goals are met.');
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
  `casual_leave_used` double DEFAULT '0',
  `casual_leave_remaining` double DEFAULT '12',
  `earned_leave_used` double DEFAULT '0',
  `earned_leave_remaining` double DEFAULT '20',
  `maternity_leave_used` double DEFAULT '0',
  `maternity_leave_remaining` double DEFAULT '180',
  `paternity_leave_used` double DEFAULT '0',
  `paternity_leave_remaining` double DEFAULT '15',
  `department_id` bigint DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `leave_without_payment` double NOT NULL,
  `half_day_lwp` double NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_user_department` (`department_id`),
  CONSTRAINT `fk_user_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'GIS','john@bisag-n.gov.in','John Doe','$2a$10$oCyEL5qY8fr.meTJhXlPfeeNURnNIcoZcTx5K8kVjkIPBQfL8kWR.','EMPLOYEE','Johndoe',NULL,0,12,0,20,0,180,0,15,NULL,'ACTIVE',0,0),(2,'Software Development','anaagr2020@gmail.com','Anant Agarwal','$2a$10$JKJh4LLGX3FfZPR2/g0eue4D7AR8.TbvtxTlPSM99Og3ypaxKHzCK','DIRECTOR','anant',NULL,0,12,0,20,0,180,0,15,NULL,'ACTIVE',0,0),(3,'GIS','abhi.kumar@gmail.com','Abhishek Kumar','$2a$10$TQDiMiiJtNA3GHlZJ4raVe9Runott1XfUE4YByQr4ZL9q4VafdhOO','EMPLOYEE','abhi','Male',0,12,0,20,0,180,0,15,NULL,'ACTIVE',0,0),(4,'HR','keshav@gmail.com','Keshav Shrimali','$2a$10$9ykC6S9X.ndUa2DaFIps0eMqHRgtI4MkmmvvYFSxAxZyThvjpW.ym','HR','keshav','Female',0,12,0,20,0,180,0,15,NULL,'ACTIVE',0,0),(5,'HR','reblgamer40@gmail.com','Rebl','$2a$10$ChxUNY8iESXyoSluBRXQY.6K7zXRdXVe62RsHjUwZd3JbgYHhN1Sa','HR','rebl','Male',0,12,0,20,0,180,0,15,NULL,'ACTIVE',0,0),(6,'GIS','abhi@gmail.com','Abhishek kumar','$2a$10$ephXV41cx0by0dEO/drAeuVfq7HlnwHlRhRgOOY6aNvgjLnGDw8nm','EMPLOYEE','abhii','Male',0,12,0,20,0,180,0,15,NULL,'ACTIVE',0,0),(7,'SDE','keshav12@gmail.com','Keshav ','$2a$10$5tFTJ1u8qgR9yWeHp6raw.IE8VqNYI5d5GT7GGUIQGqUfm33UsXaK','employee','ksh','Male',0,12,0,20,0,180,0,15,NULL,'ACTIVE',0,0),(8,'SDE','abhay@gmail.com','Abhay','$2a$10$lL35d3AXNEqbkdBnvpM99u2Lv3o4iSmhxGUf4aPuosNWHQ1nFRrpi','hod','abhay','Male',0,12,0,20,0,180,0,15,NULL,'ACTIVE',0,0),(9,'Admin','yash@gmail.com','Yash Gupta','$2a$10$tUswiMzOyAcsDt.L3aE2Hup95LdbKP/B0M5ff/YfBBhNSOaEgweti','director','yash','Male',0,12,0,20,0,180,0,15,NULL,'ACTIVE',0,0),(10,'Software','anantagarwalkh17@gmail.com','Anant Agarwal','$2a$10$JisuRvJZOFpgrvifPNAHv.IePBugW5F8Nj409fhDO5JWAolhFP8.6','employee','antt','Male',0,12,3,17,0,180,15,0,NULL,'ACTIVE',0,0),(11,'Software','ishu@gmail.com','Ishu ','$2a$10$3VaW0qbCjkdTZ0M6v6A.h.nQYZxqlhD5GmCOvi6Cb/AgWylHoTW8K','hod','ishu','Female',0,12,0,20,182,-2,0,15,NULL,'ACTIVE',0,0),(12,'Software','laksh@gmail.com','lakshay parashar','$2a$10$ifCWhHaEgxOOHh3bD2h2Eu7x0M9CLv5QE0xGJb60NooEGPnKCf44G','employee','laksh','Male',21.5,-9.5,20,0,0,182,15,0,NULL,'ACTIVE',0,0),(13,'Standardization','meena.std@domain.com','Meena Kumari','$2a$10$uJ3RhG64pEnAPkFeV1MLFOg1UgLkgVNDrRMWMmgcOEN7xM5iMX1gK','employee','meenastd','Female',4,17,6,14,0,182,0,15,3,'ACTIVE',0,0),(14,'Standardization','rohit.std@domain.com','Rohit Saini','$2a$10$uJ3RhG64pEnAPkFeV1MLFOg1UgLkgVNDrRMWMmgcOEN7xM5iMX1gK','employee','rohitstd','Male',1,20,2,18,0,182,5,10,3,'ACTIVE',0,0),(15,'GIS (Geographic Information Systems)','sara.gis@domain.com','Sara Khan','$2a$10$uJ3RhG64pEnAPkFeV1MLFOg1UgLkgVNDrRMWMmgcOEN7xM5iMX1gK','employee','saragis','Female',2,19,4,16,0,182,0,15,4,'ACTIVE',0,0),(16,'GIS (Geographic Information Systems)','anil.gis@domain.com','Anil Sharma','$2a$10$uJ3RhG64pEnAPkFeV1MLFOg1UgLkgVNDrRMWMmgcOEN7xM5iMX1gK','employee','anilgis','Male',3,18,2,18,0,182,6,9,4,'ACTIVE',0,0),(17,'Setcom (Satellite and Communication)','priya.set@domain.com','Priya Raj','$2a$10$uJ3RhG64pEnAPkFeV1MLFOg1UgLkgVNDrRMWMmgcOEN7xM5iMX1gK','employee','priyaset','Female',5,16,3,17,0,182,0,15,5,'ACTIVE',0,0),(18,'Setcom (Satellite and Communication)','rahul.set@domain.com','Rahul Yadav','$2a$10$uJ3RhG64pEnAPkFeV1MLFOg1UgLkgVNDrRMWMmgcOEN7xM5iMX1gK','employee','rahulset','Male',0,21,1,19,0,182,3,12,5,'ACTIVE',0,0),(19,'Admin (Administration)','neha.admin@domain.com','Neha Verma','$2a$10$uJ3RhG64pEnAPkFeV1MLFOg1UgLkgVNDrRMWMmgcOEN7xM5iMX1gK','employee','nehaadmin','Female',6,15,2,18,0,182,0,15,6,'ACTIVE',0,0),(20,'Admin (Administration)','deepak.admin@domain.com','Deepak Bansal','$2a$10$uJ3RhG64pEnAPkFeV1MLFOg1UgLkgVNDrRMWMmgcOEN7xM5iMX1gK','employee','deepakadmin','Male',2,19,4,16,0,182,4,11,6,'ACTIVE',0,0),(21,'Defence','aarya.def@domain.com','Aarya Singh','$2a$10$rkRmHZ1vB/OxU64TzVb3M.hphkzwhd8iuyZ5D3Etb7gh4IQks8y6y','employee','aaryad','Female',3,18,5,15,0,182,0,15,1,'ACTIVE',0,0),(22,'Defence','vishal.def@domain.com','Vishal Meena','$2a$10$rkRmHZ1vB/OxU64TzVb3M.hphkzwhd8iuyZ5D3Etb7gh4IQks8y6y','employee','vishald','Male',2,19,3,17,0,182,10,5,1,'ACTIVE',0,0),(23,'Defence','kavita.def@domain.com','Kavita Joshi','$2a$10$uJ3RhG64pEnAPkFeV1MLFOg1UgLkgVNDrRMWMmgcOEN7xM5iMX1gK','employee','kavitad','Female',2,19,4,16,0,182,0,15,1,'ACTIVE',0,0),(24,'Defence','amit.def@domain.com','Amit Rana','$2a$10$uJ3RhG64pEnAPkFeV1MLFOg1UgLkgVNDrRMWMmgcOEN7xM5iMX1gK','employee','amitd','Male',1,20,2,18,0,182,6,9,1,'ACTIVE',0,0),(25,'Setcom (Satellite and Communication)','abhishekumar222.akd@gmail.com','Abhishek kumar','$2a$10$DzkcOuOwRv8E5DDGkA4mHeVJb9NAhMFRpydkEJPIBApuRx8RfEmhe','hod','shanu','Female',0,12,0,20,0,182,0,15,NULL,'ACTIVE',0,0),(26,'Setcom (Satellite and Communication)','janu@gmail.com','janu','$2a$10$RiSpLJopv4DDWK4.7.m8puthnYK5NZS5icpFVEiLQGsKHGOHmqGay','employee','janu','Male',2,10,0,20,0,182,0,15,NULL,'ACTIVE',2,0),(27,'Software','mohit@gmail.com','Mohit ','$2a$10$waI1mipqUYvuL91UDctHouub0YCKBbO23lXlml1ZYvCB9WheTMEPa','employee','mohit','Male',0,12,0,20,0,182,15,0,NULL,'ACTIVE',0,0),(28,'Software','kevv@gmail.com','keshavv','$2a$10$BWRSvHd2VM514X5FWzODW.icNrRGVqGJ0x6GYn4QG4n7yFps4nZzG','employee','kevv','Male',0,12,0,20,0,182,15,0,NULL,'ACTIVE',0,0),(29,'Software','ajay@gmail.com','ajay','$2a$10$kzMkXGIcD9at4UiZ26QCCOSVCOJ0zkzC68utSGrFKF53iBvuMNZ72','employee','ajay','Male',0,12,0,20,0,182,15,0,NULL,'ACTIVE',0,0),(30,'Software','ash@gmail.com','ash','$2a$10$XhhURoeFrUEXEMkqRbiUSuioYJ.Pmf4H25Cq32eqWj8xGkKFrDNTi','employee','ash','Male',0,12,0,20,0,182,15,0,NULL,'ACTIVE',0,0),(31,'Software','anni@gmail.com','anni','$2a$10$6OmfqK7fdQ/CvtyxWVCNJ.d12E86bZSxiHqcCW/RP0XFTArOU7bP.','employee','anni1234','Female',0,12,0,20,182,0,0,15,NULL,'ACTIVE',0,0),(32,'Software','anshu@gmail.com','anshu','$2a$10$aAeqAR1z164nQ7kRfP1WZeZm0YbACkpJK9ovKIFJRiXy.7dGhZSEi','employee','anshu','Male',2,10,0,20,0,182,15,0,NULL,'ACTIVE',0,0),(33,'Software','jaan@gmail.com','jaan','$2a$10$CEp7Y1BZn5fRG//x7VmGjuVJ1vtAGQvXoEtmYBwEDXIoU8NjAv5Py','employee','jaan','Male',5.5,6.5,15,5,0,182,5,10,NULL,'ACTIVE',0,0),(34,'Software','himan11@gmail.com','Himanshu','$2a$10$LuQXjLWSBqCtuWgB.og/W.DspfmuWWQq96Rd1Bc96Vpm5UZl2Eg6G','employee','himan','Male',0.5,11.5,3,17,0,182,5,10,NULL,'ACTIVE',0,0),(35,'Software','dev@gmail.com','dev','$2a$10$06NfZ2FeHvesUDjNGuDtT.Kiqyn9J822IRr/sEyymZOjWaczas1f6','employee','dev','Male',0,12,0,20,0,182,0,15,NULL,'ACTIVE',9,1.5),(36,'Software','hih@gmail.com','hiui','$2a$10$Lb0yL0CRXByGTGdLri9FNOBPYc7cMHHcp8pKZPhHQ5DYqDSpqZt16','employee','hih','Male',3,9,5,15,0,182,15,0,NULL,'ACTIVE',7,0),(37,'Software','jiju@gmail.com','jiju','$2a$10$DyEaqsgMBDtLLvIhCGEct.j8vYcL1zYVuHgyuycqV/Eb73BlwWCAW','employee','jiju','Male',6.5,5.5,7.5,12.5,0,182,15,0,NULL,'ACTIVE',5,0.5),(38,'Software','qwer@gmail.com','qwer','$2a$10$amGWUik1S6EdxYdlAdb4mOJgl638lhj0HggmkW/1vDYQx02qYp6mC','employee','qwer','Male',2.5,9.5,7.5,12.5,0,182,15,0,NULL,'ACTIVE',5,0.5),(39,'Setcom (Satellite and Communication)','zxcv@gmail.com','zxcv','$2a$10$92QuGQUKQXee4Fi4GUYIleQOjEUZ/Nr5jeh7mPqqZwwO6/tSkJ6CG','employee','zxcv','Male',2.5,9.5,5.5,14.5,0,182,15,0,NULL,'ACTIVE',0,0.5),(40,'Setcom (Satellite and Communication)','vbnm@gmail.com','vbnmmmm','$2a$10$NwevtS5y/OhTg3CYILH41.9kND8mFNmwCc2jh0eXOb2vMfhF4cNbK','employee','vbnm','Female',5.5,6.5,7.5,12.5,182,0,0,15,NULL,'ACTIVE',3,0.5),(41,'Setcom (Satellite and Communication)','aaaa@gmail.com','aaaa','$2a$10$ACXg3qa2u0y6on3Bhw9N3O1ovjAC74WTy.dnUvlXX8zrIpvxBC00K','employee','aaaa','Male',7.5,4.5,8.5,11.5,0,182,0,15,NULL,'ACTIVE',7,0.5);
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

-- Dump completed on 2025-05-29 10:42:44
