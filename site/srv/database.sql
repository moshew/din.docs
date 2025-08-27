-- Database setup for Din.Docs registration system
-- Database: docs

-- Create users_keys table for storing registration data
CREATE TABLE IF NOT EXISTS `users_keys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `key` varchar(8) NOT NULL,
  `status` enum('created','used') DEFAULT 'created',
  `want_updates` tinyint(1) DEFAULT 0,
  `download_count` int(11) DEFAULT 0,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `downloaded_at` timestamp NULL DEFAULT NULL,
  `last_download` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `key` (`key`),
  KEY `status` (`status`),
  KEY `created` (`created`),
  KEY `want_updates` (`want_updates`),
  KEY `email_status` (`email`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create download_logs table for tracking downloads
CREATE TABLE IF NOT EXISTS `download_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_key` varchar(8) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `downloaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `user_key` (`user_key`),
  KEY `downloaded_at` (`downloaded_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users_keys` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create email_queue table for managing email sending (optional)
CREATE TABLE IF NOT EXISTS `email_queue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `to_email` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `message` text NOT NULL,
  `status` enum('pending','sent','failed') DEFAULT 'pending',
  `attempts` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` timestamp NULL DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- All indexes are now included in the CREATE TABLE statements above

-- Add missing columns to existing tables (for upgrading existing installations)
-- Check if want_updates column exists and add it if missing
SET @exist = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users_keys' AND COLUMN_NAME = 'want_updates');
SET @sqlstmt = IF(@exist = 0, 'ALTER TABLE `users_keys` ADD COLUMN `want_updates` tinyint(1) DEFAULT 0 AFTER `status`', 'SELECT "Column want_updates already exists" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for want_updates if column was just added
SET @exist = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users_keys' AND INDEX_NAME = 'want_updates');
SET @sqlstmt = IF(@exist = 0, 'ALTER TABLE `users_keys` ADD INDEX `want_updates` (`want_updates`)', 'SELECT "Index want_updates already exists" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add email_status index if it doesn't exist
SET @exist = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users_keys' AND INDEX_NAME = 'email_status');
SET @sqlstmt = IF(@exist = 0, 'ALTER TABLE `users_keys` ADD INDEX `email_status` (`email`, `status`)', 'SELECT "Index email_status already exists" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
