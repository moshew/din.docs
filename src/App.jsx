import React, { useState, useEffect } from 'react';
import { PDFList } from './components/PDFList';
import { DocumentFiles } from './components/document/DocumentFiles';
import { PDFViewer } from './components/PDFViewer';
import { Scale, Search, Minus, Square, X, Settings, HelpCircle } from 'lucide-react';
import { getFileNameWithoutExt } from './utils/fileUtils';

export default function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState('w-[400px]');
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const result = await window.ipcRenderer.invoke("loadAll", null);
        if (result.status === 'success') {
          setFiles(result.cases);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setLoadError('שגיאה בטעינת המסמכים');
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    setSidebarWidth(sidebarCollapsed ? 'w-0' : 'w-[400px]');
  }, [sidebarCollapsed]);

  const handleSelectFile = async (file) => {
    if (isEditMode) return;
    
    try {
      setLoadError(null);
      const result = await window.ipcRenderer.invoke("loadCase", file.id);
      console.log('loadCase response:', JSON.stringify(result, null, 2));
      
      if (!result || result.status !== 'success' || !result.case) return;

      if (!result.case.files) return;

      // Get output path and updated timestamp from the normalized schema
      const outputPath = typeof result.case.path === 'string' && result.case.path ? result.case.path : null;
      const updatedDate = typeof result.case.updated === 'string' ? result.case.updated : undefined;

      const updatedFile = {
        id: file.id,
        title: result.case.title,
        updated_date: updatedDate,
        mainFile: result.case.files.main ? {
          name: getFileNameWithoutExt(result.case.files.main),
          path: result.case.files.main
        } : null,
        attachments: result.case.files.attachments ? result.case.files.attachments.map(attachment => ({
          name: attachment.title,
          path: attachment.path
        })) : [],
        outputFile: outputPath ? {
          name: getFileNameWithoutExt(outputPath),
          path: outputPath
        } : null
      };

      setFiles(prev => {
        if (prev.find(f => f.id === file.id)) {
          return prev.map(f => f.id === file.id ? {
            ...f,
            updated_date: updatedFile.updated_date
          } : f);
        }
        return [...prev, updatedFile];
      });
      
      // Avoid reloading PDF if same case and same output selected
      const isSameCase = selectedFile?.id === file.id;
      const isSameOutputPath = selectedPdf?.path && updatedFile.outputFile?.path && (selectedPdf.path === updatedFile.outputFile.path);

      setSelectedFile(updatedFile);
      if (!(isSameCase && isSameOutputPath)) {
        setSelectedPdf(updatedFile.outputFile);
      }
    } catch (error) {
      console.error('Failed to load case:', error);
    }
  };

  const handleDeleteFile = (fileId, event) => {
    event.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
      setSelectedPdf(null);
    }
  };

  const handleMainFileSelect = async (file) => {
    if (selectedFile) {
      const updatedFile = {
        ...selectedFile,
        mainFile: file
      };

      setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
      setSelectedFile(updatedFile);
    }
  };

  const handleAttachmentAdd = async (file) => {
    if (!selectedFile) return;
    const updatedFile = {
      ...selectedFile,
      attachments: [...selectedFile.attachments, file]
    };
    setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
    setSelectedFile(updatedFile);
  };

  const handleAttachmentRemove = async (index) => {
    if (selectedFile) {
      const updatedFile = {
        ...selectedFile,
        attachments: selectedFile.attachments.filter((_, i) => i !== index)
      };

      setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
      setSelectedFile(updatedFile);
      if (selectedPdf === selectedFile.attachments[index]) {
        setSelectedPdf(updatedFile.outputFile);
      }
    }
  };

  const handleAttachmentReorder = async (newAttachments) => {
    if (selectedFile) {
      const updatedFile = {
        ...selectedFile,
        attachments: newAttachments
      };

      setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
      setSelectedFile(updatedFile);
    }
  };

  const handleUpdateTitle = async (fileId, newTitle) => {
    try {
      await window.ipcRenderer.invoke('editCase', { id: fileId, title: newTitle });
    } catch (e) {
      // proceed with UI update even if persistence fails
    }
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, title: newTitle } : f));
    if (selectedFile?.id === fileId) {
      setSelectedFile(prev => ({ ...prev, title: newTitle }));
    }
  };

  const handleMainFileClick = (file, options = {}) => {
    if (!file) return;
    const { force = false } = options;
    // Prevent redundant reloads unless forced (e.g., after generation)
    if (!force && selectedPdf?.path === file.path) return;

    setSelectedPdf(file);
    if (file.updated_date && selectedFile) {
      setFiles(prev => prev.map(f => f.id === selectedFile.id ? {
        ...f,
        updated_date: file.updated_date
      } : f));
    }
  };

  const handleAttachmentClick = (attachment) => {
    if (!attachment) return;
    // Prevent redundant reloads if clicking the same attachment again
    if (selectedPdf?.path === attachment.path) return;
    setSelectedPdf(attachment);
  };

  return (
    <div className="h-screen flex flex-col bg-[#faf9f8]">
      <div className="bg-[#F4F8FE] border-b border-[#e1dfdd] shadow-sm">
        <div className="h-14 flex items-center pl-0 pr-0 relative">
          {/* Icon anchored to the left */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
            <Scale className="w-7 h-7 text-[#323130]" />
          </div>
          
          <div className="order-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-96 relative">
              <Search className="w-4 h-4 text-[#616161] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="חפש מסמכים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 bg-[#faf9f8] border border-[#e1dfdd] text-sm text-[#323130] placeholder-[#616161] focus:outline-none focus:bg-white focus:border-[#0078d4] transition-colors"
              />
            </div>
          </div>
          
          {/* Window controls anchored to the right, then a thin divider and title next to them */}
          <div className="absolute right-0 top-0 h-14 flex items-center select-none pr-0">
            <button
              className="w-12 h-14 transition-colors hover:bg-[#E81123] flex items-center justify-center group"
              title="סגור"
              onClick={() => window.ipcRenderer.invoke('window:close')}
            >
              <X className="w-4 h-4 text-[#323130] group-hover:text-white" />
            </button>
            <button
              className="w-12 h-14 transition-colors flex items-center justify-center opacity-50 cursor-not-allowed"
              title="מוגדל"
              disabled
            >
              <Square className="w-4 h-4 text-[#a0a0a0]" />
            </button>
            <button
              className="w-12 h-14 hover:bg-[#e1dfdd] transition-colors flex items-center justify-center"
              title="מזער"
              onClick={() => window.ipcRenderer.invoke('window:minimize')}
            >
              <Minus className="w-4 h-4 text-[#323130]" />
            </button>

            {/* Thin divider and title snug next to buttons */}
            <div className="h-6 w-px bg-[#e1dfdd] mx-2" />
            <span className="text-lg font-semibold text-[#323130] mr-2">דין.דוקס - הפקת וניהול מסמכים משפטיים</span>
            
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${sidebarWidth} bg-[#EFF4F9] transition-[width] duration-150 ease-out overflow-hidden border-l border-[#e1dfdd]`}>
          <PDFList
            files={files.filter(file => 
              (file.title || '').toLowerCase().includes(searchQuery.toLowerCase())
            )}
            selectedFile={selectedFile}
            onSelectFile={handleSelectFile}
            onDeleteFile={handleDeleteFile}
            onUpdateTitle={handleUpdateTitle}
            showAddNew={true}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
          />
        </div>
        {!selectedFile ? (
          <div className="flex-1 bg-white border-l border-[#e1dfdd] overflow-hidden transition-all duration-150 ease-out">
            <PDFViewer
              path={null}
              message="לא נבחר מסמך"
              subtitle="בחר מסמך מהרשימה כדי להתחיל"
            />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/3 bg-white border-l border-[#e1dfdd] overflow-hidden transition-all duration-150 ease-out">
              <DocumentFiles
                selectedFile={selectedFile}
                onMainFileSelect={handleMainFileSelect}
                onAttachmentAdd={handleAttachmentAdd}
                onAttachmentRemove={handleAttachmentRemove}
                onAttachmentReorder={handleAttachmentReorder}
                onMainFileClick={handleMainFileClick}
                onAttachmentClick={handleAttachmentClick}
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
              />
            </div>
            <div className="w-2/3 bg-white border-l border-[#e1dfdd] overflow-hidden transition-all duration-150 ease-out">
              <PDFViewer
                path={selectedPdf?.path || null}
                message={!selectedPdf && selectedFile ? 'לא נבחר קובץ לצפייה' : null}
              />
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}