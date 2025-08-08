import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Upload } from 'lucide-react';
import { FastScrollPDF } from 'react-fast-scroll-pdf';

// Fast PDF viewer styles - optimized for performance
const pdfViewerStyles = `
  .fast-pdf-container {
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  .fast-pdf-container::-webkit-scrollbar {
    width: 8px;
  }
  
  .fast-pdf-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .fast-pdf-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  .fast-pdf-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

// Insert the styles into the document head
if (typeof document !== 'undefined' && !document.querySelector('#pdf-viewer-styles')) {
  const style = document.createElement('style');
  style.id = 'pdf-viewer-styles';
  style.textContent = pdfViewerStyles;
  document.head.appendChild(style);
}

const EmptyState = ({ message, subtitle, onSelect }) => (
  <div className="h-full flex flex-col items-center justify-center bg-[#faf9f8] p-6">
    <FileText className="w-16 h-16 text-[#c8c6c4] mb-6" />
    <p className="text-xl font-medium text-[#323130] mb-3 text-center">
      {message || 'לא נבחר מסמך'}
    </p>
    <p className="text-sm text-[#605e5c] mb-5 text-center">
      {subtitle || 'בחר מסמך מהרשימה או העלה קובץ חדש'}
    </p>
    {onSelect && (
      <button
        onClick={onSelect}
        className="px-4 py-2 bg-[#0078d4] text-white rounded hover:bg-[#106ebe] transition-colors flex items-center gap-2"
      >
        <Upload className="w-4 h-4" />
        <span>בחר קובץ PDF</span>
      </button>
    )}
  </div>
);

const ErrorState = ({ error, subtitle, onRetry }) => (
  <div className="h-full flex flex-col items-center justify-center bg-[#faf9f8] p-6">
    <div className="p-4 bg-[#FDE7E9] rounded-full mb-4">
      <FileText className="w-12 h-12 text-[#A4262C]" />
    </div>
    <p className="text-xl font-medium text-[#323130] mb-2 text-center">{error}</p>
    {subtitle && <p className="text-sm text-[#605e5c] mb-5 text-center">{subtitle}</p>}
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-[#0078d4] text-white rounded hover:bg-[#106ebe] transition-colors"
      >
        נסה שוב
      </button>
    )}
  </div>
);

export function PDFViewer({ path, message, onFileSelect }) {
  const [pdfSource, setPdfSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const urlRef = useRef(null);

  // Debug logs removed for production

  
  // Load PDF when path changes - keep iframe stable
  useEffect(() => {
    let isMounted = true;

    const loadPdf = async () => {
      
      if (!path) {
        if (isMounted) {
          // Clean up previous URL
          if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
            urlRef.current = null;
          }
          setPdfSource(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        // Load PDF data with timeout
        const pdfData = await Promise.race([
          window.ipcRenderer.invoke("getPdf", path),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PDF loading timeout')), 10000)
          )
        ]);
        
        if (!pdfData || !isMounted) return;

        // Clean up previous URL
        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current);
        }

        // Create source for FastScrollPDF
        
        // FastScrollPDF accepts Uint8Array directly - no blob URL needed!
        const sourceOptions = {
          data: new Uint8Array(pdfData)
        };
        
        setPdfSource(sourceOptions);
        setLoading(false);
        setError(null);
        
      } catch (error) {
        console.error('Error loading PDF:', error);
        
        if (isMounted) {
          // Check for specific errors that should hide PDFViewer
          const errorMessage = error.message || error.toString() || '';
          
          if (errorMessage.includes("reading 'files'") || 
              errorMessage.includes("loadCase") ||
              errorMessage.includes("timeout")) {
            // Hide viewer for handled errors
            setPdfSource(null);
            setError(null);
            setLoading(false);
            return;
          }
          
          setError('שגיאה בטעינת קובץ PDF');
          setPdfSource(null);
          setLoading(false);
        }
      }
    };

    loadPdf();
    
    return () => {
      isMounted = false;
    };
  }, [path]);

  // Clean up URL when component unmounts
  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);



  // Show loading/error states when needed, otherwise show PDF
  if (!path) {
    return <EmptyState message={message} onSelect={onFileSelect} />;
  }
  
  if (error) {
    return (
      <ErrorState 
        error={error}
        subtitle="לא ניתן לגשת לקובץ PDF המבוקש או שהוא אינו קיים"
        onRetry={() => {
          window.location.reload();
        }}
      />
    );
  }

  if (loading) {
    return <EmptyState message="טוען PDF..." />;
  }

  // Render Fast PDF viewer - much faster than react-pdf
  return (
    <div className="h-full w-full bg-[#faf9f8] fast-pdf-container">
      {pdfSource && (
        <FastScrollPDF 
          source={pdfSource}
          enableAnnotations={true}
          className="fast-pdf-viewer"
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
}