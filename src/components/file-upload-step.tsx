
"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, FolderUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import JSZip from 'jszip';

interface FileUploadStepProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileUploadStep({ onFilesSelected }: FileUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    setIsProcessing(true);
    setError(null);
    const allFiles: File[] = [];
    
    try {
        for (const file of Array.from(fileList)) {
            if (file.type === "application/zip" || file.name.toLowerCase().endsWith(".zip")) {
                const zip = new JSZip();
                const content = await zip.loadAsync(file);
                for (const filename in content.files) {
                    if (!content.files[filename].dir) {
                        const blob = await content.files[filename].async('blob');
                        allFiles.push(new File([blob], filename, { type: blob.type }));
                    }
                }
            } else {
                allFiles.push(file);
            }
        }
        onFilesSelected(allFiles);
    } catch (err: any) {
        console.error("Error processing files:", err);
        setError(`Failed to process files. ${err.message}`);
    } finally {
        setIsProcessing(false);
    }
  }, [onFilesSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, inOrOut: "in" | "out" | "over" | "drop") => {
    e.preventDefault();
    e.stopPropagation();
    if (inOrOut === 'in') setIsDragging(true);
    if (inOrOut === 'out') setIsDragging(false);
    if (inOrOut === 'drop') {
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const fileList = e.dataTransfer.files;
          processFiles(fileList);
      }
    }
  };

  return (
    <>
     <div
      className={cn(
        "flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-colors",
        isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/50",
        isProcessing ? "cursor-wait" : ""
      )}
      onDragEnter={(e) => handleDragEvents(e, 'in')}
      onDragLeave={(e) => handleDragEvents(e, 'out')}
      onDragOver={(e) => handleDragEvents(e, 'over')}
      onDrop={(e) => handleDragEvents(e, 'drop')}
    >
        {isProcessing ? (
            <>
                <Loader2 className="w-16 h-16 text-muted-foreground animate-spin" />
                <h2 className="mt-6 text-2xl font-semibold">Processing files...</h2>
                <p className="mt-2 text-muted-foreground">
                    Extracting archives and preparing your files.
                </p>
            </>
        ) : (
            <>
                <UploadCloud className="w-16 h-16 text-muted-foreground" />
                <h2 className="mt-6 text-2xl font-semibold">Drag & drop files or folders here</h2>
                <p className="mt-2 text-muted-foreground">
                    or use the buttons below
                </p>
                <div className="mt-6 flex gap-4">
                    <Button size="lg" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                    <UploadCloud className="mr-2 h-5 w-5" />
                    Select Files
                    </Button>
                     <Button size="lg" variant="secondary" onClick={() => folderInputRef.current?.click()} disabled={isProcessing}>
                        <FolderUp className="mr-2 h-5 w-5" />
                        Select Folder
                    </Button>
                </div>
            </>
        )}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFileChange}
        disabled={isProcessing}
      />
       <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        multiple
        webkitdirectory="true"
        directory="true"
        onChange={handleFileChange}
        disabled={isProcessing}
      />
    </div>
    {error && (
        <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    )}
    </>
  );
}

// Simple loader icon
function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
