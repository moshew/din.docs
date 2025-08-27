<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start output buffering to prevent header issues
ob_start();

require_once 'config.php';
require_once 'email.php';

header('Content-Type: text/html; charset=utf-8');

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $agree_license = isset($_POST['agree_license']) && $_POST['agree_license'] === '1';
    $want_updates = isset($_POST['want_updates']) && $_POST['want_updates'] === '1';
    
    $response = ['success' => false, 'message' => ''];
    
    if (!$email) {
        $response['message'] = 'כתובת אימייל לא תקינה';
    } elseif (!$agree_license) {
        $response['message'] = 'יש לאשר את הסכם הרישוי';
    } else {
        try {
            $pdo = getDBConnection();
            if (!$pdo) {
                throw new Exception('שגיאה בחיבור לבסיס הנתונים');
            }
            
            // Check if email already exists
            $stmt = $pdo->prepare("SELECT id FROM users_keys WHERE email = ?");
            if (!$stmt) {
                throw new Exception('שגיאה בהכנת שאילתת בדיקת אימייל');
            }
            $stmt->execute([$email]);
            
            if ($stmt->fetch()) {
                $response['message'] = 'כתובת האימייל כבר רשומה במערכת';
            } else {
                // Generate unique key
                do {
                    $key = generateKey();
                    $stmt = $pdo->prepare("SELECT id FROM users_keys WHERE `key` = ?");
                    $stmt->execute([$key]);
                } while ($stmt->fetch());
                
                // Insert new user - check if created column exists
                $stmt = $pdo->query("SHOW COLUMNS FROM users_keys LIKE 'created'");
                $hasCreatedColumn = $stmt->rowCount() > 0;
                
                if ($hasCreatedColumn) {
                    $stmt = $pdo->prepare("
                        INSERT INTO users_keys (email, `key`, status, want_updates, created) 
                        VALUES (?, ?, 'created', ?, NOW())
                    ");
                } else {
                    $stmt = $pdo->prepare("
                        INSERT INTO users_keys (email, `key`, status, want_updates) 
                        VALUES (?, ?, 'created', ?)
                    ");
                }
                if (!$stmt) {
                    throw new Exception('שגיאה בהכנת שאילתת הוספת משתמש');
                }
                $result = $stmt->execute([$email, $key, $want_updates ? 1 : 0]);
                if (!$result) {
                    throw new Exception('שגיאה בהוספת משתמש לבסיס הנתונים');
                }
                
                // Send welcome email
                if (sendWelcomeEmail($email, $key)) {
                    DinDocsLogger::info("User registered successfully", [
                        'email' => $email,
                        'key' => $key,
                        'want_updates' => $want_updates
                    ]);
                    $response = [
                        'success' => true, 
                        'message' => 'הרשמה הושלמה בהצלחה! אימייל עם קישור להורדה נשלח אליך.',
                        'key' => $key,
                        'want_updates' => $want_updates
                    ];
                } else {
                    DinDocsLogger::warning("Registration completed but email failed", [
                        'email' => $email,
                        'key' => $key
                    ]);
                    $response['message'] = 'הרשמה הושלמה אך שליחת האימייל נכשלה. אנא פנה לתמיכה.';
                }
            }
        } catch (Exception $e) {
            DinDocsLogger::error("Registration error", [
                'error' => $e->getMessage(),
                'email' => $email,
                'trace' => $e->getTraceAsString()
            ]);
            $response['message'] = 'שגיאה במערכת. אנא נסה שוב מאוחר יותר.';
        }
    }
    
    if (isset($_POST['ajax'])) {
        header('Content-Type: application/json');
        echo json_encode($response);
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>הרשמה - דין.דוקס</title>
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
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .logo {
            text-align: center;
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
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        input[type="email"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        input[type="email"]:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .checkbox-group {
            margin: 20px 0;
        }
        
        .checkbox-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .checkbox-item input[type="checkbox"] {
            margin-left: 10px;
            margin-top: 2px;
        }
        
        .checkbox-item label {
            margin: 0;
            font-weight: normal;
            line-height: 1.5;
            cursor: pointer;
        }
        
        .license-text {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            margin-top: 10px;
            max-height: 200px;
            overflow-y: auto;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .download-btn {
            width: 100%;
            padding: 15px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 20px;
        }
        
        .download-btn:hover:not(:disabled) {
            background: #218838;
            transform: translateY(-2px);
        }
        
        .download-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        #downloadSection {
            display: none;
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: #e7f3ff;
            border-radius: 10px;
        }
        
        .download-link {
            display: inline-block;
            padding: 15px 30px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            margin-top: 15px;
            transition: background 0.3s;
        }
        
        .download-link:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>דין.דוקס</h1>
            <p>מערכת ניהול מסמכים משפטיים</p>
        </div>
        
        <?php if (isset($response)): ?>
            <div class="message <?= $response['success'] ? 'success' : 'error' ?>">
                <?= htmlspecialchars($response['message']) ?>
            </div>
        <?php endif; ?>
        
        <form id="registerForm" method="POST" action="">
            <div class="form-group">
                <label for="email">כתובת אימייל:</label>
                <input type="email" id="email" name="email" required 
                       value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
            </div>
            
            <div class="checkbox-group">
                <div class="checkbox-item">
                    <input type="checkbox" id="agree_license" name="agree_license" value="1" required>
                    <label for="agree_license">
                        אני מסכים/ה להסכם הרישוי
                        <div class="license-text">
                            <strong>הסכם רישיון שימוש - דין.דוקס</strong><br><br>
                            
                            <strong>בעל הרישיון:</strong> מרכז דין.אונליין לשירותים משפטיים מקוונים<br><br>
                            
                            <strong>תנאי השימוש:</strong><br>
                            1. התוכנה מסופקת "כפי שהיא" (AS-IS) ללא כל אחריות מפורשת או משתמעת.<br>
                            2. בעל הרישיון אינו נושא באחריות לכל נזק, ישיר או עקיף, שעלול להיגרם כתוצאה משימוש בתוכנה.<br>
                            3. אין תמיכה טכנית זמינה לתוכנה זו.<br>
                            4. השימוש בתוכנה הוא על אחריות המשתמש בלבד.<br>
                            5. אין לשנות, להפיץ או למכור את התוכנה ללא אישור בכתב מבעל הרישיון.<br>
                            6. הרישיון בתוקף עד להודעה על ביטולו על ידי בעל הרישיון.<br><br>
                            
                            השימוש בתוכנה מהווה הסכמה מלאה לתנאים אלה.
                        </div>
                    </label>
                </div>
                
                <div class="checkbox-item">
                    <input type="checkbox" id="want_updates" name="want_updates" value="1">
                    <label for="want_updates">
                        אני מעונין/ת לקבל עדכונים על גרסאות חדשות ושיפורים
                    </label>
                </div>
            </div>
            
            <button type="submit" class="download-btn" id="submitBtn" disabled>
                הרשמה והורדה
            </button>
        </form>
        
        <?php if (isset($response) && $response['success']): ?>
        <div id="downloadSection" style="display: block;">
            <h3>הרשמה הושלמה בהצלחה!</h3>
            <p>קוד הורדה שלך: <strong><?= htmlspecialchars($response['key']) ?></strong></p>
            <a href="<?= DOWNLOAD_URL ?>?key=<?= urlencode($response['key']) ?>&updates=<?= $response['want_updates'] ? '1' : '0' ?>" 
               class="download-link">
                הורדת התוכנה
            </a>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
                נשלח אליך גם אימייל עם קישור להורדה ופרטי הרישיון
            </p>
        </div>
        <?php endif; ?>
    </div>
    
    <script>
        const agreeLicense = document.getElementById('agree_license');
        const submitBtn = document.getElementById('submitBtn');
        
        function updateSubmitButton() {
            submitBtn.disabled = !agreeLicense.checked;
        }
        
        agreeLicense.addEventListener('change', updateSubmitButton);
        
        // Initialize button state
        updateSubmitButton();
        
        // Form submission with AJAX
        document.getElementById('registerForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            formData.append('ajax', '1');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'מבצע רשמה...';
            
            fetch('', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.querySelector('.container').innerHTML = `
                        <div class="logo">
                            <h1>דין.דוקס</h1>
                            <p>מערכת ניהול מסמכים משפטיים</p>
                        </div>
                        <div class="message success">${data.message}</div>
                        <div id="downloadSection" style="display: block;">
                            <h3>הרשמה הושלמה בהצלחה!</h3>
                            <p>קוד הורדה שלך: <strong>${data.key}</strong></p>
                            <a href="${'<?= DOWNLOAD_URL ?>'}?key=${encodeURIComponent(data.key)}&updates=${data.want_updates ? '1' : '0'}" 
                               class="download-link">
                                הורדת התוכנה
                            </a>
                            <p style="margin-top: 15px; font-size: 14px; color: #666;">
                                נשלח אליך גם אימייל עם קישור להורדה ופרטי הרישיון
                            </p>
                        </div>
                    `;
                } else {
                    // Show error message
                    let messageDiv = document.querySelector('.message');
                    if (!messageDiv) {
                        messageDiv = document.createElement('div');
                        messageDiv.className = 'message error';
                        document.querySelector('.logo').after(messageDiv);
                    } else {
                        messageDiv.className = 'message error';
                    }
                    messageDiv.textContent = data.message;
                    
                    submitBtn.disabled = !agreeLicense.checked;
                    submitBtn.textContent = 'הרשמה והורדה';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                let messageDiv = document.querySelector('.message');
                if (!messageDiv) {
                    messageDiv = document.createElement('div');
                    messageDiv.className = 'message error';
                    document.querySelector('.logo').after(messageDiv);
                } else {
                    messageDiv.className = 'message error';
                }
                messageDiv.textContent = 'שגיאה בחיבור לשרת. אנא נסה שוב.';
                
                submitBtn.disabled = !agreeLicense.checked;
                submitBtn.textContent = 'הרשמה והורדה';
            });
        });
    </script>
</body>
</html>
