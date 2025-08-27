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
        $mail->Encoding = '8bit';
        $mail->Host = "smtp.gmail.com";
        $mail->SMTPDebug = false;
        $mail->SMTPAuth = true;
        $mail->SMTPSecure = "tls";
        $mail->Host = "smtp.gmail.com";
        $mail->Port = 587;
        $mail->Username = "atty.sivanwaisman@gmail.com";
        $mail->Password = "atyeimfhkqhxgryi";
        
        $downloadLink = DOWNLOAD_FILE_URL . '?key=' . urlencode($key);
        
        $mail->Subject = "ברוכים הבאים לדין.דוקס ‎- מערכת ניהול מסמכים משפטיים";
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
            unicode-bidi: bidi-override;
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
            margin-top: -15px;
            margin-bottom: 35px;
            font-size: 22px;
        }
        .content p {
            text-align: right;
            margin-bottom: 15px;
            direction: rtl;
            unicode-bidi: embed;
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
            direction: rtl;
            unicode-bidi: embed;
        }
        .license-box li {
            margin-bottom: 8px;
            text-align: right;
            direction: rtl;
            unicode-bidi: embed;
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
            direction: rtl;
            unicode-bidi: embed;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://docs.din-online.co.il/docs-logo.png" alt="דין.דוקס" class="logo" />
        </div>
        <div class="content">
            <h2>שמחים שבחרת להצטרף אלינו‎!</h2>
            <p>שלום וברכה,<br>
            תודה שבחרת להוריד את אפליקציית דין.דוקס ‎- מערכת ניהול המסמכים המשפטיים המתקדמת שלנו.</p>

            
            <div class="download-section">
                <a href="' . htmlspecialchars($downloadLink) . '" class="download-btn">הורדת התוכנה</a>
            </div>
            
            <div class="license-box">
                <h3>הסכם רישיון שימוש</h3>
                <p><strong>בעל הרישיון:</strong> מרכז דין.אונליין לשירותים משפטיים מקוונים</p>
                <p><strong>תנאי השימוש:</strong></p>
                <ul>
                    <li>התוכנה מסופקת "כפי שהיא" ‎(AS-IS) ללא כל אחריות מפורשת או משתמעת.</li>
                    <li>בעל הרישיון אינו נושא באחריות לכל נזק, ישיר או עקיף, שעלול להיגרם כתוצאה משימוש בתוכנה.</li>
                    <li>אין תמיכה טכנית זמינה לגרסת הבסיס של התוכנה.</li>
                    <li>השימוש בתוכנה הוא על אחריות המשתמש בלבד.</li>
                    <li>אין לשנות, להפיץ או למכור את התוכנה ללא אישור בכתב מבעל הרישיון.</li>
                    <li>הרישיון בתוקף עד להודעה על ביטולו על ידי בעל הרישיון.</li>
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
?>