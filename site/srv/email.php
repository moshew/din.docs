<?php
require_once 'config.php';

function sendWelcomeEmail($email, $key) {
    $downloadLink = DOWNLOAD_FILE_URL . '?key=' . urlencode($key);

    $html = '<!DOCTYPE html>
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
            <h2>!שמחים שבחרת להצטרף אלינו</h2>
            <p>שלום וברכה,<br>
            תודה שבחרת להוריד את אפליקציית דין.דוקס - מערכת ניהול המסמכים המשפטיים המתקדמת שלנו.</p>

            <div class="download-section">
                <a href="' . htmlspecialchars($downloadLink) . '" class="download-btn">הורדת התוכנה</a>
            </div>

            <div class="license-box">
                <h3>הסכם רישיון שימוש</h3>
                <p><strong>בעל הרישיון:</strong> מרכז דין.אונליין לשירותים משפטיים מקוונים</p>
                <p><strong>תנאי השימוש:</strong></p>
                <ul>
                    <li>התוכנה מסופקת "כפי שהיא" (AS-IS) ללא כל אחריות מפורשת או משתמעת.</li>
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

    $plainText = "ברוכים הבאים לדין.דוקס

שלום וברכה,

תודה רבה שבחרת להוריד את אפליקציית דין.דוקס - מערכת ניהול המסמכים המשפטיים המתקדמת שלנו.

לחץ על הקישור הבא להורדת התוכנה:
{$downloadLink}

בברכה,
צוות מרכז דין.אונליין

מרכז דין.אונליין לשירותים משפטיים מקוונים
support@din-online.co.il
www.din-online.co.il";

    $payload = json_encode([
        'from'    => FROM_NAME . ' <' . FROM_EMAIL . '>',
        'to'      => [$email],
        'subject' => 'ברוכים הבאים לדין.דוקס - מערכת ניהול מסמכים משפטיים',
        'html'    => $html,
        'text'    => $plainText,
        'headers' => [
            'List-Unsubscribe' => '<mailto:unsubscribe@din-online.co.il>',
        ],
    ]);

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . RESEND_API_KEY,
            'Content-Type: application/json',
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        DinDocsLogger::error("Resend curl error", ['email' => $email, 'error' => $curlError]);
        return false;
    }

    $data = json_decode($response, true);

    if ($httpCode === 200 || $httpCode === 201) {
        DinDocsLogger::info("Email sent successfully via Resend", [
            'email' => $email,
            'id'    => $data['id'] ?? null,
        ]);
        return true;
    }

    DinDocsLogger::error("Resend API error", [
        'email'    => $email,
        'httpCode' => $httpCode,
        'response' => $response,
    ]);
    return false;
}
?>
