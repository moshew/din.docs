<?php
require_once 'config.php';

// Get key parameter
$key = $_GET['key'] ?? '';

if (empty($key)) {
    http_response_code(400);
    die('מפתח הורדה חסר');
}

try {
    $pdo = getDBConnection();
    if (!$pdo) {
        throw new Exception('שגיאה בחיבור לבסיס הנתונים');
    }
    
    // Validate key
    $stmt = $pdo->prepare("SELECT * FROM users_keys WHERE `key` = ?");
    $stmt->execute([$key]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(404);
        die('מפתח הורדה לא תקין');
    }
    
    // Path to installer file
    $installerPath = './Din.Docs-Setup-1.0.0.exe';
    
    if (!file_exists($installerPath)) {
        http_response_code(404);
        die('קובץ ההתקנה לא נמצא');
    }
    
    // Log download attempt
    $stmt = $pdo->prepare("
        INSERT INTO download_logs (user_id, user_key, ip_address, user_agent, downloaded_at) 
        VALUES (?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $user['id'], 
        $key, 
        $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ]);
    
    // Log to our internal system
    DinDocsLogger::info("File download started", [
        'email' => $user['email'],
        'key' => $key,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? 'unknown', 0, 100)
    ]);
    
    // Update download count
    $stmt = $pdo->prepare("UPDATE users_keys SET download_count = download_count + 1, last_download = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
} catch (Exception $e) {
    DinDocsLogger::error("Download file error", [
        'error' => $e->getMessage(),
        'key' => $key,
        'trace' => $e->getTraceAsString()
    ]);
    http_response_code(500);
    die('שגיאה במערכת');
}

// Serve the file
$filename = 'Din.Docs-Setup-1.0.0.exe';
$filesize = filesize($installerPath);

// Set headers for file download
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . $filesize);
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Clear output buffer
if (ob_get_level()) {
    ob_end_clean();
}

// Read and output the file in chunks to handle large files
$file = fopen($installerPath, 'rb');
if ($file) {
    while (!feof($file)) {
        echo fread($file, 8192); // Read 8KB chunks
        flush();
    }
    fclose($file);
} else {
    http_response_code(500);
    die('שגיאה בקריאת הקובץ');
}

exit;
?>
