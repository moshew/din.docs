import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Plus, Check, X, Pencil, ChevronDown, Copy, FileText } from 'lucide-react';



export function PDFList({ 
  files, 
  selectedFile, 
  selectedPdf,
  onSelectFile, 
  onDeleteFile, 
  onUpdateTitle, 
  showAddNew, 
  isEditMode, 
  setIsEditMode 
}) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [editingFileId, setEditingFileId] = useState(null);
  const [editedFileName, setEditedFileName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateFileName, setDuplicateFileName] = useState('');
  const dropdownRef = useRef(null);

  const handleAddNew = async () => {
    if (newFileName.trim()) {
      try {
        const result = await window.ipcRenderer.invoke("newCase", {
          title: newFileName.trim()
        });
        
        if (result.status === 'success') {
          const newFile = {
            id: result.id,
            title: newFileName.trim(),
            updated_date: new Date().toISOString().split('T')[0]
          };
          onSelectFile(newFile);
          setNewFileName('');
          setIsAddingNew(false);
        }
      } catch (error) {
        console.error('Failed to create new case:', error);
      }
    }
  };

  const handleDeleteClick = (fileId, event) => {
    event.stopPropagation();
    setDeleteConfirmation(fileId);
  };

  const handleConfirmDelete = async (event) => {
    event.stopPropagation();
    if (deleteConfirmation) {
      try {
        const result = await window.ipcRenderer.invoke("deleteCase", deleteConfirmation);
        if (result.status === 'success') {
          onDeleteFile(deleteConfirmation, event);
        }
      } catch (error) {
        console.error('Failed to delete case:', error);
      } finally {
        setDeleteConfirmation(null);
      }
    }
  };

  const handleCancelDelete = (event) => {
    event.stopPropagation();
    setDeleteConfirmation(null);
  };

  const handleEditClick = (file, event) => {
    event.stopPropagation();
    setEditingFileId(file.id);
    setEditedFileName(file.title);
  };

  const handleSaveEdit = (file, event) => {
    event.stopPropagation();
    if (editedFileName.trim()) {
      onUpdateTitle(file.id, editedFileName.trim());
      setEditingFileId(null);
      setEditedFileName('');
    }
  };

  const handleCancelEdit = (event) => {
    event.stopPropagation();
    setEditingFileId(null);
    setEditedFileName('');
  };

  const handleEditKeyDown = (event, file) => {
    if (event.key === 'Enter') {
      handleSaveEdit(file, event);
    } else if (event.key === 'Escape') {
      handleCancelEdit(event);
    }
  };

  const handleDuplicateDocument = () => {
    setIsDropdownOpen(false);
    setIsDuplicating(true);
    setDuplicateFileName(`${selectedFile.title} - עותק`);
  };

  const handleDuplicateSubmit = async () => {
    if (duplicateFileName.trim() && selectedFile) {
      try {
        const result = await window.ipcRenderer.invoke("duplicateCase", {
          title: duplicateFileName.trim(),
          caseToDuplicate: selectedFile.id
        });
        
        if (result.status === 'success') {
          const newFile = {
            id: result.id,
            title: duplicateFileName.trim(),
            updated_date: new Date().toISOString().split('T')[0]
          };
          onSelectFile(newFile);
          setDuplicateFileName('');
          setIsDuplicating(false);
        }
      } catch (error) {
        console.error('Failed to duplicate case:', error);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (date) => {
    if (!date) return null;
    try {
      return new Date(date).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };

  const FileItem = ({ file }) => {
    const isSelected = selectedFile?.id === file.id;
    const isConfirmingDelete = deleteConfirmation === file.id;
    const isEditing = editingFileId === file.id;
    const formattedDate = formatDate(file.updated_date);
    
    return (
      <div
        className={`group relative ${isSelected ? 'bg-[#d7e9fa]' : 'hover:bg-[#f5f8ff]'} ${
          isEditMode ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        {isSelected && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1.5 bg-[#0078d4]"
            aria-hidden="true"
          />
        )}
        <button
          onClick={() => {
            if (isEditMode || isEditing) return;
            // Allow reloading if clicking the already selected case but viewing an attachment
            if (selectedFile?.id === file.id && selectedPdf?.path === selectedFile?.outputFile?.path) return;
            onSelectFile(file);
          }}
          className={`w-full py-2.5 flex items-start transition-colors duration-150 focus:outline-none px-4 pl-16 ${
            isEditing ? 'pl-20' : ''
          }`}
          disabled={isEditMode}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              e.currentTarget.blur();
            }
          }}
        >
          <div className="flex-1 min-w-0 text-right flex items-start">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    value={editedFileName}
                    onChange={(e) => setEditedFileName(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, file)}
                    className="w-full text-sm bg-transparent focus:outline-none text-right"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute right-0 left-0 bottom-0 h-px bg-[#0078d4] pointer-events-none" />
                </div>
              ) : (
                <p className="text-sm font-medium text-[#323130] truncate max-w-full">
                  {file.title}
                </p>
              )}
              <div className="text-xs text-[#605e5c] mt-0.5 text-right">
                <p>
                  {formattedDate 
                    ? `עודכן לאחרונה: ${formattedDate}`
                    : 'טרם נוצר'}
                </p>
              </div>
            </div>
          </div>
        </button>
        {isEditing ? (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 bg-white shadow-md px-2 py-1">
            <button
              onClick={(e) => handleSaveEdit(file, e)}
              className="p-1 hover:bg-[#f3f2f1] transition-colors focus:outline-none"
              title="שמור שינויים"
            >
              <Check className="w-4 h-4 text-[#0078d4]" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 hover:bg-[#f3f2f1] transition-colors focus:outline-none"
              title="בטל"
            >
              <X className="w-4 h-4 text-[#a4262c]" />
            </button>
          </div>
        ) : isConfirmingDelete ? (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 bg-white shadow-md px-2 py-1">
            <span className="text-xs text-[#323130] ml-2">למחוק?</span>
            <button
              onClick={handleConfirmDelete}
              className="p-1 hover:bg-[#f3f2f1] transition-colors focus:outline-none"
              title="אשר מחיקה"
            >
              <Check className="w-4 h-4 text-[#0078d4]" />
            </button>
            <button
              onClick={handleCancelDelete}
              className="p-1 hover:bg-[#f3f2f1] transition-colors focus:outline-none"
              title="בטל"
            >
              <X className="w-4 h-4 text-[#a4262c]" />
            </button>
          </div>
        ) : null}
        
        {!isEditMode && !isConfirmingDelete && !isEditing && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center">
            <button
              onClick={(e) => handleEditClick(file, e)}
              className="h-full px-1.5 opacity-0 group-hover:opacity-100 hover:bg-[#e9f2fc] transition-opacity duration-200 focus:outline-none focus:opacity-100 flex items-center"
              title="ערוך שם מסמך"
            >
              <Pencil className="w-4 h-4 text-[#0078d4]" />
            </button>
            <button
              onClick={(e) => handleDeleteClick(file.id, e)}
              className="h-full px-1.5 opacity-0 group-hover:opacity-100 hover:bg-[#ffebee] transition-opacity duration-200 focus:outline-none focus:opacity-100 flex items-center"
              title="מחק מסמך"
            >
              <Trash2 className="w-4 h-4 text-[#a4262c]" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Reverse the files array to display in reverse order
  const reversedFiles = [...files].reverse();

  return (
    <div className="h-full flex flex-col bg-[#FBFDFF]">
      <div className="flex-1 overflow-y-scroll overflow-x-hidden pdf-list-scroll pr-1">
          <div className="px-3 py-2 sticky top-0 bg-[#FBFDFF] z-10">
            {isAddingNew || isDuplicating ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={isDuplicating ? duplicateFileName : newFileName}
                  onChange={(e) => isDuplicating ? setDuplicateFileName(e.target.value) : setNewFileName(e.target.value)}
                  placeholder={isDuplicating ? "הכנס שם מסמך לשכפול" : "הכנס שם מסמך"}
                  className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-[#0078d4] text-sm focus:outline-none text-right rounded"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (isDuplicating) {
                        handleDuplicateSubmit();
                      } else {
                        handleAddNew();
                      }
                    }
                    if (e.key === 'Escape') {
                      if (isDuplicating) {
                        setIsDuplicating(false);
                        setDuplicateFileName('');
                      } else {
                        setIsAddingNew(false);
                        setNewFileName('');
                      }
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={isDuplicating ? handleDuplicateSubmit : handleAddNew}
                  title={isDuplicating ? "שכפל מסמך" : "הוסף מסמך"}
                  className="shrink-0 p-1.5 bg-[#0078d4] text-white hover:bg-[#106ebe] transition-colors duration-300 focus:outline-none rounded"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (isDuplicating) {
                      setIsDuplicating(false);
                      setDuplicateFileName('');
                    } else {
                      setIsAddingNew(false);
                      setNewFileName('');
                    }
                  }}
                  title="בטל"
                  className="shrink-0 p-1.5 border border-[#8a8886] text-[#323130] hover:bg-[#f3f2f1] transition-colors duration-300 focus:outline-none rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-start -mr-1.5">
                <div ref={dropdownRef} className="relative">
                  {/* Split Button Container */}
                  <div className={`flex rounded-md overflow-hidden ${
                    isEditMode 
                      ? 'opacity-50'
                      : ''
                  }`}>
                    {/* Main Button */}
                    <button
                      onClick={() => !isEditMode && setIsAddingNew(true)}
                      disabled={isEditMode}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors duration-300 ${
                        isEditMode 
                          ? 'bg-transparent text-[#a19f9d] cursor-not-allowed'
                          : 'bg-[#0078d4] text-white hover:bg-[#106ebe] focus:outline-none'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      מסמך חדש
                    </button>
                    
                    {/* Dropdown Button */}
                    <button
                      onClick={() => !isEditMode && selectedFile && setIsDropdownOpen(!isDropdownOpen)}
                      disabled={isEditMode || !selectedFile}
                      className={`px-2 py-1.5 border-r border-[#ffffff33] transition-colors duration-300 ${
                        isEditMode || !selectedFile
                          ? 'bg-[#0078d4]/20 cursor-not-allowed'
                          : 'bg-[#0078d4] text-white hover:bg-[#106ebe] focus:outline-none'
                      }`}
                      title={selectedFile ? "אפשרויות נוספות" : "בחר מסמך תחילה"}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      } ${
                        isEditMode || !selectedFile ? 'text-[#0078d4]' : 'text-white'
                      }`} />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && !isEditMode && selectedFile && (
                    <div className="absolute top-full left-0 mt-0 bg-white border border-[#e1dfdd] rounded-md shadow-lg z-20" style={{width: '100%'}}>
                      <button
                        onClick={handleDuplicateDocument}
                        className="w-full px-3 py-1.5 text-sm text-right bg-[#0078d4] text-white hover:bg-[#106ebe] transition-colors duration-150 flex items-center gap-2 rounded-md"
                      >
                        <Copy className="w-4 h-4" />
                        <span>שכפל מסמך</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="pb-1 divide-y divide-[#eaeaea]">
            {reversedFiles.map(file => (
              <FileItem key={file.id} file={file} />
            ))}
                     </div>
       </div>
     </div>
  );
}