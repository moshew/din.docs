import React from 'react';
import { DocumentFiles } from './document/DocumentFiles';
import { PDFViewer } from './PDFViewer';

export function Workspace({
  selectedFile,
  selectedPdf,
  onMainFileSelect,
  onAttachmentAdd,
  onAttachmentRemove,
  onAttachmentReorder,
  onMainFileClick,
  onAttachmentClick,
  isEditMode,
  setIsEditMode,
}) {
  return (
    <div className="flex-1 flex flex-col mt-[8px] mx-[8px] mb-0 bg-[#E5E5E5] rounded-t-lg overflow-hidden border border-[#e1dfdd]">
      {/* Shared header */}
      <div className="h-10 flex items-center px-3 border-b border-[#e1dfdd] bg-[#FBFDFF]">
        <h2 className="text-base font-semibold text-[#323130] truncate">
          {selectedFile?.title || 'מסמך'}
        </h2>
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="w-1/3 bg-white border-l border-[#e1dfdd] overflow-hidden">
          <DocumentFiles
            selectedFile={selectedFile}
            onMainFileSelect={onMainFileSelect}
            onAttachmentAdd={onAttachmentAdd}
            onAttachmentRemove={onAttachmentRemove}
            onAttachmentReorder={onAttachmentReorder}
            onMainFileClick={onMainFileClick}
            onAttachmentClick={onAttachmentClick}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
          />
        </div>
        <div className="w-2/3 bg-white overflow-hidden min-h-0 h-full flex flex-col">
          <PDFViewer path={selectedPdf?.path || null} />
        </div>
      </div>
    </div>
  );
}

