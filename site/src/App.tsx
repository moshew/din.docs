import React, { useState, useEffect } from 'react';
import ScrollAnimation from './components/ScrollAnimation';
import { FileText, Zap, Shield, Users, Clock, Check, ArrowLeft, Scale, Gavel, FileSearch, Edit3, BookOpen, Target, TrendingUp, Star, X, AlertCircle } from 'lucide-react';

function App() {
  const [email, setEmail] = useState('');
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [downloadData, setDownloadData] = useState<{key: string, want_updates: boolean} | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Check for error parameter in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      setErrorModal(decodeURIComponent(errorParam));
      // Clean URL without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('אנא הזינו כתובת אימייל תקינה');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('agree_license', '1');
      formData.append('want_updates', agreeMarketing ? '1' : '0');
      formData.append('ajax', '1');

      const response = await fetch('/srv/register.php', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(data.message);
        setMessageType('success');
        setDownloadData({
          key: data.key,
          want_updates: data.want_updates
        });
      } else {
        setMessage(data.message || 'שגיאה לא ידועה');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('שגיאה בחיבור לשרת. אנא נסו שוב.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-red-600 flex items-center">
                  <AlertCircle className="h-6 w-6 ml-2" />
                  שגיאה בהורדת הקובץ
                </h3>
                <button 
                  onClick={() => setErrorModal(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="text-gray-700 mb-6 text-right">
                <p className="mb-4">{errorModal}</p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>כיצד לפתור:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• בדקו שהקישור באימייל עדיין בתוקף</li>
                    <li>• נסו שוב או פנו לתמיכה טכנית</li>
                    <li>• תוכלו להירשם מחדש במקרה הצורך</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setErrorModal(null)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  סגור
                </button>
                <a 
                  href="#free-download" 
                  onClick={() => setErrorModal(null)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  הירשם מחדש
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center"> 
                <img src="/logo.png" alt="דין.דוקס" className="h-20 w-auto -my-3" />
              </div>
            </div>
            <nav className="hidden md:flex">
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium mx-6">יכולות מרכזיות</a>
              <a href="#advantages" className="text-gray-700 hover:text-blue-600 font-medium mx-6">יתרונות תחרותיים</a>
              <a href="#business" className="text-gray-700 hover:text-blue-600 font-medium mx-6">יתרונות עסקיים</a>
            </nav>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-medium">
                <a href="#free-download">הורידו בחינם</a>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mt-10 mb-6 leading-tight">
              מערכת דין.דוקס
              <br />
              <span className="text-5xl text-blue-600">הפקת וניהול מסמכים משפטיים</span>
            </h1>
            <div className="mt-12 mb-16">
              <p className="text-2xl font-semibold text-gray-700 mb-2">
                🎉 אפליקציה מודרנית ומתקדמת, בחינם - לתמיד!
              </p>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                חסכו 80% מזמן הכנת כתבי הטענות ושפרו את איכות המסמכים שלכם.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#free-download" className="bg-blue-600 text-white px-8 py-4 rounded-full hover:bg-blue-700 transition-colors font-medium text-lg">
                הורידו עכשיו בחינם
              </a>
            </div>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
              <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">80% חיסכון בזמן</h3>
              <p className="text-gray-600">הפחתה משמעותית בזמן הכנת כתבי טענות</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">פרטיות מלאה</h3>
              <p className="text-gray-600">המסמכים נשמרים על המחשב שלכם ונגישים תמיד</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
              <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">ממשק מתקדם וידידותי</h3>
              <p className="text-gray-600">עיבוד טקסט מתקדם וממשק אינטואיטיבי ונוח לשימוש</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">יכולות מרכזיות לעולם המשפט</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              פתרון מקיף לכל צרכי הכנת המסמכים המשפטיים - מכתבי טענות ועד ניהול נספחים מתקדם
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 p-3 rounded-full w-fit mb-4">
                <Gavel className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">הכנת כתבי טענות מלאים להגשה לבית משפט ולמערכת "נט המשפט"</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-green-100 p-3 rounded-full w-fit mb-4">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">יצירת תוכן עניינים ועמודי שער בהתאם לתקנות סדר הדין החדשות</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-orange-100 p-3 rounded-full w-fit mb-4">
                <BookOpen className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">המרת קבצי וורד ושילוב נספחים למסמכי PDF אחודים</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-indigo-100 p-3 rounded-full w-fit mb-4">
                <FileSearch className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">עורך טקסט מתקדם עם כלי עריכה מקצועיים ותבניות מוכנות</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-teal-100 p-3 rounded-full w-fit mb-4">
                <Target className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">כלי עימוד ומספור מתקדמים עם שליטה מלאה על עיצוב המסמכים</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-pink-100 p-3 rounded-full w-fit mb-4">
                <Star className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">תמיכה רב-לשונית (עברית, אנגלית וערבית)</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Free Download Section */}
      <section id="free-download" className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8">
            <h2 className="text-4xl font-bold mb-4">דין.דוקס - בחינם, לתמיד*! 🎉</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              הורידו עכשיו את דין.דוקס ללא עלות, ללא מגבלות זמן, ללא תשלומים נסתרים.
              המערכת המלאה זמינה לכם בחינם - לתמיד*!
            </p>
            
            <div className="bg-white rounded-2xl p-6 max-w-md mx-auto">
              {downloadData ? (
                // Success state - show success message only
                <div className="text-center">
                  <div className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">הרשמה הושלמה בהצלחה!</h3>
                  <p className="text-gray-600 mb-4">
                    נשלח לכם אימייל עם קישור להורדת התוכנה לכתובת שציינתם.
                  </p>
                  <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                    💡 בדקו את תיבת הדואר שלכם (כולל תיקיית הספאם) - האימייל אמור להגיע תוך דקות ספורות
                  </p>
                  {downloadData.want_updates && (
                    <p className="text-sm text-green-600 mt-2">
                      ✅ נרשמתם גם לקבלת עדכונים על גרסאות חדשות
                    </p>
                  )}
                </div>
              ) : (
                // Registration form
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">קבלו קישור להורדה</h3>
                  <p className="text-gray-600 mb-4">השאירו את כתובת האימייל שלכם ונשלח לכם קישור להורדת התוכנה</p>
                  
                  {message && (
                    <div className={`p-3 rounded-lg mb-4 text-center ${
                      messageType === 'success' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-2">
                    <input 
                      type="email" 
                      placeholder="כתובת אימייל"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 text-right text-gray-900"
                      disabled={isLoading}
                      required
                    />
                    
                    <div className="flex items-start space-x-2 text-right pb-6">
                      <input
                        type="checkbox"
                        id="marketing"
                        checked={agreeMarketing}
                        onChange={(e) => setAgreeMarketing(e.target.checked)}
                        className="mt-1 ml-2"
                        disabled={isLoading}
                      />
                      <label htmlFor="marketing" className="text-sm text-gray-600 cursor-pointer">
                        אני מעוניין/ת לקבל עדכונים על גרסאות חדשות ושיפורים
                      </label>
                    </div>

                    <div className="mt-6">
                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'שולח...' : 'שלחו לי קישור להורדה'}
                      </button>
                    </div>
                  </form>
                  
                  <p className="text-sm text-gray-500 mt-3">
                    ⓘ לא נשלח לכם ספאם, רק קישור להורדה חד פעמי
                  </p>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-right">
                      * תנאי השימוש החינמי:
                    </p>
                    <ul className="text-xs text-gray-500 mt-2 space-y-1 text-right">
                      <li>1. תיתכן גרסה בתשלום עבור יכולות עתידיות</li>
                      <li>2. המערכת הינה as-is. תמיכה תתאפשר בתשלום נפרד</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section id="advantages" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">יתרונות תחרותיים</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              למה Din.Docs הוא הבחירה הנכונה עבור המשרד שלכם
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-green-100 p-3 rounded-full w-fit mb-4">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">חיסכון בזמן משמעותי</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                  הפחתה של 80% בזמן
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                  אוטומציה מלאה
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                  ביטול עבודה ידנית
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 p-3 rounded-full w-fit mb-4">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">אפליקציה בחינם לחלוטין</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                  ללא דמי מנוי חודשיים
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                  ללא דמי שימוש נסתרים
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                  גישה מלאה לכל התכונות
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-purple-100 p-3 rounded-full w-fit mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">בטחון ואמינות</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                  שמירה מקומית מאובטחת
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                  פרטיות מלאה ומוגנת
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                  נגישות תמידית ומיידית
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-orange-100 p-3 rounded-full w-fit mb-4">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">קלות שימוש</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                  ממשק אינטואיטיבי
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                  עיצוב מודרני ונקי
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                  פידבק ויזואלי
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Business Benefits */}
      <section id="business" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">יתרונות עסקיים למשרדי עורכי דין</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              איך Din.Docs משנה את אופן העבודה ומשפר את הרווחיות של המשרד
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="bg-blue-50 p-8 rounded-3xl">
              <div className="bg-blue-100 p-4 rounded-full w-fit mb-6">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">שיפור היעילות התפעולית</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 ml-2 mt-0.5" />
                  <span>הפחתת עלות עבודה - פחות שעות עבודה מנהלתית</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 ml-2 mt-0.5" />
                  <span>שחרור זמן עורכי דין לעבודה משפטית מהותית</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 ml-2 mt-0.5" />
                  <span>הגדלת נפח התיקים שניתן לטפל בהם</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 ml-2 mt-0.5" />
                  <span>שיפור תזמוני הגשה ועמידה בלוחות זמנים</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 p-8 rounded-3xl">
              <div className="bg-green-100 p-4 rounded-full w-fit mb-6">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">שיפור איכות השירות</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 ml-2 mt-0.5" />
                  <span>מסמכים מקצועיים יותר ועקביים בעיצוב</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 ml-2 mt-0.5" />
                  <span>הפחתת שגיאות במסמכים המוגשים לבית המשפט</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 ml-2 mt-0.5" />
                  <span>שירות מהיר יותר ללקוחות</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 ml-2 mt-0.5" />
                  <span>דימוי מקצועי משופר</span>
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 p-8 rounded-3xl">
              <div className="bg-purple-100 p-4 rounded-full w-fit mb-6">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">יתרון תחרותי</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 ml-2 mt-0.5" />
                  <span>יכולת לקחת יותר תיקים מבלי להגדיל צוות</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 ml-2 mt-0.5" />
                  <span>הצעת מחירים תחרותיים יותר ללקוחות</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 ml-2 mt-0.5" />
                  <span>מענה מהיר לפניות דחופות</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 ml-2 mt-0.5" />
                  <span>התמחות בתיקים מורכבים הדורשים ארגון מתקדם</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollAnimation className="space-y-6">
            <h2 className="text-4xl font-bold">מוכנים להתחיל?</h2>
            <p className="text-xl max-w-3xl mx-auto">
            הצטרפו לעורכי הדין שכבר חוסכים שעות רבות בעיבוד מסמכים
            וייצור כתבי טענות מקצועיים עם דין.דוקס - בחינם לתמיד!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="#free-download" className="bg-white text-blue-600 px-8 py-4 rounded-full hover:bg-gray-100 transition-colors font-medium text-lg">
              הורידו עכשיו בחינם
            </a>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Scale className="h-8 w-8 text-blue-400 mt-1" />
                <span className="text-4xl font-bold mr-6">דין.דוקס</span>
              </div>
              <p className="text-gray-400 max-w-md">
                מערכת הפקת וניהול מסמכים משפטיים המיועדת למשרדי עורכי דין, 
                בתי משפט וארגונים משפטיים - בחינם לתמיד!
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">קישורים מהירים</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">יכולות</a></li>
                <li><a href="#advantages" className="hover:text-white">יתרונות</a></li>
                <li><a href="#business" className="hover:text-white">יתרונות עסקיים</a></li>
                <li><a href="#" className="hover:text-white">הורדה</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">צרו קשר</h4>
              <ul className="space-y-2 text-gray-400">
                <li>תמיכה טכנית</li>
                <li>ייעוץ והדרכה</li>
                <li>הדגמה אישית</li>
                <li>שאלות ותשובות</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 דין.דוקס, כל הזכויות שמורות. התוכנה זמינה בחינם לתמיד!</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;