<?php
require_once 'config.php';

// Add CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: text/html; charset=utf-8');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get parameters
$key = $_GET['key'] ?? '';
$updates = ($_GET['updates'] ?? '0') === '1';

$error = '';
$downloadInfo = null;

if (empty($key)) {
    $error = 'לא צוין מפתח הורדה';
} else {
    try {
        $pdo = getDBConnection();
        if (!$pdo) {
            throw new Exception('שגיאה בחיבור לבסיס הנתונים');
        }
        
        // Validate key and get user info
        $stmt = $pdo->prepare("SELECT * FROM users_keys WHERE `key` = ?");
        $stmt->execute([$key]);
        $user = $stmt->fetch();
        
        if (!$user) {
            $error = 'מפתח הורדה לא תקין או שפג תוקפו';
        } elseif ($user['status'] === 'downloaded') {
            // Key already used for download - don't allow again
            $error = 'מפתח זה כבר שימש להורדה. לא ניתן להוריד יותר מפעם אחת מאותו מפתח. אנא הירשמו מחדש לקבלת מפתח חדש.';
        } else {
            $downloadInfo = $user;
            // Note: Status will be updated to 'downloaded' in download_file.php when actual download happens
        }
        
    } catch (Exception $e) {
        error_log("Download error: " . $e->getMessage());
        $error = 'שגיאה במערכת. אנא נסה שוב מאוחר יותר.';
    }
}

// Check if installer file exists
$installerPath = '../Din.Docs-Setup-1.0.0.exe';
$installerExists = file_exists($installerPath);
$installerSize = $installerExists ? filesize($installerPath) : 0;
?>

<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>הורדת דין.דוקס</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .logo {
            margin-bottom: 30px;
        }
        
        .logo h1 {
            color: #333;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .logo p {
            color: #666;
            font-size: 1.1em;
        }
        
        .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .message.warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .download-info {
            background: #e7f3ff;
            border: 1px solid #b3d7ff;
            border-radius: 10px;
            padding: 25px;
            margin: 20px 0;
        }
        
        .download-btn {
            display: inline-block;
            padding: 15px 30px;
            background: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            margin: 15px 0;
            transition: all 0.3s;
        }
        
        .download-btn:hover {
            background: #218838;
            transform: translateY(-2px);
        }
        
        .download-btn.disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .file-info {
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            font-size: 14px;
        }
        
        .instructions {
            text-align: right;
            margin: 20px 0;
            padding: 20px;
            background: #f1f3f4;
            border-radius: 8px;
        }
        
        .instructions h3 {
            color: #333;
            margin-bottom: 15px;
        }
        
        .instructions ol {
            margin-right: 20px;
            line-height: 1.8;
        }
        
        .back-link {
            display: inline-block;
            margin-top: 20px;
            color: #007bff;
            text-decoration: none;
        }
        
        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>דין.דוקס</h1>
            <p>מערכת ניהול מסמכים משפטיים</p>
        </div>
        
        <?php if ($error): ?>
            <div class="message error">
                <?= htmlspecialchars($error) ?>
            </div>
            
            <a href="register.php" class="back-link">← חזרה לעמוד ההרשמה</a>
            
        <?php elseif ($downloadInfo): ?>
            
            <?php if (isset($warning)): ?>
                <div class="message warning">
                    <?= htmlspecialchars($warning) ?>
                </div>
            <?php endif; ?>
            
            <div class="download-info">
                <h2>הורדת התוכנה</h2>
                <p>שלום <?= htmlspecialchars($downloadInfo['email']) ?>,</p>
                <p>אתה מוכן להוריד את אפליקציית דין.דוקס</p>
                
                <?php if ($installerExists): ?>
                    <div class="file-info">
                        <strong>קובץ ההתקנה:</strong> Din.Docs-Setup-1.0.0.exe<br>
                        <strong>גודל:</strong> <?= number_format($installerSize / 1024 / 1024, 2) ?> MB<br>
                        <strong>גרסה:</strong> 1.0.0
                    </div>
                    
                    <a href="download_file.php?key=<?= urlencode($key) ?>" class="download-btn">
                        📥 הורדת התוכנה
                    </a>
                    
                <?php else: ?>
                    <div class="message error">
                        קובץ ההתקנה אינו זמין כרגע. אנא פנה לתמיכה.
                    </div>
                <?php endif; ?>
            </div>
            
            <div class="instructions">
                <h3>הוראות התקנה:</h3>
                <ol>
                    <li>לחץ על כפתור ההורדה למעלה</li>
                    <li>שמור את הקובץ במיקום נוח במחשב</li>
                    <li>הרץ את קובץ ההתקנה כמנהל (לחיצה ימנית ← "הרץ כמנהל")</li>
                    <li>עקב אחר הוראות אשף ההתקנה</li>
                    <li>בסיום ההתקנה, הפעל את התוכנה מסרגל המשימות או מתפריט התחל</li>
                </ol>
                
                <p style="margin-top: 15px; font-size: 13px; color: #666;">
                    <strong>שים לב:</strong> ייתכן שתקבל אזהרת אבטחה מ-Windows Defender. 
                    זה נורמלי עבור תוכנות חדשות. לחץ על "מידע נוסף" ולאחר מכן "הרץ בכל זאת".
                </p>
            </div>
            
            <?php if ($downloadInfo['want_updates']): ?>
                <div class="message success">
                    ✅ נרשמת לקבלת עדכונים על גרסאות חדשות
                </div>
            <?php endif; ?>
            
        <?php endif; ?>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
            <p>מרכז דין.אונליין לשירותים משפטיים מקוונים</p>
            <p>לתמיכה: support@din-online.co.il</p>
        </div>
    </div>
</body>
</html>
