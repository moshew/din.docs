import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload } from 'lucide-react';

// Add custom CSS for PDF animation
const pdfAnimationStyles = `
  @keyframes slideInPDF {
    0% {
      transform: translateX(12px);
      opacity: 0;
    }
    100% {
      transform: translateX(0px);
      opacity: 1;
    }
  }

  .pdf-slide-in {
    /* Start in the initial animation state */
    transform: translateX(12px);
    opacity: 0;
    animation: slideInPDF 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  .pdf-iframe {
    width: 100%;
    height: 100%;
    border: none;
    /* Force scrollbar to always be visible */
    overflow-y: scroll !important;
  }

  .pdf-viewer-container {
    /* Force scrollbar space to always be reserved */
    overflow-y: scroll;
  }

  .pdf-viewer-container::-webkit-scrollbar,
  .pdf-iframe::-webkit-scrollbar {
    width: 8px;
  }
  
  .pdf-viewer-container::-webkit-scrollbar-track,
  .pdf-iframe::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .pdf-viewer-container::-webkit-scrollbar-thumb,
  .pdf-iframe::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  .pdf-viewer-container::-webkit-scrollbar-thumb:hover,
  .pdf-iframe::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

// Insert the styles into the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = pdfAnimationStyles;
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

const LoadingState = () => (
  <div className="h-full flex items-center justify-center bg-[#faf9f8]">
    <div className="text-center">
      <div className="inline-block w-16 h-16 border-4 border-[#e1dfdd] border-t-[#0078d4] rounded-full animate-spin mb-4"></div>
      <p className="text-lg text-[#323130]">טוען PDF...</p>
    </div>
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
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);
  const previousPathRef = useRef(null);
  
  // Load PDF when path changes
  useEffect(() => {
    let isMounted = true;

    const loadPdf = async () => {
      if (!path) {
        if (isMounted) {
          setPdfUrl(null);
          setError(null);
          setLoading(false);
          previousPathRef.current = null;
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('PDF loading timeout')), 10000);
        });
        
        // Load PDF data with timeout
        const pdfData = await Promise.race([
          window.ipcRenderer.invoke("getPdf", path),
          timeoutPromise
        ]);
        
        if (!pdfData) {
          if (isMounted) {
            console.log('No PDF data returned - hiding PDFViewer');
            setPdfUrl(null);
            setError(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          // Create blob URL for the PDF
          const blob = new Blob([pdfData], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          // Clean up previous URL
          if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
          }
          
          // Check if switching from another PDF for animation
          const isSwitch = previousPathRef.current && previousPathRef.current !== path;
          
          if (isSwitch) {
            // Animate transition
            setAnimationKey(prev => prev + 1);
            setTimeout(() => {
              setPdfUrl(url);
              setLoading(false);
              setError(null);
            }, 30);
          } else {
            // No animation for first load
            setPdfUrl(url);
            setLoading(false);
            setError(null);
          }
          
          previousPathRef.current = path;
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
        
        if (isMounted) {
          // Check for specific errors that should hide PDFViewer
          const errorMessage = error.message || error.toString() || '';
          
          if (errorMessage.includes("reading 'files'") || 
              errorMessage.includes("loadCase") ||
              errorMessage.includes("timeout")) {
            console.log('Hiding PDFViewer due to error:', errorMessage);
            setPdfUrl(null);
            setError(null);
            setLoading(false);
            return;
          }
          
          setError('שגיאה בטעינת קובץ PDF');
          setPdfUrl(null);
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
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!path) {
    return <EmptyState message={message} onSelect={onFileSelect} />;
  }
  
  if (loading) return <LoadingState />;
  if (error) return (
    <ErrorState 
      error={error}
      subtitle="לא ניתן לגשת לקובץ PDF המבוקש או שהוא אינו קיים"
      onRetry={() => {
        previousPathRef.current = null;
        window.location.reload();
      }}
    />
  );
  
  if (!pdfUrl) return <EmptyState message={message} />;

  const isSwitch = previousPathRef.current && previousPathRef.current !== path;

  return (
    <div className="h-full w-full bg-[#faf9f8] transition-all duration-150 ease-out pdf-viewer-container overflow-hidden">
      <iframe
        key={isSwitch ? `pdf-${animationKey}` : 'pdf-static'}
        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-fit`}
        className={`pdf-iframe ${isSwitch ? 'pdf-slide-in' : ''}`}
        title="PDF Viewer"
        style={{ 
          backgroundColor: '#faf9f8'
        }}
      />
    </div>
  );
}