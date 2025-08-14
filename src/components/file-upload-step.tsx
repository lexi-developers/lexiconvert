
"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, FolderUp, ArrowRight, Trash2, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import JSZip from 'jszip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePreview } from "@/context/preview-provider";


interface FileUploadStepProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileUploadStep({ onFilesSelected }: FileUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { showPreview } = usePreview();

  const processAndStageFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    setIsProcessing(true);
    setError(null);
    const newFiles: File[] = [];

    try {
        for (const file of Array.from(fileList)) {
            if (file.type === "application/zip" || file.name.toLowerCase().endsWith(".zip")) {
                const zip = new JSZip();
                const content = await zip.loadAsync(file);
                for (const filename in content.files) {
                    if (!content.files[filename].dir) {
                        const blob = await content.files[filename].async('blob');
                        newFiles.push(new File([blob], filename, { type: blob.type }));
                    }
                }
            } else {
                newFiles.push(file);
            }
        }
        
        // Add new files and filter out duplicates based on name and size
        setStagedFiles(prevFiles => {
            const existingFiles = new Set(prevFiles.map(f => `${f.name}-${f.size}`));
            const uniqueNewFiles = newFiles.filter(f => !existingFiles.has(`${f.name}-${f.size}`));
            return [...prevFiles, ...uniqueNewFiles];
        });

    } catch (err: any) {
        console.error("Error processing files:", err);
        setError(`Failed to process files. ${err.message}`);
    } finally {
        setIsProcessing(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processAndStageFiles(e.target.files);
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, inOrOut: "in" | "out" | "over" | "drop") => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    if (inOrOut === 'in') setIsDragging(true);
    if (inOrOut === 'out') setIsDragging(false);
    if (inOrOut === 'drop') {
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const fileList = e.dataTransfer.files;
          processAndStageFiles(fileList);
      }
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setStagedFiles(stagedFiles.filter(file => file !== fileToRemove));
  };
  
  const handleContinue = () => {
    if (stagedFiles.length > 0) {
      onFilesSelected(stagedFiles);
    }
  }
  
  const handlePreview = (e: React.MouseEvent, file: File) => {
    e.preventDefault();
    showPreview(file, file.name);
  };

  return (
    <div className="space-y-6">
      {stagedFiles.length === 0 ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-colors",
            isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/50",
            isProcessing ? "cursor-wait opacity-50" : ""
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
                It will not be uploaded to our server.
              </p>
              <div className="mt-6 flex gap-4">
                <Button size="lg" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                  <FileUp className="mr-2 h-5 w-5" />
                  Select Files
                </Button>
                <Button size="lg" variant="secondary" onClick={() => folderInputRef.current?.click()} disabled={isProcessing}>
                  <FolderUp className="mr-2 h-5 w-5" />
                  Select Folder
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Staged Files ({stagedFiles.length})</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                <FileUp className="mr-2 h-4 w-4" />
                Add Files
              </Button>
              <Button size="sm" variant="outline" onClick={() => folderInputRef.current?.click()} disabled={isProcessing}>
                <FolderUp className="mr-2 h-4 w-4" />
                Add Folder
              </Button>
            </div>
          </div>
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead className="w-[120px]">Size</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stagedFiles.map((file, index) => (
                  <TableRow key={`${file.name}-${file.size}-${index}`}>
                    <TableCell className="font-medium truncate max-w-sm">
                        <span 
                            className="cursor-pointer hover:underline" 
                            onClick={(e) => handlePreview(e, file)}
                        >
                            {file.name}
                        </span>
                    </TableCell>
                    <TableCell>{(file.size / 1024).toFixed(2)} KB</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(file)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                        <span className="sr-only">Remove</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end">
              <Button size="lg" onClick={handleContinue} disabled={stagedFiles.length === 0}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
          </div>
        </div>
      )}

      {/* Shared inputs and error display */}
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
        {...({ webkitdirectory: "true", directory: "true" } as any)}
        onChange={handleFileChange}
        disabled={isProcessing}
      />

      {error && (
        <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
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
