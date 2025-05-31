import React, { useState, useEffect } from 'react';
import { PDFList } from './components/PDFList';
import { DocumentFiles } from './components/document/DocumentFiles';
import { PDFViewer } from './components/PDFViewer';
import { Scale, Search, Minus, Square, X, Settings, HelpCircle, Info } from 'lucide-react';

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
      
      if (!result || result.status !== 'success' || !result.case) {
        console.log('Invalid result structure:', result);
        setSelectedFile(file);
        setSelectedPdf(null);
        return;
      }

      if (!result.case.files) {
        console.log('Case has no files property:', result.case);
        setSelectedFile(file);
        setSelectedPdf(null);
        return;
      }

      const updatedFile = {
        id: file.id,
        name: result.case.name || file.name,
        updated_date: result.case.updated_date,
        mainFile: result.case.files.main ? {
          name: result.case.files.main.split('/').pop().replace(/\.[^/.]+$/, ''),
          path: result.case.files.main
        } : null,
        attachments: result.case.files.attachments ? result.case.files.attachments.map(attachment => ({
          name: attachment.title || attachment.path.split('/').pop().replace(/\.[^/.]+$/, ''),
          path: attachment.path
        })) : [],
        outputFile: result.case.files.output ? {
          name: result.case.files.output.path.split('/').pop().replace(/\.[^/.]+$/, ''),
          path: result.case.files.output.path,
          url: result.case.files.output.url,
          updated_date: result.case.files.output.updated
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
      
      setSelectedFile(updatedFile);
      setSelectedPdf(updatedFile.outputFile);
    } catch (error) {
      console.error('Failed to load case:', error);
      setSelectedFile(file);
      setSelectedPdf(null);
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
    if (selectedFile) {
      const updatedFile = {
        ...selectedFile,
        attachments: [...selectedFile.attachments, file]
      };

      setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
      setSelectedFile(updatedFile);
    }
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

  const handleUpdateTitle = (fileId, newTitle) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newTitle } : f));
    if (selectedFile?.id === fileId) {
      setSelectedFile(prev => ({ ...prev, name: newTitle }));
    }
  };

  const handleMainFileClick = (file) => {
    if (file) {
      setSelectedPdf(file);
      if (file.updated_date && selectedFile) {
        setFiles(prev => prev.map(f => f.id === selectedFile.id ? {
          ...f,
          updated_date: file.updated_date
        } : f));
      }
    }
  };

  const handleAttachmentClick = (attachment) => {
    setSelectedPdf(attachment);
  };

  return (
    <div className="h-screen flex flex-col bg-[#faf9f8]">
      <div className="bg-[#EFF4F9] border-b border-[#e1dfdd] shadow-sm">
        <div className="h-14 flex items-center px-3">
          <div className="flex items-center mr-3">
            <Scale className="w-6 h-6 text-[#323130] ml-4" />
            <span className="text-lg font-semibold text-[#323130]">דין.דוקס - הפקת וניהול מסמכים משפטיים</span>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative">
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
          
          <div className="flex items-center space-x-2 order-last">
            <button
              className="p-2 hover:bg-[#e1dfdd] transition-colors"
              title="מזער"
            >
              <Minus className="w-4 h-4 text-[#323130]" />
            </button>
            <button
              className="p-2 hover:bg-[#e1dfdd] transition-colors"
              title="הגדל"
            >
              <Square className="w-4 h-4 text-[#323130]" />
            </button>
            <button
              className="p-2 hover:bg-[#e1dfdd] transition-colors"
              title="סגור"
            >
              <X className="w-4 h-4 text-[#323130]" />
            </button>
            
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${sidebarWidth} bg-[#faf9f8] transition-[width] duration-150 ease-out overflow-hidden border-l border-[#e1dfdd]`}>
          <PDFList
            files={files.filter(file => 
              file.name?.toLowerCase().includes(searchQuery.toLowerCase())
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

      <div className="h-6 bg-[#EFF4F9] border-t border-[#e1dfdd] px-3 flex items-center justify-between text-xs text-[#323130]">
        <div className="flex items-center space-x-4">
          {selectedFile && (
            <span className="flex items-center">
              <Info className="w-3.5 h-3.5 mr-1.5" />
              {`${selectedFile.name} - ${selectedFile.mainFile ? Math.round(selectedFile.mainFile.size / 1024) : 0} KB`}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="p-1 hover:bg-[#e1dfdd] transition-colors"
            title="הגדרות"
          >
            <Settings className="w-3.5 h-3.5 text-[#323130]" />
          </button>
          <button
            className="p-1 hover:bg-[#e1dfdd] transition-colors"
            title="עזרה"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#323130]" />
          </button>
        </div>
      </div>
    </div>
  );
}