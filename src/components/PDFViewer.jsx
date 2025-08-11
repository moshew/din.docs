import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, memo } from 'react';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { usePDF, PDFDocument } from 'react-fast-scroll-pdf';

// Fast PDF viewer styles - optimized for performance with width fit
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

  .fast-pdf-viewer {
    width: 100%;
    height: 100%;
  }

  .fast-pdf-viewer canvas {
    max-width: 100%;
    height: auto;
  }

  .fast-pdf-viewer div[data-page] {
    max-width: 100%;
    margin: 0 auto;
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

const ErrorState = ({ error, subtitle, onRetry, loading }) => (
  <div className="h-full flex flex-col items-center justify-center bg-[#faf9f8] p-6">
    <div className="p-3 rounded-full border-2 border-[#F3B1B3] bg-white mb-4">
      <FileText className="w-12 h-12 text-[#A4262C]" />
    </div>
    <p className="text-xl font-medium text-[#323130] mb-2 text-center">{error}</p>
    {subtitle && (
      <p className="text-sm text-[#605e5c] mb-5 text-center">
        {subtitle}
      </p>
    )}
    {onRetry && (
      <button
        onClick={onRetry}
        disabled={loading}
        className="px-4 py-2 bg-[#0078d4] text-white rounded hover:bg-[#106ebe] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'מנסה שוב...' : 'נסה שוב'}
      </button>
    )}
  </div>
);

// Stable, memoized advanced viewer component to avoid remounting on parent re-renders
const AdvancedViewer = memo(function AdvancedViewer({ source }) {
  const scrollContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const hasFitRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  const {
    pages,
    changeZoomStart,
    changeZoomEnd,
    renderCurrentPage,
    viewportWidth,
  } = usePDF({
    source,
    scrollContainer: scrollContainerRef.current,
    viewer: viewerRef.current,
  });

  const fitToWidth = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !viewportWidth) return;
    const scale = (container.clientWidth / viewportWidth) * 0.98;
    if (!Number.isFinite(scale) || scale <= 0) return;
    changeZoomStart(scale);
    const t = setTimeout(() => changeZoomEnd(), 0);
    return () => clearTimeout(t);
  }, [viewportWidth, changeZoomStart, changeZoomEnd]);

  useLayoutEffect(() => {
    if (hasFitRef.current) {
      if (!isReady) setIsReady(true);
      return;
    }
    if (!source || !viewportWidth) return;
    fitToWidth();
    hasFitRef.current = true;
    const id = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(id);
  }, [fitToWidth, source, viewportWidth, isReady]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return undefined;
    const onScroll = () => renderCurrentPage();
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [renderCurrentPage]);

  return (
    <div className="h-full w-full flex flex-col">
      <div
        ref={scrollContainerRef}
        className="h-full w-full overflow-auto"
        style={{ height: '100%', visibility: isReady ? 'visible' : 'hidden' }}
      >
        <div ref={viewerRef} className="w-full fast-pdf-viewer">
          <PDFDocument pages={pages} />
        </div>
      </div>
    </div>
  );
});

export const PDFViewer = memo(function PDFViewer({ path, message, onFileSelect }) {
  const [pdfSource, setPdfSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const urlRef = useRef(null);
  const [retrySeq, setRetrySeq] = useState(0);
  const lastPathRef = useRef(null);
  // Advanced viewer is rendered lazily to avoid initializing the hook with null source

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
          lastPathRef.current = null;
        }
        return;
      }

      // Skip reload if the same path is already loaded
      if (lastPathRef.current === path && pdfSource) {
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

        if (!isMounted) return;

        // Handle non-binary responses from the main process
        // getPdf may return objects like { result: 'docx' } or { result: 'notExists' }
        if (!pdfData || (typeof pdfData === 'object' && !(pdfData instanceof ArrayBuffer) && !ArrayBuffer.isView(pdfData))) {
          const resultTag = pdfData && pdfData.result;

          if (resultTag === 'docx') {
            // File opened externally; hide viewer without error
            setPdfSource(null);
            setLoading(false);
            setError(null);
            return;
          }

          if (resultTag === 'notExists') {
            setPdfSource(null);
            setLoading(false);
            setError('הקובץ לא נמצא');
            return;
          }

          if (resultTag === 'error') {
            setPdfSource(null);
            setLoading(false);
            setError('שגיאה בקריאת הקובץ');
            return;
          }

          // Unknown response shape
          setPdfSource(null);
          setLoading(false);
          setError('נתונים לא תקינים עבור PDF');
          return;
        }

        // Clean up previous URL
        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current);
        }

        // Ensure we provide a fresh, non-detached copy of the bytes
        // This avoids DataCloneError when the viewer posts the data to a Worker
        let bytes;
        if (pdfData instanceof Uint8Array) {
          bytes = pdfData.slice(0);
        } else if (ArrayBuffer.isView(pdfData)) {
          // e.g., Node Buffer or another TypedArray view
          bytes = new Uint8Array(pdfData.buffer.slice(0));
        } else if (pdfData instanceof ArrayBuffer) {
          bytes = new Uint8Array(pdfData.slice(0));
        } else {
          // Fallback (should not happen given earlier guards)
          bytes = Uint8Array.from(pdfData);
        }

        // Prefer blob URL to avoid structuredClone/transfer of ArrayBuffer in workers
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(blob);
        urlRef.current = objectUrl;
        const sourceOptions = { url: objectUrl };

        setPdfSource(sourceOptions);
        setLoading(false);
        setError(null);
        lastPathRef.current = path;

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
  }, [path, retrySeq]);

  // Clean up URL when component unmounts
  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  // Local advanced viewer component to safely use the hook only when source exists
  const AdvancedViewer = ({ source }) => {
    const scrollContainerRef = useRef(null);
    const viewerRef = useRef(null);
    const hasFitRef = useRef(false);
    const [isReady, setIsReady] = useState(false);

    const {
      pages,
      changeZoomStart,
      changeZoomEnd,
      renderCurrentPage,
      viewportWidth,
    } = usePDF({
      source,
      scrollContainer: scrollContainerRef.current,
      viewer: viewerRef.current,
    });

    const fitToWidth = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container || !viewportWidth) return;
      const scale = (container.clientWidth / viewportWidth) * 0.98;
      if (!Number.isFinite(scale) || scale <= 0) return;
      changeZoomStart(scale);
      const t = setTimeout(() => changeZoomEnd(), 0);
      return () => clearTimeout(t);
    }, [viewportWidth, changeZoomStart, changeZoomEnd]);

    // Run fit before paint to avoid visible flicker
    useLayoutEffect(() => {
      if (hasFitRef.current) {
        if (!isReady) setIsReady(true);
        return;
      }
      if (!source || !viewportWidth) return;
      fitToWidth();
      hasFitRef.current = true;
      // reveal on next frame after zoom applied
      const id = requestAnimationFrame(() => setIsReady(true));
      return () => cancelAnimationFrame(id);
    }, [fitToWidth, source, viewportWidth, isReady]);

    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return undefined;
      const onScroll = () => renderCurrentPage();
      container.addEventListener('scroll', onScroll);
      return () => container.removeEventListener('scroll', onScroll);
    }, [renderCurrentPage]);

    return (
      <div className="h-full w-full flex flex-col">
        <div
          ref={scrollContainerRef}
          className="h-full w-full overflow-auto"
          style={{ height: '100%', visibility: isReady ? 'visible' : 'hidden' }}
        >
          <div ref={viewerRef} className="w-full fast-pdf-viewer">
            <PDFDocument pages={pages} />
          </div>
        </div>
      </div>
    );
  };


  // Show loading/error states when needed, otherwise show PDF
  if (!path) {
    return <EmptyState message={message} onSelect={onFileSelect} />;
  }
  
  if (error) {
    return (
      <ErrorState 
        error={error}
        subtitle="לא ניתן לגשת לקובץ PDF המבוקש או שהוא אינו קיים"
        loading={loading}
        onRetry={() => setRetrySeq((v) => v + 1)}
      />
    );
  }

  if (loading) {
    return <EmptyState message="טוען PDF..." />;
  }

  // Render advanced viewer with automatic width fit on open
  return (
    <div className="h-full w-full bg-[#faf9f8] fast-pdf-container">
      {pdfSource && (
        <AdvancedViewer source={pdfSource} />
      )}
    </div>
  );
});