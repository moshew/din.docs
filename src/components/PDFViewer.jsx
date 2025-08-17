import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, memo } from 'react';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { usePDF, PDFDocument } from 'react-fast-scroll-pdf';

// Minimal viewer styles (layout only). Scrollbar styling is centralized in index.css
const pdfViewerStyles = `
  .fast-pdf-viewer {
    width: 100%;
    overflow: visible;
    padding: 0 8px;
  }

  .fast-pdf-viewer * {
    overflow: visible !important;
  }

  .fast-pdf-viewer canvas {
    width: 100% !important;
    max-width: 100%;
    height: auto;
    display: block;
    margin-bottom: 8px;
  }

  .fast-pdf-viewer div[data-page] {
    width: 100%;
    max-width: 100%;
    margin: 0 0 8px 0;
  }

  /* Hide any inner scrollbars from PDF library */
  .fast-pdf-viewer *::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
`;

// Insert or update the styles in the document head (ensures hot reload updates)
if (typeof document !== 'undefined') {
  const existing = document.querySelector('#pdf-viewer-styles');
  if (existing) {
    existing.textContent = pdfViewerStyles;
  } else {
    const style = document.createElement('style');
    style.id = 'pdf-viewer-styles';
    style.textContent = pdfViewerStyles;
    document.head.appendChild(style);
  }
}

const EmptyState = ({ message, subtitle, onSelect }) => (
  <div className="h-full flex flex-col items-center justify-center bg-white p-6">
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
  <div className="h-full flex flex-col items-center justify-center bg-white p-6">
    <FileText className="w-16 h-16 text-[#d4d4d4] mb-6" />
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
const AdvancedViewer = memo(function AdvancedViewer({ source, sourceKey }) {
  const hasFitRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [scrollEl, setScrollEl] = useState(null);
  const [viewerEl, setViewerEl] = useState(null);
  const currentSourceKeyRef = useRef(null);

  const {
    pages,
    changeZoomStart,
    changeZoomEnd,
    renderCurrentPage,
    viewportWidth,
  } = usePDF({
    source,
    scrollContainer: scrollEl,
    viewer: viewerEl,
  });

  const fitToWidth = useCallback(() => {
    if (!scrollEl || !viewportWidth) return;
    // Use more available width - account for scrollbar width (12px) and small margin
    const availableWidth = scrollEl.clientWidth - 16; // 12px scrollbar + 4px margin
    const scale = availableWidth / viewportWidth;
    if (!Number.isFinite(scale) || scale <= 0) return;
    changeZoomStart(scale);
    const t = setTimeout(() => changeZoomEnd(), 0);
    return () => clearTimeout(t);
  }, [viewportWidth, changeZoomStart, changeZoomEnd, scrollEl]);

  useLayoutEffect(() => {
    // Reset hasFitRef when source changes to ensure proper fitting for new documents
    if (currentSourceKeyRef.current !== sourceKey) {
      hasFitRef.current = false;
      setIsReady(false);
      currentSourceKeyRef.current = sourceKey;
    }
    
    if (hasFitRef.current) {
      if (!isReady) setIsReady(true);
      return;
    }
    if (!source || !viewportWidth || !scrollEl) return;
    fitToWidth();
    hasFitRef.current = true;
    const id = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(id);
  }, [fitToWidth, source, sourceKey, viewportWidth, isReady, scrollEl]);

  useEffect(() => {
    if (!scrollEl) return undefined;
    const onScroll = () => renderCurrentPage();
    scrollEl.addEventListener('scroll', onScroll);
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, [renderCurrentPage, scrollEl]);

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      <div
        ref={setScrollEl}
        className="h-full w-full overflow-y-auto overflow-x-hidden pdf-list-scroll"
        style={{ 
          height: '100%', 
          visibility: isReady ? 'visible' : 'hidden',
          transition: 'opacity 0.15s ease-in-out',
          opacity: isReady ? 1 : 0
        }}
      >
        <div ref={setViewerEl} className="w-full fast-pdf-viewer">
          <PDFDocument pages={pages} />
        </div>
      </div>
    </div>
  );
});

export const PDFViewer = memo(function PDFViewer({ path, message, onFileSelect }) {
  const [pdfSource, setPdfSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [error, setError] = useState(null);
  const urlRef = useRef(null);
  const [retrySeq, setRetrySeq] = useState(0);
  const lastPathRef = useRef(null);
  const viewerStateRef = useRef({ isInitialized: false });
  const loadingTimerRef = useRef(null);
  const [viewerKey, setViewerKey] = useState(0);
  // Advanced viewer is rendered lazily to avoid initializing the hook with null source

  // Debug logs removed for production

  // Handle delayed loading indicator to prevent flickering
  useEffect(() => {
    // Clear any existing timer
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    if (loading) {
      // Start timer to show loading indicator after 1 second
      loadingTimerRef.current = setTimeout(() => {
        setShowLoadingIndicator(true);
      }, 1000);
    } else {
      // Hide loading indicator immediately when loading stops
      setShowLoadingIndicator(false);
    }

    // Cleanup timer on unmount or loading change
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [loading]);

  
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
        // Force new AdvancedViewer instance to prevent old PDF from doing width fit
        setViewerKey(prev => prev + 1);
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

  // (Removed local AdvancedViewer shadowing to avoid confusion)


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

  if (showLoadingIndicator) {
    return <EmptyState message="טוען PDF..." />;
  }

  // Render advanced viewer with automatic width fit on open
  return (
    <div className="h-full w-full bg-white flex flex-col min-h-0 relative">
      {pdfSource && !loading && (
        <AdvancedViewer 
          key={viewerKey}
          source={pdfSource} 
          sourceKey={path || 'empty'} 
        />
      )}
      {showLoadingIndicator && (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0078d4] mx-auto mb-2" />
            <p className="text-sm text-[#605e5c]">טוען מסמך...</p>
          </div>
        </div>
      )}
    </div>
  );
});