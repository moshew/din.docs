import React, { useState, useEffect } from 'react';
import { X, FolderSearch } from 'lucide-react';

export function FileCheckModal({ 
  isOpen, 
  onClose, 
  missingPath,
  documentName = 'מסמך',
  onPathCorrection 
}) {
  const [applyForAll, setApplyForAll] = useState(false);
  const [newPath, setNewPath] = useState(missingPath || '');

  useEffect(() => {
    setNewPath(missingPath || '');
  }, [missingPath]);

  const handleBrowse = async () => {
    try {
      const files = await window.ipcRenderer.invoke("fileDialog", { type: 'main' });
      if (files && files.length > 0) {
        setNewPath(files[0]);
      }
    } catch (error) {
      console.error('שגיאה בבחירת קובץ:', error?.message || 'שגיאה לא ידועה');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPath && newPath !== missingPath) {
      onPathCorrection({
        fixedPath: newPath,
        applyForAll
      });
      setNewPath('');
      setApplyForAll(false);
    }
  };

  if (!isOpen) return null;

  const isPathModified = newPath !== missingPath;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold text-[#323130] truncate mr-1">
            קובץ חסר
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#f3f2f1] rounded-full transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-[#605e5c]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto">
          <div className="mb-4">
            <p className="text-sm text-[#605e5c] break-words">
              <span className="text-[#605e5c]">המסמך </span>
              <span className="font-medium text-[#323130]">"{documentName}"</span>
              <span className="text-[#605e5c]"> לא נמצא. אנא ספק את הנתיב הנכון.</span>
            </p>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={handleBrowse}
              className="px-3 py-2 bg-[#0078d4] text-white rounded-md hover:bg-[#106ebe] transition-colors shrink-0"
            >
              <FolderSearch className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0078d4] min-w-0"
              placeholder="הכנס נתיב קובץ"
              dir="ltr"
            />
          </div>

          <label className="flex items-start gap-2 mb-4 text-sm text-[#323130]">
            <input
              type="checkbox"
              checked={applyForAll}
              onChange={(e) => setApplyForAll(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-[#0078d4] focus:ring-[#0078d4]"
            />
            <span className="break-words">
              החל תבנית נתיב זו על כל הקבצים
            </span>
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-[#f3f2f1] transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={!newPath || !isPathModified}
              className="px-4 py-2 text-sm bg-[#0078d4] text-white rounded-md hover:bg-[#106ebe] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              עדכן נתיב
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}