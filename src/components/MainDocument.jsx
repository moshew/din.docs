import React from 'react';
import { FileText, Upload } from 'lucide-react';
import { truncateFileName, getFileNameFromPath } from '../utils/fileUtils';

export function MainDocument({ mainFile, onMainFileSelect, onMainFileClick, dragOver, disabled, selectedFile }) {
  const handleFileSelect = async (e) => {
    e.preventDefault();
    if (disabled) return;
    
    try {
      const files = await window.ipcRenderer.invoke("fileDialog", { type: 'main' });
      if (!files || files.length === 0) {
        return;
      }

      const filePath = files[0];
      const fileData = {
        name: getFileNameFromPath(filePath),
        path: filePath
      };

      if (selectedFile) {
        const result = await window.ipcRenderer.invoke("saveCase", {
          id: selectedFile.id,
          name: selectedFile.name,
          files: {
            main: fileData.path,
            attachments: selectedFile.attachments.map(att => ({
              path: att.path,
              title: att.name
            })),
            output: selectedFile.output
          }
        });

        if (result.updated_date) {
          fileData.updated_date = result.updated_date;
        }
      }

      onMainFileSelect(fileData);
    } catch (error) {
      console.error('Error selecting file:', error?.message || 'Unknown error occurred');
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename?.toLowerCase().split('.').pop();
    return <FileText className={`w-5 h-5 ${extension === 'pdf' ? 'text-[#E44D26]' : 'text-[#2B579A]'} flex-shrink-0 ml-4`} />;
  };

  if (mainFile) {
    return (
      <div
        className={`flex items-center justify-between ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-white'}`}
        onClick={(e) => {
          if (e.target.closest('button')) return;
          if (!disabled && onMainFileClick) {
            onMainFileClick(mainFile);
          }
        }}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0 p-2">
          <div className="flex-shrink-0">
            {getFileIcon(mainFile.path)}
          </div>
          <span
            className="text-sm text-[#323130] truncate text-right"
            title={`${mainFile.name}\nנתיב: ${mainFile.path}${mainFile.updated_date ? `\nעודכן לאחרונה: ${new Date(mainFile.updated_date).toLocaleString('he-IL')}` : ''}`}
          >
            {truncateFileName(mainFile.name)}
          </span>
        </div>
        <div className="flex items-center mr-2 flex-shrink-0">
          <button
            onClick={handleFileSelect}
            className={`p-1 transition-colors cursor-pointer ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f3f2f1]'
            }`}
            title={disabled ? 'לא ניתן להחליף בזמן עריכת נספחים' : 'החלף מסמך'}
          >
            <Upload className="w-4 h-4 text-[#0078d4]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="mb-2">
        <Upload className="w-8 h-8 text-[#0078d4] mx-auto" />
      </div>
      <p className="text-sm text-[#605e5c] mb-2">
        גרור ושחרר מסמך ראשי לכאן או
      </p>
      <button
        onClick={handleFileSelect}
        disabled={disabled}
        className={`inline-flex items-center px-3 py-1.5 text-sm transition-colors cursor-pointer ${
          disabled 
            ? 'bg-[#f3f2f1] text-[#a19f9d] cursor-not-allowed'
            : 'bg-[#0078d4] text-white hover:bg-[#106ebe]'
        }`}
      >
        בחר קובץ
      </button>
      <p className="text-xs text-[#605e5c] mt-2">
        תבניות נתמכות: PDF, DOCX
      </p>
    </div>
  );
}