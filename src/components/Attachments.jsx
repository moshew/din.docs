import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Pencil, Check, X, GripVertical, Trash2 } from 'lucide-react';
import { truncateFileName, getFileNameWithoutExt } from '../utils/fileUtils';

export function Attachments({ 
  selectedFile,
  attachments, 
  onAttachmentAdd, 
  onAttachmentRemove, 
  onAttachmentReorder, 
  onAttachmentClick,
  dragOver, 
  isEditMode, 
  setIsEditMode,
  pendingAttachments = []
}) {
  const [editedAttachments, setEditedAttachments] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const inputRefs = useRef({});
  const originalAttachments = useRef([]);

  useEffect(() => {
    if (isEditMode) {
      const newAttachments = [...attachments, ...pendingAttachments];
      setEditedAttachments(newAttachments);
      originalAttachments.current = [...attachments];
    } else {
      setEditedAttachments([]);
      originalAttachments.current = [];
    }
  }, [isEditMode, attachments, pendingAttachments]);

  const handleFileSelect = (e) => {
    e.preventDefault();
    if (isEditMode) return;
    onAttachmentAdd();
  };

  const getFileIcon = (filename) => {
    const extension = filename?.toLowerCase().split('.').pop();
    return <FileText className={`w-4 h-4 ${extension === 'pdf' ? 'text-[#E44D26]' : 'text-[#2B579A]'} flex-shrink-0 ml-3`} />;
  };

  const handleEditName = (index, name) => {
    setIsEditing(true);
    setEditedAttachments(prev => {
      const newAttachments = [...prev];
      newAttachments[index] = { ...newAttachments[index], name };
      return newAttachments;
    });
  };

  const handleSaveEdits = async () => {
    try {
      if (selectedFile) {
        const result = await window.ipcRenderer.invoke("saveCase", {
          id: selectedFile.id,
          title: selectedFile.title,
          files: {
            main: selectedFile.mainFile?.path || null,
            attachments: editedAttachments.map(att => ({
              path: att.path,
              title: att.name
            }))
          }
        });

        if (result.status === 'success') {
          onAttachmentReorder(editedAttachments);
          setIsEditMode(false);
          setIsEditing(false);
          originalAttachments.current = [];
        }
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  };

  const handleCancelEdits = () => {
    onAttachmentReorder(originalAttachments.current);
    setIsEditMode(false);
    setIsEditing(false);
    setEditedAttachments([]);
    originalAttachments.current = [];
  };

  const handleEditModeToggle = () => {
    if (!isEditMode) {
      setEditedAttachments([...attachments]);
      originalAttachments.current = [...attachments];
      setIsEditMode(true);
    }
  };

  const handleDragStart = (e, index, fromHandle) => {
    if (!isEditMode || !fromHandle || isEditing) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditMode || isEditing || draggedIndex === null || draggedIndex === index) return;
    
    const newAttachments = [...editedAttachments];
    const [draggedItem] = newAttachments.splice(draggedIndex, 1);
    newAttachments.splice(index, 0, draggedItem);
    
    setEditedAttachments(newAttachments);
    setDraggedIndex(index);
  };

  const handleDragEnd = (e) => {
    e.stopPropagation();
    setDraggedIndex(null);
  };

  const handleAttachmentRemove = (index) => {
    setEditedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      handleSaveEdits();
    } else if (e.key === 'Escape') {
      handleCancelEdits();
    }
  };

  const handleInputFocus = () => {
    setIsEditing(true);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
  };

  const displayAttachments = isEditMode ? editedAttachments : attachments;

  const renderAttachment = (file, index) => {
    const isDragging = draggedIndex === index;
    
    return (
      <div
        key={`attachment-${index}`}
        className={`group relative ${isEditMode ? '' : 'cursor-pointer hover:bg-white'} ${isDragging ? 'opacity-50' : ''}`}
        onClick={() => !isEditMode && onAttachmentClick(file)}
        draggable={isEditMode && !isEditing}
        onDragStart={(e) => handleDragStart(e, index, false)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <div className="flex items-center p-1">
          {isEditMode && (
            <button
              className="flex-shrink-0 mr-2 cursor-move"
              draggable
              onDragStart={(e) => handleDragStart(e, index, true)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4 text-[#605e5c]" />
            </button>
          )}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {!isEditMode && (
              <div className="flex-shrink-0">
                {getFileIcon(file.path)}
              </div>
            )}
            {isEditMode ? (
              <div className="flex-1">
                <input
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  value={file.name}
                  onChange={(e) => handleEditName(index, e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, index)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="w-full text-sm bg-transparent border-b border-[#0078d4] focus:outline-none focus:bg-transparent px-1 text-[#323130]"
                  title={file.name}
                  dir="ltr"
                />
              </div>
            ) : (
              <span
                className="text-sm text-[#323130] truncate"
                title={`${file.name}\nנתיב: ${file.path}`}
              >
                {truncateFileName(file.name)}
              </span>
            )}
          </div>
          {isEditMode && (
            <button
              onClick={() => handleAttachmentRemove(index)}
              className="p-1 hover:bg-[#f3f2f1] transition-colors ml-2"
              title="מחק נספח"
            >
              <Trash2 className="w-4 h-4 text-[#a4262c]" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[#605e5c] uppercase tracking-wider">
          נספחים
        </h3>
        {(attachments.length > 0 || isEditMode) && (
          isEditMode ? (
            <div className="flex items-center space-x-1">
              <button
                onClick={handleSaveEdits}
                className="p-1 hover:bg-[#f3f2f1] transition-colors"
                title="אשר שינויים"
              >
                <Check className="w-4 h-4 text-[#0078d4]" />
              </button>
              <button
                onClick={handleCancelEdits}
                className="p-1 hover:bg-[#f3f2f1] transition-colors"
                title="בטל שינויים"
              >
                <X className="w-4 h-4 text-[#a4262c]" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleEditModeToggle}
              className="p-1 hover:bg-[#f3f2f1] transition-colors"
              title="ערוך נספחים"
            >
              <Pencil className="w-4 h-4 text-[#0078d4]" />
            </button>
          )
        )}
      </div>
      <div className="space-y-0.5">
        {displayAttachments.map((file, index) => renderAttachment(file, index))}
      </div>
      {!isEditMode && (
        <div className={`p-3 border-2 border-dashed rounded-lg ${dragOver ? 'border-[#0078d4] bg-[#e5f1fb]' : 'border-[#e1dfdd]'} transition-colors mt-2`}>
          <button
            onClick={handleFileSelect}
            className="flex flex-col items-center cursor-pointer w-full"
          >
            <div className="mb-2">
              <Plus className="w-6 h-6 text-[#0078d4]" />
            </div>
            <span className="text-sm text-[#605e5c] text-center mb-1">
              גרור ושחרר נספחים לכאן או לחץ לבחירה
            </span>
            <span className="text-xs text-[#605e5c]">
              תבניות נתמכות: PDF, DOCX
            </span>
          </button>
        </div>
      )}
    </div>
  );
}