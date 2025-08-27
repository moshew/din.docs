<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once 'config.php';

/**
 * Send welcome email using PHPMailer only (no fallback)
 * Based on your working code
 */
function sendWelcomeEmail($email, $key) {
    // Use PHPMailer only - no fallback
    return sendWelcomeEmailPHPMailer($email, $key);
}

// PHPMailer function - based on your working code
function sendWelcomeEmailPHPMailer($email, $key) {
    try {
        require_once __DIR__ . '/PHPMailer/Exception.php';
        require_once __DIR__ . '/PHPMailer/PHPMailer.php';
        require_once __DIR__ . '/PHPMailer/SMTP.php';
        
        $mail = new PHPMailer();
        $mail->IsSMTP();
        $mail->CharSet = 'UTF-8';
        $mail->Host = "smtp.gmail.com";
        $mail->SMTPDebug = false;
        $mail->SMTPAuth = true;
        $mail->SMTPSecure = "tls";
        $mail->Host = "smtp.gmail.com";
        $mail->Port = 587;
        $mail->Username = "atty.sivanwaisman@gmail.com";
        $mail->Password = "atyeimfhkqhxgryi";
        
        $downloadLink = DOWNLOAD_URL . '?key=' . urlencode($key);
        
        $mail->Subject = "ברוכים הבאים לדין.דוקס - מערכת ניהול מסמכים משפטיים";
        $mail->SetFrom('sivan@din-online.co.il', 'דין אונליין');
        $mail->AddAddress($email, "לקוח דין.דוקס");
        
        $msg = '<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: "David", Arial, sans-serif; 
            direction: rtl; 
            line-height: 1.6; 
            text-align: right;
            margin: 0;
            padding: 0;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
        }
        .header { 
            text-align: center; 
        }
        .logo {
            height: 280px;
            margin: 0 auto;
            display: block;
        }

        .content { 
            background: white; 
            text-align: right;
        }
        .content h2 {
            text-align: center;
            color: #333;
            margin-bottom: 25px;
            font-size: 22px;
        }
        .content p {
            text-align: right;
            margin-bottom: 15px;
        }
        .download-section {
            text-align: center;
            margin: 30px 0;
        }
        .download-btn { 
            display: inline-block; 
            padding: 15px 30px; 
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            transition: all 0.3s ease;
        }
        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
        }
        .license-box { 
            background: #f8f9fa; 
            border: 1px solid #e9ecef; 
            border-radius: 8px;
            padding: 25px; 
            margin: 25px 0; 
            font-size: 14px;
            text-align: right;
        }
        .license-box h3 {
            text-align: center;
            color: #495057;
            margin-bottom: 20px;
            font-size: 18px;
        }
        .license-box ul {
            text-align: right;
            padding-right: 20px;
        }
        .license-box li {
            margin-bottom: 8px;
            text-align: right;
        }
        .footer { 
            padding: 5px 0px; 
            background: #343a40; 
            color: #adb5bd;
            text-align: center; 
            font-size: 12px; 
        }
        .footer p {
            margin: 5px 0;
            text-align: center;
        }
        .signature {
            margin-top: 30px;
            margin-bottom: 50px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://docs.din-online.co.il/docs-logo.png" alt="דין.דוקס" class="logo" />
        </div>
        <div class="content">
            <h2>שמחים שבחרת להצטרף אלינו!</h2>
            <p>שלום וברכה,</p>
            <p>תודה שבחרת להוריד את אפליקציית דין.דוקס - מערכת ניהול המסמכים המשפטיים המתקדמת שלנו</p>

            
            <div class="download-section">
                <a href="' . htmlspecialchars($downloadLink) . '" class="download-btn">הורדת התוכנה</a>
            </div>
            
            <div class="license-box">
                <h3>הסכם רישיון שימוש</h3>
                <p><strong>בעל הרישיון:</strong> מרכז דין.אונליין לשירותים משפטיים מקוונים</p>
                <p><strong>תנאי השימוש:</strong></p>
                <ul>
                    <li>התוכנה מסופקת "כפי שהיא" (AS-IS) ללא כל אחריות מפורשת או משתמעת</li>
                    <li>בעל הרישיון אינו נושא באחריות לכל נזק, ישיר או עקיף, שעלול להיגרם כתוצאה משימוש בתוכנה</li>
                    <li>אין תמיכה טכנית זמינה לגרסת הבסיס של התוכנה</li>
                    <li>השימוש בתוכנה הוא על אחריות המשתמש בלבד</li>
                    <li>אין לשנות, להפיץ או למכור את התוכנה ללא אישור בכתב מבעל הרישיון</li>
                    <li>הרישיון בתוקף עד להודעה על ביטולו על ידי בעל הרישיון</li>
                </ul>
                <p><em>השימוש בתוכנה מהווה הסכמה מלאה לתנאים אלה</em></p>
            </div>
            
            <div class="signature">
                <p>מאחלים לך חוויית שימוש נעימה ומוצלחת!</p>
                <p>בברכה,<br>צוות מרכז דין.אונליין</p>
            </div>
        </div>
        <div class="footer">
                    <p>מרכז דין.אונליין לשירותים משפטיים מקוונים</p>
        <p>אימייל זה נשלח באופן אוטומטי, אנא אל תשיבו עליו ישירות</p>
        </div>
    </div>
</body>
</html>';
        
        $mail->MsgHTML($msg);
        $result = $mail->Send();
        
        if ($result) {
            DinDocsLogger::info("Email sent successfully via PHPMailer", [
                'email' => $email,
                'method' => 'phpmailer',
                'key' => $key
            ]);
            return true;
        } else {
            DinDocsLogger::error("PHPMailer send failed", [
                'email' => $email,
                'method' => 'phpmailer',
                'error' => $mail->ErrorInfo
            ]);
            return false;
        }
        
    } catch (Exception $e) {
        DinDocsLogger::error("PHPMailer exception", [
            'email' => $email,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return false;
    } catch (Error $e) {
        DinDocsLogger::error("PHPMailer error", [
            'email' => $email,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return false;
    }
}

function sendWelcomeEmailBasic($email, $key) {
    $subject = 'ברוכים הבאים לדין.דוקס - מערכת ניהול מסמכים משפטיים';
    
    $downloadLink = DOWNLOAD_URL . '?key=' . urlencode($key);
    
    $htmlMessage = '<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: "David", Arial, sans-serif; 
            direction: rtl; 
            line-height: 1.6; 
            text-align: right;
            margin: 0;
            padding: 0;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
        }
        .header { 
            text-align: center; 
        }
        .logo {
            height: 280px;
            margin: 0 auto;
            display: block;
        }

        .content { 
            background: white; 
            text-align: right;
        }
        .content h2 {
            text-align: center;
            color: #333;
            margin-bottom: 25px;
            font-size: 22px;
        }
        .content p {
            text-align: right;
            margin-bottom: 15px;
        }
        .download-section {
            text-align: center;
            margin: 30px 0;
        }
        .download-btn { 
            display: inline-block; 
            padding: 15px 30px; 
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }
        .license-box { 
            background: #f8f9fa; 
            border: 1px solid #e9ecef; 
            border-radius: 8px;
            padding: 25px; 
            margin: 25px 0; 
            font-size: 14px;
            text-align: right;
        }
        .license-box h3 {
            text-align: center;
            color: #495057;
            margin-bottom: 20px;
            font-size: 18px;
        }
        .license-box ul {
            text-align: right;
            padding-right: 20px;
        }
        .license-box li {
            margin-bottom: 8px;
            text-align: right;
        }
        .footer { 
            padding: 5px 0px; 
            background: #343a40; 
            color: #adb5bd;
            text-align: center; 
            font-size: 12px; 
        }
        .footer p {
            margin: 5px 0;
            text-align: center;
        }
        .signature {
            margin-top: 30px;
            margin-bottom: 50px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://docs.din-online.co.il/docs-logo.png" alt="דין.דוקס" class="logo" />

        </div>
        <div class="content">
            <h2>שמחים שבחרת להצטרף אלינו!</h2>
            <p>שלום וברכה,</p>
            <p>תודה שבחרת להוריד את אפליקציית דין.דוקס - מערכת ניהול המסמכים המשפטיים המתקדמת שלנו</p>

            
            <div class="download-section">
                <a href="' . htmlspecialchars($downloadLink) . '" class="download-btn">הורדת התוכנה</a>
            </div>
            
            <div class="license-box">
                <h3>הסכם רישיון שימוש</h3>
                <p><strong>בעל הרישיון:</strong> מרכז דין.אונליין לשירותים משפטיים מקוונים</p>
                <p><strong>תנאי השימוש:</strong></p>
                <ul>
                    <li>התוכנה מסופקת "כפי שהיא" (AS-IS) ללא כל אחריות מפורשת או משתמעת</li>
                    <li>בעל הרישיון אינו נושא באחריות לכל נזק, ישיר או עקיף, שעלול להיגרם כתוצאה משימוש בתוכנה</li>
                    <li>אין תמיכה טכנית זמינה לגרסת הבסיס של התוכנה</li>
                    <li>השימוש בתוכנה הוא על אחריות המשתמש בלבד</li>
                    <li>אין לשנות, להפיץ או למכור את התוכנה ללא אישור בכתב מבעל הרישיון</li>
                    <li>הרישיון בתוקף עד להודעה על ביטולו על ידי בעל הרישיון</li>
                </ul>
                <p><em>השימוש בתוכנה מהווה הסכמה מלאה לתנאים אלה</em></p>
            </div>
            
            <div class="signature">
                <p>מאחלים לך חוויית שימוש נעימה ומוצלחת!</p>
                <p>בברכה,<br>צוות מרכז דין.אונליין</p>
            </div>
        </div>
        <div class="footer">
                    <p>מרכז דין.אונליין לשירותים משפטיים מקוונים</p>
        <p>אימייל זה נשלח באופן אוטומטי, אנא אל תשיבו עליו ישירות</p>
        </div>
    </div>
</body>
</html>';
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>',
        'Reply-To: ' . FROM_EMAIL,
        'X-Mailer: PHP/' . phpversion()
    ];
    
    $success = mail($email, $subject, $htmlMessage, implode("\r\n", $headers));
    
    // Enhanced logging
    $logData = [
        'email' => $email,
        'method' => 'basic_mail',
        'success' => $success,
        'from_email' => FROM_EMAIL,
        'from_name' => FROM_NAME
    ];
    
    if ($success) {
        DinDocsLogger::info("Email sent successfully via basic mail()", $logData);
    } else {
        $error = error_get_last();
        $logData['error'] = $error['message'] ?? 'Unknown error';
        DinDocsLogger::error("Email failed via basic mail()", $logData);
    }
    
    return $success;
}

// Simple SMTP function - based on your working code approach
function sendWelcomeEmailSMTP($email, $key) {
    try {
        $subject = 'ברוכים הבאים לדין.דוקס - מערכת ניהול מסמכים משפטיים';
        $downloadLink = DOWNLOAD_URL . '?key=' . urlencode($key);
        
        $htmlMessage = '<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; direction: rtl; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: white; }
        .footer { padding: 20px; background: #f1f1f1; text-align: center; font-size: 12px; color: #666; }
        .download-btn { 
            display: inline-block; 
            padding: 15px 30px; 
            background: #28a745; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold;
            margin: 20px 0;
        }
        .license-box { 
            background: #f8f9fa; 
            border: 1px solid #ddd; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 5px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>דין.דוקס</h1>
            <p>מערכת ניהול מסמכים משפטיים</p>
        </div>
        <div class="content">
            <h2>שמחים שבחרת להצטרף אלינו!</h2>
            <p>שלום וברכה,</p>
            <p>תודה שבחרת להוריד את אפליקציית דין.דוקס - מערכת ניהול המסמכים המתקדמת שלנו.</p>

            <div style="text-align: center;">
                <a href="' . htmlspecialchars($downloadLink) . '" class="download-btn">הורדת התוכנה</a>
            </div>
            <div class="license-box">
                <h3>הסכם רישיון שימוש</h3>
                <p><strong>בעל הרישיון:</strong> מרכז דין.אונליין לשירותים משפטיים מקוונים</p>
                <p><strong>תנאי השימוש:</strong></p>
                <ul>
                    <li>התוכנה מסופקת "כפי שהיא" (AS-IS) ללא כל אחריות מפורשת או משתמעת</li>
                    <li>בעל הרישיון אינו נושא באחריות לכל נזק, ישיר או עקיף, שעלול להיגרם כתוצאה משימוש בתוכנה</li>
                    <li>אין תמיכה טכנית זמינה לגרסת הבסיס של התוכנה</li>
                    <li>השימוש בתוכנה הוא על אחריות המשתמש בלבד</li>
                    <li>אין לשנות, להפיץ או למכור את התוכנה ללא אישור בכתב מבעל הרישיון</li>
                    <li>הרישיון בתוקף עד להודעה על ביטולו על ידי בעל הרישיון</li>
                </ul>
                <p><em>השימוש בתוכנה מהווה הסכמה מלאה לתנאים אלה</em></p>
            </div>
            <p>מאחלים לך חוויית שימוש נעימה ומוצלחת!</p>
            <p>בברכה,<br>צוות מרכז דין.אונליין</p>
        </div>
        <div class="footer">
                    <p>מרכז דין.אונליין לשירותים משפטיים מקוונים</p>
        <p>אימייל זה נשלח באופן אוטומטי, אנא אל תשיבו עליו ישירות</p>
        </div>
    </div>
</body>
</html>';

        // Use direct SMTP connection - simpler and cleaner
        $result = sendDirectSMTP($email, $subject, $htmlMessage);
        
        if ($result) {
            DinDocsLogger::info("Email sent successfully via direct SMTP", [
                'email' => $email,
                'method' => 'direct_smtp',
                'key' => $key
            ]);
            return true;
        } else {
            DinDocsLogger::error("Direct SMTP send failed", [
                'email' => $email,
                'method' => 'direct_smtp'
            ]);
            return false;
        }
        
    } catch (Exception $e) {
        DinDocsLogger::error("SMTP exception", [
            'email' => $email,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return false;
    }
}

// Direct SMTP connection function - based on your working approach
function sendDirectSMTP($to, $subject, $body) {
    try {
        $smtp_host = SMTP_HOST;
        $smtp_port = SMTP_PORT;
        $smtp_user = SMTP_USER;
        $smtp_pass = SMTP_PASS;
        $from_email = FROM_EMAIL;
        $from_name = FROM_NAME;
        
        // Try different connection methods based on port
        $socket = false;
        
        if ($smtp_port == 465) {
            // SSL connection for port 465
            $socket = @fsockopen("ssl://" . $smtp_host, $smtp_port, $errno, $errstr, 30);
        } elseif ($smtp_port == 587) {
            // TLS/STARTTLS connection for port 587
            $socket = @fsockopen($smtp_host, $smtp_port, $errno, $errstr, 30);
        } else {
            // Default - try SSL
            $socket = @fsockopen("ssl://" . $smtp_host, $smtp_port, $errno, $errstr, 30);
        }
        
        if (!$socket) {
            DinDocsLogger::error("SMTP connection failed", [
                'host' => $smtp_host,
                'port' => $smtp_port,
                'errno' => $errno,
                'errstr' => $errstr
            ]);
            return false;
        }
        
        // Get server greeting
        $response = fgets($socket);
        if (substr($response, 0, 3) != '220') {
            DinDocsLogger::error("SMTP greeting failed", ['response' => trim($response)]);
            fclose($socket);
            return false;
        }
        
        // EHLO
        fputs($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost') . "\r\n");
        $ehlo_response = '';
        while($line = fgets($socket)) {
            $ehlo_response .= $line;
            if(substr($line, 3, 1) == ' ') break;
        }
        
        // If port 587, try STARTTLS
        if ($smtp_port == 587 && strpos($ehlo_response, 'STARTTLS') !== false) {
            fputs($socket, "STARTTLS\r\n");
            $response = fgets($socket);
            if (substr($response, 0, 3) == '220') {
                // Upgrade to TLS
                if (stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    // Send EHLO again after TLS
                    fputs($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost') . "\r\n");
                    while($line = fgets($socket)) {
                        if(substr($line, 3, 1) == ' ') break;
                    }
                }
            }
        }
        
        // AUTH LOGIN
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket);
        if (substr($response, 0, 3) != '334') {
            DinDocsLogger::error("AUTH LOGIN failed", ['response' => trim($response)]);
            fclose($socket);
            return false;
        }
        
        // Send username
        fputs($socket, base64_encode($smtp_user) . "\r\n");
        $response = fgets($socket);
        
        // Send password
        fputs($socket, base64_encode($smtp_pass) . "\r\n");
        $response = fgets($socket);
        if (substr($response, 0, 3) != '235') {
            DinDocsLogger::error("SMTP auth failed", ['response' => trim($response)]);
            fclose($socket);
            return false;
        }
        
        // MAIL FROM
        fputs($socket, "MAIL FROM:<$from_email>\r\n");
        $response = fgets($socket);
        
        // RCPT TO
        fputs($socket, "RCPT TO:<$to>\r\n");
        $response = fgets($socket);
        
        // DATA
        fputs($socket, "DATA\r\n");
        $response = fgets($socket);
        
        // Email content
        $email_content = "From: =?UTF-8?B?" . base64_encode($from_name) . "?= <$from_email>\r\n";
        $email_content .= "To: $to\r\n";
        $email_content .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $email_content .= "MIME-Version: 1.0\r\n";
        $email_content .= "Content-Type: text/html; charset=UTF-8\r\n";
        $email_content .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $email_content .= $body . "\r\n.\r\n";
        
        fputs($socket, $email_content);
        $response = fgets($socket);
        
        // QUIT
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        return (substr($response, 0, 3) == '250');
        
    } catch (Exception $e) {
        DinDocsLogger::error("Direct SMTP exception", [
            'error' => $e->getMessage()
        ]);
        return false;
    }
}
?>