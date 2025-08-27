<?php
// מערכת לוגים פנימית לדין.דוקס
class DinDocsLogger {
    private static $logFile = './logs/din_docs.log';
    private static $errorFile = './logs/din_docs_errors.log';
    
    public static function init() {
        // יצירת ספריית לוגים אם לא קיימת
        $logDir = dirname(self::$logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        // הגדרת error handler מותאם אישית
        set_error_handler([self::class, 'errorHandler']);
        set_exception_handler([self::class, 'exceptionHandler']);
    }
    
    public static function log($level, $message, $context = []) {
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = empty($context) ? '' : ' | Context: ' . json_encode($context, JSON_UNESCAPED_UNICODE);
        $logEntry = "[$timestamp] [$level] $message$contextStr" . PHP_EOL;
        
        // כתיבה לקובץ הלוג הכללי
        file_put_contents(self::$logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        // אם זה שגיאה, גם לקובץ השגיאות
        if (in_array($level, ['ERROR', 'CRITICAL'])) {
            file_put_contents(self::$errorFile, $logEntry, FILE_APPEND | LOCK_EX);
        }
    }
    
    public static function info($message, $context = []) {
        self::log('INFO', $message, $context);
    }
    
    public static function warning($message, $context = []) {
        self::log('WARNING', $message, $context);
    }
    
    public static function error($message, $context = []) {
        self::log('ERROR', $message, $context);
    }
    
    public static function critical($message, $context = []) {
        self::log('CRITICAL', $message, $context);
    }
    
    public static function debug($message, $context = []) {
        self::log('DEBUG', $message, $context);
    }
    
    public static function errorHandler($severity, $message, $file, $line) {
        $errorTypes = [
            E_ERROR => 'ERROR',
            E_WARNING => 'WARNING', 
            E_PARSE => 'CRITICAL',
            E_NOTICE => 'INFO',
            E_CORE_ERROR => 'CRITICAL',
            E_CORE_WARNING => 'WARNING',
            E_COMPILE_ERROR => 'CRITICAL',
            E_COMPILE_WARNING => 'WARNING',
            E_USER_ERROR => 'ERROR',
            E_USER_WARNING => 'WARNING',
            E_USER_NOTICE => 'INFO',
            E_STRICT => 'INFO',
            E_RECOVERABLE_ERROR => 'ERROR',
            E_DEPRECATED => 'INFO',
            E_USER_DEPRECATED => 'INFO'
        ];
        
        $type = $errorTypes[$severity] ?? 'UNKNOWN';
        $context = ['file' => $file, 'line' => $line, 'severity' => $severity];
        
        self::log($type, $message, $context);
        
        // החזר false כדי לתת ל-PHP לטפל בשגיאה גם בדרך הרגילה
        return false;
    }
    
    public static function exceptionHandler($exception) {
        $message = 'Uncaught exception: ' . $exception->getMessage();
        $context = [
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString()
        ];
        
        self::critical($message, $context);
    }
    
    public static function getRecentLogs($lines = 50, $level = null) {
        $logFile = $level === 'error' ? self::$errorFile : self::$logFile;
        
        if (!file_exists($logFile)) {
            return [];
        }
        
        $allLines = file($logFile, FILE_IGNORE_NEW_LINES);
        return array_slice($allLines, -$lines);
    }
    
    public static function clearLogs() {
        if (file_exists(self::$logFile)) {
            file_put_contents(self::$logFile, '');
        }
        if (file_exists(self::$errorFile)) {
            file_put_contents(self::$errorFile, '');
        }
    }
    
    public static function getLogStats() {
        $stats = [
            'total_logs' => 0,
            'errors' => 0,
            'warnings' => 0,
            'log_file_size' => 0,
            'error_file_size' => 0
        ];
        
        if (file_exists(self::$logFile)) {
            $stats['log_file_size'] = filesize(self::$logFile);
            $content = file_get_contents(self::$logFile);
            $stats['total_logs'] = substr_count($content, "\n");
            $stats['errors'] = substr_count($content, '[ERROR]') + substr_count($content, '[CRITICAL]');
            $stats['warnings'] = substr_count($content, '[WARNING]');
        }
        
        if (file_exists(self::$errorFile)) {
            $stats['error_file_size'] = filesize(self::$errorFile);
        }
        
        return $stats;
    }
}

// אתחול מערכת הלוגים
DinDocsLogger::init();
?>
