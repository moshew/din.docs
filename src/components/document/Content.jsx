import React from 'react';
import { MainDocument } from '../MainDocument';
import { Attachments } from '../Attachments';

export function Content({
  selectedFile,
  onMainFileSelect,
  onAttachmentAdd,
  onAttachmentRemove,
  onAttachmentReorder,
  onMainFileClick,
  onAttachmentClick,
  isEditMode,
  setIsEditMode,
  dragOverMain,
  dragOverAttachments,
  onDragOver,
  onDragLeave,
  pendingAttachments
}) {
  return (
    <div className="flex-1 overflow-y-auto scrollable-container">
      <div className="p-3 space-y-6">
        <div className="pt-3">
          <h3 className="text-xs font-semibold text-[#605e5c] uppercase tracking-wider text-right mb-2">
            מסמך ראשי
          </h3>
          <div
            className={`p-3 border-2 border-dashed rounded-lg ${
              dragOverMain ? 'border-[#0078d4] bg-[#e5f1fb]' : 'border-[#e1dfdd]'
            } transition-colors`}
            onDragOver={(e) => onDragOver(e, 'main')}
            onDragLeave={(e) => onDragLeave(e, 'main')}
          >
            <MainDocument
              mainFile={selectedFile?.mainFile}
              onMainFileSelect={onMainFileSelect}
              onMainFileClick={onMainFileClick}
              dragOver={dragOverMain}
              disabled={isEditMode}
              selectedFile={selectedFile}
            />
          </div>
        </div>

        <div
          onDragOver={(e) => onDragOver(e, 'attachments')}
          onDragLeave={(e) => onDragLeave(e, 'attachments')}
        >
          <Attachments
            selectedFile={selectedFile}
            attachments={selectedFile?.attachments || []}
            onAttachmentAdd={onAttachmentAdd}
            onAttachmentRemove={onAttachmentRemove}
            onAttachmentReorder={onAttachmentReorder}
            onAttachmentClick={onAttachmentClick}
            dragOver={dragOverAttachments}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            pendingAttachments={pendingAttachments}
          />
        </div>
      </div>
    </div>
  );
}