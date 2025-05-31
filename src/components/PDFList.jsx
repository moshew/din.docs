import React, { useState } from 'react';
import { FileText, Trash2, Plus, Check, X, Pencil } from 'lucide-react';

// Add custom CSS for right-side scrollbar using transform
const scrollbarStyles = `
  .scrollbar-right {
    transform: rotateY(180deg);
  }
  
  .scrollbar-right > .scroll-content {
    transform: rotateY(180deg);
  }
  
  .scrollbar-right::-webkit-scrollbar {
    width: 8px;
  }
  
  .scrollbar-right::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .scrollbar-right::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  .scrollbar-right::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

// Insert the styles into the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = scrollbarStyles;
  document.head.appendChild(style);
}

export function PDFList({ 
  files, 
  selectedFile, 
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

  const handleAddNew = async () => {
    if (newFileName.trim()) {
      try {
        const result = await window.ipcRenderer.invoke("newCase", {
          name: newFileName.trim()
        });
        
        if (result.status === 'success') {
          const newFile = {
            id: result.id,
            name: newFileName.trim()
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
    setEditedFileName(file.name);
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

  const formatDate = (date) => {
    if (!date) return null;
    try {
      return new Date(date).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
        className={`group relative hover:bg-[#e1dfdd] ${isSelected ? 'bg-[#e5f1fb] hover:bg-[#e5f1fb]' : ''} ${
          isEditMode ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <button
          onClick={() => !isEditMode && !isEditing && onSelectFile(file)}
          className="w-full px-4 py-2.5 flex items-start transition-colors duration-300 focus:outline-none"
          disabled={isEditMode}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              e.currentTarget.blur();
            }
          }}
        >
          <div className="flex-1 min-w-0 text-right flex items-start">
            <FileText
              className={`flex-shrink-0 w-5 h-5 mt-1 ml-3 ${
                isSelected ? 'text-[#0078d4]' : 'text-[#605e5c] group-hover:text-[#0078d4]'
              } transition-colors duration-300`}
            />
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editedFileName}
                  onChange={(e) => setEditedFileName(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, file)}
                  className="w-full text-sm bg-transparent border-b border-[#0078d4] focus:outline-none px-1 text-right"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm font-medium text-[#323130] truncate">
                  {file.name}
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
              className="p-1 hover:bg-[#f3f2f1] transition-colors"
              title="שמור שינויים"
            >
              <Check className="w-4 h-4 text-[#0078d4]" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 hover:bg-[#f3f2f1] transition-colors"
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
              className="p-1 hover:bg-[#f3f2f1] transition-colors"
              title="אשר מחיקה"
            >
              <Check className="w-4 h-4 text-[#0078d4]" />
            </button>
            <button
              onClick={handleCancelDelete}
              className="p-1 hover:bg-[#f3f2f1] transition-colors"
              title="בטל"
            >
              <X className="w-4 h-4 text-[#a4262c]" />
            </button>
          </div>
        ) : !isEditMode && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            <button
              onClick={(e) => handleEditClick(file, e)}
              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-[#e1dfdd] transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:opacity-100"
              title="ערוך שם מסמך"
            >
              <Pencil className="w-4 h-4 text-[#0078d4]" />
            </button>
            <button
              onClick={(e) => handleDeleteClick(file.id, e)}
              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-[#e1dfdd] transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:opacity-100"
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
    <div className="h-full flex flex-col bg-[#faf9f8]">
      <div className="flex-1 overflow-y-auto scrollbar-right">
        <div className="scroll-content">
          <div className="px-3 py-2 sticky top-0 bg-[#faf9f8] z-10">
            {isAddingNew ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="הכנס שם מסמך"
                  className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-[#0078d4] text-sm focus:outline-none focus:ring-1 focus:ring-[#0078d4] text-right rounded"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNew();
                    if (e.key === 'Escape') {
                      setIsAddingNew(false);
                      setNewFileName('');
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleAddNew}
                  title="הוסף מסמך"
                  className="shrink-0 p-1.5 bg-[#0078d4] text-white hover:bg-[#106ebe] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2 rounded"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewFileName('');
                  }}
                  title="בטל"
                  className="shrink-0 p-1.5 border border-[#8a8886] text-[#323130] hover:bg-[#f3f2f1] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => !isEditMode && setIsAddingNew(true)}
                disabled={isEditMode}
                className={`w-3/4 mx-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-300 ${
                  isEditMode 
                    ? 'bg-transparent text-[#a19f9d] cursor-not-allowed opacity-50'
                    : 'bg-[#0078d4] text-white hover:bg-[#106ebe] focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2'
                }`}
              >
                <Plus className="w-4 h-4" />
                מסמך חדש
              </button>
            )}
          </div>
          <div className="pb-1">
            {reversedFiles.map(file => (
              <FileItem key={file.id} file={file} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}