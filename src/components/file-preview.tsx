
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { getFileExtension, getFileTypeFromMime } from '@/lib/conversions';

// Set worker source
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
}

interface FilePreviewProps {
  file: File | Blob | null;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const PREVIEWABLE_IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];
const PREVIEWABLE_TEXT_TYPES = ['txt', 'json', 'md', 'xml', 'html', 'css', 'js', 'ts', 'py', 'sql', 'csv'];

const getFileDetails = (file: File | Blob, name: string) => {
    const extension = getFileExtension(name);
    const type = getFileTypeFromMime(file.type, extension);
    const isImage = PREVIEWABLE_IMAGE_TYPES.includes(type);
    const isText = PREVIEWABLE_TEXT_TYPES.includes(type);
    const isPdf = type === 'pdf';
    return { isImage, isText, isPdf, type };
};

export function FilePreview({ file, fileName, isOpen, onClose }: FilePreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
  const { isImage, isText, isPdf, type } = useMemo(() => 
    file ? getFileDetails(file, fileName) : { isImage: false, isText: false, isPdf: false, type: 'unknown' },
  [file, fileName]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const loadFileContent = useCallback(async () => {
    if (!file) return;

    setError(null);
    setContent(null);
    setPageNumber(1);
    setNumPages(null);

    const url = URL.createObjectURL(file);
    setFileUrl(url);

    if (isText) {
      try {
        const textContent = await file.text();
        if (type === 'json') {
          try {
            const parsedJson = JSON.parse(textContent);
            setContent(JSON.stringify(parsedJson, null, 2));
          } catch {
            setContent(textContent); // Show raw text if not valid JSON
          }
        } else {
          setContent(textContent);
        }
      } catch (e) {
        setError('Failed to read file content.');
      }
    } else if (!isImage && !isPdf) {
        setError(`Preview is not available for this file type (.${getFileExtension(fileName)}).`);
    }

  }, [file, isText, isImage, isPdf, fileName, type]);


  useEffect(() => {
    if (isOpen) {
      loadFileContent();
    } else {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const renderContent = () => {
    const isLoading = !content && !error && !isImage && !isPdf && !numPages;

    if (isLoading && !isPdf) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading preview...</p>
        </div>
      );
    }
    
    if (error) {
        return (
             <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="mt-4 font-semibold">Preview Error</p>
                <p className="mt-2 text-muted-foreground">{error}</p>
            </div>
        )
    }
    
    if (isImage && fileUrl) {
      return <img src={fileUrl} alt={`Preview of ${fileName}`} className="max-w-full max-h-[75vh] object-contain" />;
    }
    
    if (isPdf && fileUrl) {
        return (
            <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(err) => setError(`Failed to load PDF: ${err.message}`)}
                loading={
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Loading PDF...</p>
                    </div>
                }
            >
                <Page pageNumber={pageNumber} />
            </Document>
        )
    }

    if (isText && content) {
      return (
        <pre className="text-sm bg-muted p-4 rounded-md max-h-[70vh] overflow-auto whitespace-pre-wrap break-words">
          <code>{content}</code>
        </pre>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="truncate">{fileName}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center py-4 min-h-[400px] bg-gray-100/50 dark:bg-gray-800/50">
            {renderContent()}
        </div>
        <DialogFooter className="flex-row justify-between items-center w-full">
            {isPdf && numPages && (
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setPageNumber(p => p - 1)} 
                        disabled={pageNumber <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {pageNumber} of {numPages}
                    </span>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setPageNumber(p => p + 1)}
                        disabled={pageNumber >= numPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <div/>
             <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
