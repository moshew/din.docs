import React, { useMemo } from 'react';
import { FileText, FileCheck, Loader2, Save, AlertTriangle } from 'lucide-react';

export function ProgressModal({ 
  isOpen, 
  message = '', 
  step = 0, 
  total = 0, 
  error = null,
  phase = null,
  file = null,
  selectedFile = null
}) {
  const calculatedTotal = useMemo(() => {
    if (!selectedFile) return 0;
    
    let docCount = 0;
    
    if (selectedFile.mainFile?.path?.toLowerCase().endsWith('.docx')) {
      docCount++;
    }
    
    if (selectedFile.attachments?.length > 0) {
      const docxAttachments = selectedFile.attachments.filter(
        att => att.path?.toLowerCase().endsWith('.docx')
      );
      docCount += docxAttachments.length;
    }
    
    return docCount > 0 ? docCount + 4 : 0;
  }, [selectedFile]);

  const totalSteps = total || calculatedTotal;
  const displayMessage = message || 'מכין ליצירת מסמך...';

  if (!isOpen) return null;

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-[480px] h-[280px] overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-700 p-6">
            <div className="flex items-center justify-center gap-3">
              <AlertTriangle className="w-7 h-7 text-white" />
              <h2 className="text-2xl font-semibold text-white">שגיאה</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-red-50 rounded-lg p-4 shadow-inner">
              <p className="text-lg font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = totalSteps ? Math.round((step / totalSteps) * 100) : 0;

  const getPhaseInfo = () => {
    switch (phase) {
      case 'converting':
        return {
          icon: FileText,
          title: 'ממיר מסמך',
          color: 'from-blue-500 to-blue-700',
          bgColor: 'bg-blue-100'
        };
      case 'merging':
        return {
          icon: FileCheck,
          title: 'מאחד מסמכים',
          color: 'from-indigo-500 to-indigo-700',
          bgColor: 'bg-indigo-100'
        };
      case 'numbering':
        return {
          icon: Loader2,
          title: 'מוסיף מספרי עמודים',
          color: 'from-purple-500 to-purple-700',
          bgColor: 'bg-purple-100',
          animate: true
        };
      case 'saving':
        return {
          icon: Save,
          title: 'שומר מסמך',
          color: 'from-emerald-500 to-emerald-700',
          bgColor: 'bg-emerald-100'
        };
      default:
        return {
          icon: FileText,
          title: 'מעבד מסמך',
          color: 'from-blue-500 to-blue-700',
          bgColor: 'bg-blue-100'
        };
    }
  };

  const { icon: Icon, title, color, bgColor, animate } = getPhaseInfo();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[480px] h-[280px] overflow-hidden flex flex-col">
        <div className={`bg-gradient-to-r ${color} p-6 shrink-0`}>
          <div className="flex items-center justify-center gap-2">
            <Icon className={`w-7 h-7 text-white ${animate ? 'animate-spin' : ''}`} />
            <h2 className="text-3xl font-semibold text-white pb-[3px]">{title}</h2>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col min-h-0">
          <div className={`${bgColor} rounded-lg p-4 shadow-inner mb-6 overflow-y-auto flex-1`}>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">
                שלב {step} מתוך {totalSteps}
              </p>
              <p className="text-lg font-medium">{displayMessage}</p>
              {file && (
                <p className="text-sm text-gray-600 mt-1">
                  {file.type === 'main' ? 'מסמך ראשי' : file.type === 'attachment' ? `נספח ${file.index + 1}` : ''}: {file.name}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 shrink-0">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{progress}% הושלם</span>
              <span className="text-gray-500">נותרו {totalSteps - step} שלבים</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${color} transition-all duration-300 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}