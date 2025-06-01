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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Defence ','This department focuses on national security, defense strategies, and military technology-related education or research.'),(2,'Software','This department focuses on software development, testing, deployment, and maintenance of digital solutions, supporting core IT infrastructure and innovation.'),(3,'Standardization','This department ensures compliance with national and international standards, promotes best practices, and develops protocols to maintain quality and consistency across operations.'),(4,'GIS (Geographic Information Systems)','This department specializes in spatial data analysis, mapping technologies, and the integration of geographic data to support planning and decision-making.'),(5,'Setcom (Satellite and Communication)','This department focuses on satellite-based communication systems, network infrastructure, and secure data transmission technologies for mission-critical applications.'),(6,'Admin (Administration)','This department manages organizational operations, resources, and personnel functions to ensure efficient workflow and policy implementation across all units.'),(7,'HR',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_applications`
--

LOCK TABLES `leave_applications` WRITE;
/*!40000 ALTER TABLE `leave_applications` DISABLE KEYS */;
INSERT INTO `leave_applications` VALUES (96,52,'HALF_DAY_CL','2025-05-31','2025-05-31','sdf','APPROVED','2025-05-31',11.5,_binary '',50),(97,52,'CL','2025-06-05','2025-06-09','sdfg','APPROVED','2025-05-31',7.5,_binary '\0',50),(98,58,'EL','2025-06-02','2025-06-05','asdf','APPROVED','2025-06-01',16,_binary '\0',57),(99,56,'HALF_DAY_CL','2025-06-02','2025-06-02','sddf','PENDING','2025-06-01',12,_binary '',52);
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'HR','Responsible for managing department tasks and overseeing team operations.'),(2,'Director','Responsible for overseeing department functions and strategic decisions.'),(3,'Employee','Handles day-to-day tasks and operations assigned by supervisors or department heads.\n\n'),(5,'PROJECT_MANAGER',NULL),(6,'ASSISTANT_DIRECTOR',NULL),(7,'SUPPORT',NULL);
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
  `reporting_to` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_user_department` (`department_id`),
  KEY `fk_reporting_to` (`reporting_to`),
  CONSTRAINT `fk_reporting_to` FOREIGN KEY (`reporting_to`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_user_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (42,'GIS','director@bisag-n.gov.in','Alice Smith','$2a$10$oCyEL5qY8fr.meTJhXlPfeeNURnNIcoZcTx5K8kVjkIPBQfL8kWR.','DIRECTOR','alicesmith','Female',0,12,0,20,0,180,0,15,1,'ACTIVE',0,0,NULL),(44,'GIS','asstdirector@bisag-n.gov.in','Bob Johnson','$2a$10$oCyEL5qY8fr.meTJhXlPfeeNURnNIcoZcTx5K8kVjkIPBQfL8kWR.','ASSISTANT_DIRECTOR','bobjohnson','Male',0,12,0,20,0,180,0,15,1,'ACTIVE',0,0,42),(45,'GIS','projmanager@bisag-n.gov.in','Charlie Brown','$2a$10$oCyEL5qY8fr.meTJhXlPfeeNURnNIcoZcTx5K8kVjkIPBQfL8kWR.','PROJECT_MANAGER','charliebrown','Male',0,12,0,20,0,180,0,15,1,'ACTIVE',0,0,44),(47,'GIS','employee@bisag-n.gov.in','David Wilson','$2a$10$oCyEL5qY8fr.meTJhXlPfeeNURnNIcoZcTx5K8kVjkIPBQfL8kWR.','EMPLOYEE','davidwilson','Male',0,12,0,20,0,180,0,15,1,'ACTIVE',0,0,45),(48,'Admin (Administration)','anant@gmail.com','Anant Agarwal','$2a$10$CgOWH4c5O38t/OV1FS0ra.EsvTPiaPsqi5zIt0SK0K8/zD7dywTRC','director','anant','Male',0,12,0,20,0,182,0,15,6,'ACTIVE',0,0,NULL),(49,NULL,'aaf@gmail.com','Aafreen Moyal','$2a$10$VNfxT2P5aVqlhF/9RscMr.BijsV7lXnEJl3PQt3yOiLgkd7zitzVe','director','aaf','Female',0,12,0,20,0,182,0,15,NULL,'ACTIVE',0,0,NULL),(50,'Software','harsh@gmail.com','Harshit Jain','$2a$10$HxRv0MTZ7bk10Wf7NEr0C.NZ236bvVb9DdGAQaqacmNQn/SoGfHHe','ASSISTANT_DIRECTOR','harsh','Male',0,12,0,20,0,182,0,15,2,'ACTIVE',0,0,48),(51,'Software','himan@gmail.com','Himanshu Kumar','$2a$10$8WdcsqIpc.qBcfJNudWXjeFAWhyhrtRAJ8xNG2nLlXPsfToA2QK6C','ASSISTANT_DIRECTOR','himan','Male',0,12,0,20,0,182,0,15,2,'ACTIVE',0,0,48),(52,'Software','saksh@gmail.com','Saksham ','$2a$10$jGmJ9rH52jG9sqx7hwjI/OjABLZbNWL8jeaIqoxnjYdl1RzZPH0aK','PROJECT_MANAGER','saksh','Male',4.5,7.5,0,20,0,182,0,15,2,'ACTIVE',0,0,50),(53,'Software','asd@gmail.com','asd','$2a$10$4PMLqXYud3Vt2JsmqLUHQuRIdSzAzI0UK7lJXpSetCN82yTSMKubi','EMPLOYEE','asd','Male',0,12,0,20,0,182,0,15,2,'ACTIVE',0,0,52),(54,'Administration','sdf@gmail.com','aad','$2a$10$P.lSXJSOPCZDnKMANzjBguJr2fbH7gX76IrpkooU/2jlWNPkna9HG','HR','asda','Male',0,12,0,20,0,182,0,15,NULL,'ACTIVE',0,0,NULL),(55,'Administration','rebl@gmail.com','Rebl','$2a$10$efE.t6J6LeYUpi9nXz14te8iV9liRc8uTlY9GiuNwYJwxnfoDgIQG','HR','rebl','Male',0,12,0,20,0,182,0,15,NULL,'ACTIVE',0,0,NULL),(56,'Software','jasw@gmail.com','Jaswant ','$2a$10$OGbsUYpB6K3qBpjLX5jrDejy4aocOsfhBLLKNMs9iwsYbm2wSovZK','EMPLOYEE','jasw','Male',0,12,0,20,0,0,0,15,2,'ACTIVE',0,0,52),(57,'Defence ','laksh@gmail.com','Lakshay Parashar','$2a$10$GH2P4hF0uVgoe4f2MyehheBzWdHmzgEgaHQ6/zVWo.ZpLSI3S6dVi','ASSISTANT_DIRECTOR','laksh','Male',0,12,0,20,0,0,0,15,1,'ACTIVE',0,0,49),(58,'Defence ','abhay@gmail.com','Abhay','$2a$10$3LDYOGaIuhJhBehQMSWiOeOjR3ZvUfSuf.dNW0amSRiJrmB/qFs2K','PROJECT_MANAGER','abhay','Male',0,12,4,16,0,0,0,15,1,'ACTIVE',0,0,57);
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

-- Dump completed on 2025-06-01 22:22:37
