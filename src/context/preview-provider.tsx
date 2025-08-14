
"use client";

import { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import FilePreview with SSR turned off
const FilePreview = dynamic(() => import('@/components/file-preview').then(mod => mod.FilePreview), {
  ssr: false,
});


type PreviewContextType = {
  showPreview: (file: File | Blob, fileName: string) => void;
};

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export const usePreview = () => {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
};

export const PreviewProvider = ({ children }: { children: ReactNode }) => {
  const [previewFile, setPreviewFile] = useState<{ file: File | Blob; name: string } | null>(null);

  const showPreview = useCallback((file: File | Blob, fileName: string) => {
    setPreviewFile({ file, name: fileName });
  }, []);

  const closePreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

  return (
    <PreviewContext.Provider value={{ showPreview }}>
      {children}
      {previewFile && (
        <FilePreview
          file={previewFile.file}
          fileName={previewFile.name}
          isOpen={!!previewFile}
          onClose={closePreview}
        />
      )}
    </PreviewContext.Provider>
  );
};
