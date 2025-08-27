<?php
require_once 'config.php';

// Add CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get key parameter
$key = $_GET['key'] ?? '';

if (empty($key)) {
    // Redirect to app with error modal
    header('Location: https://docs.din-online.co.il/?error=' . urlencode('מפתח הורדה חסר'));
    exit;
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
        // Redirect to app with error modal
        header('Location: https://docs.din-online.co.il/?error=' . urlencode('מפתח הורדה לא תקין או שפג תוקפו'));
        exit;
    }
    
    // Check if key was already used for download
    if ($user['status'] === 'downloaded') {
        // Log attempted reuse
        DinDocsLogger::warning("Attempted download with already used key", [
            'email' => $user['email'],
            'key' => $key,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'last_download' => $user['last_download']
        ]);
        
        // Redirect to app with error modal
        header('Location: https://docs.din-online.co.il/?error=' . urlencode('מפתח זה כבר שימש להורדה. לא ניתן להוריד יותר מפעם אחת מאותו מפתח'));
        exit;
    }
    
    // Path to installer file
    $installerPath = '../Din.Docs-Setup-1.0.0.exe';
    
    if (!file_exists($installerPath)) {
        // Redirect to app with error modal
        header('Location: https://docs.din-online.co.il/?error=' . urlencode('קובץ ההתקנה אינו זמין כרגע. אנא נסה שוב מאוחר יותר או פנה לתמיכה'));
        exit;
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
    
    // Update download count and set status to downloaded
    $stmt = $pdo->prepare("UPDATE users_keys SET download_count = download_count + 1, last_download = NOW(), status = 'downloaded' WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Log successful download completion
    DinDocsLogger::info("Download completed successfully - key marked as used", [
        'email' => $user['email'],
        'key' => $key,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ]);
    
} catch (Exception $e) {
    DinDocsLogger::error("Download file error", [
        'error' => $e->getMessage(),
        'key' => $key,
        'trace' => $e->getTraceAsString()
    ]);
    // Redirect to app with error modal
    header('Location: https://docs.din-online.co.il/?error=' . urlencode('שגיאה במערכת. אנא נסה שוב מאוחר יותר'));
    exit;
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
    // Redirect to app with error modal
    header('Location: https://docs.din-online.co.il/?error=' . urlencode('שגיאה בקריאת הקובץ. אנא נסה שוב מאוחר יותר'));
    exit;
}

exit;
?>
