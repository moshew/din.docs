import React, { useState, useEffect } from 'react';
import { MainDocument } from './MainDocument';
import { Attachments } from './Attachments';
import { FileCheckModal } from './FileCheckModal';
import { ProgressModal } from './ProgressModal';
import { path } from '../utils/pathUtils';

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
  const [dragOverMain, setDragOverMain] = useState(false);
  const [dragOverAttachments, setDragOverAttachments] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressStep, setProgressStep] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [missingPath, setMissingPath] = useState(null);
  const [missingFile, setMissingFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [error, setError] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);

  useEffect(() => {
    const handleProgress = (event) => {
      const { detail } = event;
      setProgressMessage(detail.message || '');
      setProgressStep(detail.step || 0);
      setProgressTotal(detail.total || 0);
      setCurrentPhase(detail.phase || null);
      setCurrentFile(detail.file || null);
    };

    const cleanup = window.ipcRenderer.getProcStatus(handleProgress);
    return () => cleanup();
  }, []);

  useEffect(() => {
    const handleFinished = (event) => {
      const { detail } = event;
      if (detail.status === 'error') {
        setError(detail.error?.message || 'אירעה שגיאה בעת יצירת ה-PDF');
      } else if (detail.status === 'success' && detail.file) {
        onMainFileClick({
          name: detail.file.name,
          path: detail.file.path,
          url: detail.file.url
        });
      }
      
      setTimeout(() => {
        setIsProgressModalOpen(false);
        setError(null);
        setCurrentPhase(null);
        setCurrentFile(null);
      }, 250);
    };

    const cleanup = window.ipcRenderer.procFinished(handleFinished);
    return () => cleanup();
  }, [onMainFileClick]);

  useEffect(() => {
    if (!isProgressModalOpen) {
      setProgressMessage('');
      setProgressStep(0);
      setProgressTotal(0);
      setError(null);
      setCurrentPhase(null);
      setCurrentFile(null);
    }
  }, [isProgressModalOpen]);

  const getFileNameFromPath = (filePath) => {
    if (!filePath) return '';
    const fileName = filePath.split('/').pop();
    return fileName.replace(/\.[^/.]+$/, '');
  };

  const handleDragOver = (e, section) => {
    e.preventDefault();
    e.stopPropagation();
    if (section === 'main') {
      setDragOverMain(true);
    } else if (section === 'attachments') {
      setDragOverAttachments(true);
    }
  };

  const handleDragLeave = (e, section) => {
    e.preventDefault();
    e.stopPropagation();
    if (section === 'main') {
      setDragOverMain(false);
    } else if (section === 'attachments') {
      setDragOverAttachments(false);
    }
  };

  const handleDrop = (e, section) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragOverMain(false);
    setDragOverAttachments(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files)
      .filter(file => file.type === 'application/pdf');
    
    if (droppedFiles.length > 0) {
      if (section === 'main') {
        const file = droppedFiles[0];
        onMainFileSelect({
          name: getFileNameFromPath(file.path),
          path: file.path
        });
      } else if (section === 'attachments') {
        handleAttachmentsAdd(droppedFiles);
      }
    }
  };

  const handleAttachmentsAdd = (files) => {
    if (!Array.isArray(files)) {
      files = [files];
    }

    const fileDataArray = files
      .filter(file => file instanceof File)
      .map(file => ({
        name: getFileNameFromPath(file.path),
        path: file.path
      }));

    fileDataArray.forEach(fileData => {
      onAttachmentAdd(fileData);
    });
  };

  const handleCreate = async () => {
    if (!selectedFile?.mainFile) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      await checkFilesAndHandleMissing();
    } catch (error) {
      console.error('Error during file check:', error);
      setError(error.message || 'שגיאה בעיבוד הקבצים');
    } finally {
      setProcessing(false);
    }
  };

  const checkFilesAndHandleMissing = async (reCheck = null) => {
    if (!selectedFile) {
      throw new Error('לא נבחר מסמך');
    }

    try {
      const result = await window.ipcRenderer.invoke("checkCase", {
        case: {
          id: selectedFile.id,
          title: selectedFile.title,
          files: {
            main: selectedFile.mainFile.path,
            attachments: selectedFile.attachments.map(att => ({
              path: att.path,
              name: att.name
            }))
          }
        },
        reCheck
      });
      
      if (result.missingPath) {
        if (selectedFile.mainFile.path === result.missingPath) {
          setMissingFile(selectedFile.mainFile);
        } else {
          const missingAttachment = selectedFile.attachments.find(att => att.path === result.missingPath);
          setMissingFile(missingAttachment);
        }
        setMissingPath(result.missingPath);
        setIsModalOpen(true);
        return false;
      }

      const outputPath = await window.ipcRenderer.invoke("fileDialog", {
        type: 'output',
        defaultPath: path.join('', 'כתב טענות.pdf')
      });

      if (!outputPath) {
        return false;
      }

      setProgressStep(0);
      setProgressTotal(0);
      setProgressMessage('');
      setIsProgressModalOpen(true);

      try {
        await window.ipcRenderer.invoke("generatePdf", {
          main: selectedFile.mainFile.path,
          attachments: selectedFile.attachments.map(att => ({
            path: att.path,
            name: att.name
          })),
          output: outputPath,
          isDraft
        });
        return true;
      } catch (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  };

  const handlePathCorrection = async ({ fixedPath, applyForAll }) => {
    setIsModalOpen(false);
    
    try {
      if (selectedFile) {
        const updatedFiles = {
          main: selectedFile.mainFile?.path === missingPath 
            ? { name: getFileNameFromPath(fixedPath), path: fixedPath }
            : selectedFile.mainFile,
          attachments: selectedFile.attachments.map(att => 
            att.path === missingPath
              ? { ...att, path: fixedPath }
              : att
          )
        };

        await window.ipcRenderer.invoke("saveCase", {
          id: selectedFile.id,
          files: updatedFiles
        });

        if (selectedFile.mainFile?.path === missingPath) {
          onMainFileSelect({
            name: getFileNameFromPath(fixedPath),
            path: fixedPath
          });
        } else {
          const attachmentIndex = selectedFile.attachments.findIndex(att => att.path === missingPath);
          if (attachmentIndex !== -1) {
            const updatedAttachment = {
              ...selectedFile.attachments[attachmentIndex],
              path: fixedPath
            };
            onAttachmentReorder([
              ...selectedFile.attachments.slice(0, attachmentIndex),
              updatedAttachment,
              ...selectedFile.attachments.slice(attachmentIndex + 1)
            ]);
          }
        }
      }

      const success = await checkFilesAndHandleMissing({
        applyForAll,
        fixedPath
      });
      
      if (!success) {
        return;
      }
    } catch (error) {
      console.error('Error checking files:', error);
      setError('שגיאה בעדכון מיקום הקובץ');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-10 flex items-center px-3 border-b border-[#e1dfdd] bg-white">
        <h2 className="text-base font-semibold text-[#323130] truncate">
          {selectedFile?.title}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#605e5c] uppercase tracking-wider">
              מסמך ראשי
            </h3>
            <div
              className={`p-3 border-2 border-dashed rounded-lg ${
                dragOverMain ? 'border-[#0078d4] bg-[#e5f1fb]' : 'border-[#e1dfdd]'
              } transition-colors`}
              onDragOver={(e) => handleDragOver(e, 'main')}
              onDragLeave={(e) => handleDragLeave(e, 'main')}
              onDrop={(e) => handleDrop(e, 'main')}
            >
              <MainDocument
                mainFile={selectedFile?.mainFile}
                onMainFileSelect={onMainFileSelect}
                onMainFileClick={onMainFileClick}
                dragOver={dragOverMain}
                disabled={isEditMode}
              />
            </div>
          </div>

          <div
            onDragOver={(e) => handleDragOver(e, 'attachments')}
            onDragLeave={(e) => handleDragLeave(e, 'attachments')}
            onDrop={(e) => handleDrop(e, 'attachments')}
          >
            <Attachments
              attachments={selectedFile?.attachments || []}
              onAttachmentAdd={handleAttachmentsAdd}
              onAttachmentRemove={onAttachmentRemove}
              onAttachmentReorder={onAttachmentReorder}
              onAttachmentClick={onAttachmentClick}
              dragOver={dragOverAttachments}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
            />
          </div>
        </div>
      </div>

      <div className="p-2 bg-white space-y-2">
        <label className="flex items-center space-x-2 text-sm text-[#323130] px-1">
          <input
            type="checkbox"
            checked={isDraft}
            onChange={(e) => setIsDraft(e.target.checked)}
            className="rounded border-gray-300 text-[#0078d4] focus:ring-[#0078d4]"
          />
          <span>סמן כטיוטה</span>
        </label>
        <button
          className="w-full px-4 py-1.5 bg-[#0078d4] text-white rounded-md hover:bg-[#106ebe] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedFile?.mainFile || isEditMode || processing}
          onClick={handleCreate}
        >
          {processing ? 'מעבד...' : 'צור'}
        </button>
      </div>

      <FileCheckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        missingPath={missingPath}
        documentName={missingFile?.name || 'מסמך'}
        onPathCorrection={handlePathCorrection}
      />

      <ProgressModal
        isOpen={isProgressModalOpen}
        message={progressMessage}
        step={progressStep}
        total={progressTotal}
        error={error}
        phase={currentPhase}
        file={currentFile}
      />
    </div>
  );
}