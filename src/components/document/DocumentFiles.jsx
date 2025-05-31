import React from 'react';
import { Header } from './Header';
import { Content } from './Content';
import { Footer } from './Footer';
import { FileCheckModal } from '../FileCheckModal';
import { ProgressModal } from '../ProgressModal';
import { useDocumentFiles } from './useDocumentFiles';

export function DocumentFiles({ 
  selectedFile,
  onMainFileSelect, 
  onAttachmentAdd, 
  onAttachmentRemove, 
  onAttachmentReorder,
  onMainFileClick,
  onAttachmentClick,
  isEditMode, 
  setIsEditMode 
}) {
  const { state, handlers } = useDocumentFiles({
    selectedFile,
    onMainFileSelect,
    onMainFileClick,
    onAttachmentAdd,
    onAttachmentReorder,
    onAttachmentRemove,
    setIsEditMode
  });

  return (
    <div className="h-full flex flex-col">
      <Header title={selectedFile?.name} />

      <Content
        selectedFile={selectedFile}
        onMainFileSelect={onMainFileSelect}
        onAttachmentAdd={handlers.handleAttachmentAdd}
        onAttachmentRemove={onAttachmentRemove}
        onAttachmentReorder={onAttachmentReorder}
        onMainFileClick={onMainFileClick}
        onAttachmentClick={onAttachmentClick}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        dragOverMain={state.dragOverMain}
        dragOverAttachments={state.dragOverAttachments}
        onDragOver={handlers.handleDragOver}
        onDragLeave={handlers.handleDragLeave}
        pendingAttachments={state.pendingAttachments}
      />

      <Footer
        isDraft={state.isDraft}
        setIsDraft={handlers.setIsDraft}
        onCreateClick={handlers.handleCreate}
        disabled={!selectedFile?.mainFile || isEditMode}
        processing={state.processing}
      />

      <FileCheckModal
        isOpen={state.isModalOpen}
        onClose={() => handlers.setIsModalOpen(false)}
        missingPath={state.missingPath}
        documentName={state.missingFile?.name || 'מסמך'}
        onPathCorrection={handlers.handlePathCorrection}
      />

      <ProgressModal
        isOpen={state.isProgressModalOpen}
        message={state.progressMessage}
        step={state.progressStep}
        total={state.progressTotal}
        error={state.error}
        phase={state.currentPhase}
        file={state.currentFile}
        selectedFile={selectedFile}
      />
    </div>
  );
}