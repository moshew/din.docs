<?php
require_once 'config.php';

function sendWelcomeEmail($email, $key) {
    $downloadLink = DOWNLOAD_FILE_URL . '?key=' . urlencode($key);

    $html = '<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;direction:rtl;text-align:right;color:#333;max-width:600px;margin:0 auto;padding:20px;">

    <h2 style="color:#2c5282;">ברוכים הבאים לדין.דוקס</h2>

    <p>תודה שנרשמת למערכת דין.דוקס. לחץ על הקישור להורדת התוכנה:</p>

    <p style="margin:30px 0;">
        <a href="' . htmlspecialchars($downloadLink) . '" style="background:#2c5282;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">לחץ כאן להורדה</a>
    </p>

    <p>הקישור תקף לשימוש חד-פעמי.</p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:30px 0;">

    <p style="font-size:13px;color:#718096;">
        בברכה,<br>
        צוות מרכז דין.אונליין<br>
        <a href="https://din-online.co.il" style="color:#718096;">din-online.co.il</a>
    </p>

</body>
</html>';

    $plainText = "ברוכים הבאים לדין.דוקס

תודה שנרשמת למערכת דין.דוקס.
לחץ על הקישור להורדת התוכנה:

{$downloadLink}

הקישור תקף לשימוש חד-פעמי.

בברכה,
צוות מרכז דין.אונליין
din-online.co.il";

    $payload = json_encode([
        'from'    => FROM_NAME . ' <' . FROM_EMAIL . '>',
        'to'      => [$email],
        'subject' => 'קישור ההורדה שלך - דין.דוקס',
        'html'    => $html,
        'text'    => $plainText,
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
