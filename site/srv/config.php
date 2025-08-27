<?php
// Include logging system
require_once 'logger.php';

// Database configuration
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'docs');
define('DB_USER', 'admin');
define('DB_PASS', 'Aa123456');

// Email configuration
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 465); // Changed to 465 for SSL
define('SMTP_USER', 'atty.sivanwaisman@gmail.com');
define('SMTP_PASS', 'atyeimfhkqhxgryi');
define('FROM_EMAIL', 'sivan@din-online.co.il');
define('FROM_NAME', 'מרכז דין.אונליין');

// Site configuration
define('SITE_URL', 'https://docs.din-online.co.il');
define('DOWNLOAD_FILE_URL', SITE_URL . '/download_file');

// Database connection
function getDBConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        DinDocsLogger::error("Database connection failed", ['error' => $e->getMessage()]);
        return null;
    }
}

// Generate random key
function generateKey($length = 8) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    $key = '';
    for ($i = 0; $i < $length; $i++) {
        $key .= $chars[rand(0, strlen($chars) - 1)];
    }
    return $key;
}
?>
