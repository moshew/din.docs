import { useState, useEffect } from 'react';
import { path } from '../../utils/pathUtils';
import { getFileNameWithoutExt, isValidDocumentFile } from '../../utils/fileUtils';

export function useDocumentFiles({ 
  selectedFile, 
  onMainFileSelect, 
  onMainFileClick, 
  onAttachmentAdd,
  onAttachmentReorder,
  onAttachmentRemove,
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
  const [dropTarget, setDropTarget] = useState(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isSelectingFiles, setIsSelectingFiles] = useState(false);

  useEffect(() => {
    setPendingAttachments([]);
  }, [selectedFile]);

  useEffect(() => {
    const handleProgress = (event) => {
      const { detail } = event;
      setProgressMessage(detail.message || '');
      setProgressStep(detail.step || 0);
      setProgressTotal(detail.total || 0);
      setCurrentPhase(detail.phase || null);
      setCurrentFile(detail.file || null);
    };

    const handleFinished = async (event) => {
      const { detail } = event;
      try {
        if (detail.status === 'error') {
          setError(detail.error?.message || 'אירעה שגיאה בעת יצירת ה-PDF');
        } else if (detail.status === 'success' && detail.output) {
          if (selectedFile) {
            const updatedCase = {
              id: selectedFile.id,
              title: selectedFile.title,
              path: detail.output.path,
              updated: detail.output.updated,
              files: {
                main: selectedFile.mainFile?.path || null,
                attachments: selectedFile.attachments.map(att => ({
                  path: att.path,
                  title: att.name
                }))
              }
            };

            await window.ipcRenderer.invoke("saveCase", updatedCase);

            onMainFileClick({
              name: getFileNameWithoutExt(detail.output.path),
              path: detail.output.path,
              url: detail.output.url,
              updated_date: detail.output.updated
            }, { force: true });
          }
        }
      } catch (error) {
        console.error('Failed to handle PDF generation:', error);
        setError('שגיאה בשמירת מידע המסמך');
      } finally {
        setTimeout(() => {
          setIsProgressModalOpen(false);
          setError(null);
          setCurrentPhase(null);
          setCurrentFile(null);
          setProcessing(false);
        }, 250);
      }
    };

    const cleanupProgress = window.ipcRenderer.getProcStatus(handleProgress);
    const cleanupFinished = window.ipcRenderer.procFinished(handleFinished);

    return () => {
      cleanupProgress();
      cleanupFinished();
    };
  }, [selectedFile, onMainFileClick]);

  useEffect(() => {
    const handleFileDrop = (files) => {
      const currentTarget = dropTarget;
      clearDropStates();

      const validFiles = files.filter(file => isValidDocumentFile(file.name));
      if (validFiles.length === 0) return;

      if (currentTarget === 'main') {
        const file = validFiles[0];
        onMainFileSelect({
          name: getFileNameWithoutExt(file.path),
          path: file.path
        });
      } else if (currentTarget === 'attachments') {
        const fileDataArray = validFiles.map(file => ({
          name: getFileNameWithoutExt(file.path),
          path: file.path
        }));

        const newFiles = fileDataArray.filter(file => 
          !selectedFile?.attachments.some(att => att.path === file.path)
        );

        if (newFiles.length > 0) {
          setPendingAttachments(newFiles);
          setIsEditMode(true);
        }
      }
    };

    const cleanup = window.ipcRenderer.onFileDrop(handleFileDrop);
    return cleanup;
  }, [dropTarget, onMainFileSelect, setIsEditMode, selectedFile]);

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

  const clearDropStates = () => {
    setDropTarget(null);
    setDragOverMain(false);
    setDragOverAttachments(false);
  };

  const handleDragOver = (e, section) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(section);
    if (section === 'main') {
      setDragOverMain(true);
    } else if (section === 'attachments') {
      setDragOverAttachments(true);
    }
  };

  const handleDragLeave = (e, section) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    if (section === 'main') {
      setDragOverMain(false);
    } else if (section === 'attachments') {
      setDragOverAttachments(false);
    }
  };

  const handleAttachmentAdd = async () => {
    if (isSelectingFiles) return;

    try {
      setIsSelectingFiles(true);
      const files = await window.ipcRenderer.invoke("fileDialog", { type: 'attachments' });
      
      if (!files || files.length === 0) return;

      const fileDataArray = files
        .filter(filePath => {
          const exists = selectedFile?.attachments.some(att => att.path === filePath);
          return !exists && isValidDocumentFile(filePath);
        })
        .map(filePath => ({
          name: getFileNameWithoutExt(filePath),
          path: filePath
        }));

      if (fileDataArray.length > 0) {
        setPendingAttachments(fileDataArray);
        setIsEditMode(true);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    } finally {
      setIsSelectingFiles(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedFile?.mainFile) return;
    
    try {
      if (!selectedFile.mainFile.path) {
        throw new Error('נתיב המסמך הראשי חסר');
      }
      
      setProcessing(true);
      setError(null);
      await checkFilesAndHandleMissing();
    } catch (error) {
      console.error('Error during file check:', error);
      setError(error.message || 'שגיאה בעיבוד הקבצים');
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
              title: att.name
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
        setProcessing(false);
        return false;
      }

      const newOutputPath = await window.ipcRenderer.invoke("fileDialog", {
        type: 'output',
        defaultPath: path.join('', 'כתב טענות.pdf')
      });

      if (!newOutputPath) {
        setProcessing(false);
        return false;
      }

      setProgressStep(0);
      setProgressTotal(0);
      setProgressMessage('');
      setIsProgressModalOpen(true);

      await window.ipcRenderer.invoke("generatePdf", {
        main: selectedFile.mainFile.path,
        attachments: selectedFile.attachments.map(att => ({
          path: att.path,
          title: att.name
        })),
        output: {
          path: newOutputPath
        },
        isDraft
      });
      
      return true;
    } catch (error) {
      setProcessing(false);
      throw error;
    }
  };

  const handlePathCorrection = async ({ fixedPath, applyForAll }) => {
    setIsModalOpen(false);
    
    try {
      if (selectedFile) {
        const updatedFiles = {
          main: selectedFile.mainFile?.path === missingPath 
            ? { name: getFileNameWithoutExt(fixedPath), path: fixedPath }
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
            name: getFileNameWithoutExt(fixedPath),
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

  return {
    state: {
      dragOverMain,
      dragOverAttachments,
      isModalOpen,
      isProgressModalOpen,
      progressMessage,
      progressStep,
      progressTotal,
      missingPath,
      missingFile,
      processing,
      isDraft,
      error,
      currentPhase,
      currentFile,
      pendingAttachments
    },
    handlers: {
      handleDragOver,
      handleDragLeave,
      handleAttachmentAdd,
      handleCreate,
      handlePathCorrection,
      setIsDraft,
      setIsModalOpen
    }
  };
}