"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, FolderUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FileUploadStepProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileUploadStep({ onFilesSelected }: FileUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, inOrOut: "in" | "out" | "over" | "drop") => {
    e.preventDefault();
    e.stopPropagation();
    if (inOrOut === 'in') setIsDragging(true);
    if (inOrOut === 'out') setIsDragging(false);
    if (inOrOut === 'drop') {
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesSelected(Array.from(e.dataTransfer.files));
      }
    }
  };

  return (
     <div
      className={cn(
        "flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-colors",
        isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/50"
      )}
      onDragEnter={(e) => handleDragEvents(e, 'in')}
      onDragLeave={(e) => handleDragEvents(e, 'out')}
      onDragOver={(e) => handleDragEvents(e, 'over')}
      onDrop={(e) => handleDragEvents(e, 'drop')}
    >
      <UploadCloud className="w-16 h-16 text-muted-foreground" />
      <h2 className="mt-6 text-2xl font-semibold">拖放檔案或資料夾到此處</h2>
      <p className="mt-2 text-muted-foreground">
        或點擊按鈕選擇
      </p>
      <div className="mt-6 flex gap-4">
        <Button size="lg" onClick={() => fileInputRef.current?.click()}>
          <UploadCloud className="mr-2 h-5 w-5" />
          選擇檔案
        </Button>
        <Button size="lg" variant="secondary" onClick={() => folderInputRef.current?.click()}>
           <FolderUp className="mr-2 h-5 w-5" />
          選擇資料夾
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFileChange}
      />
       <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        multiple
        webkitdirectory="true"
        directory="true"
        onChange={handleFileChange}
      />
       <p className="text-xs text-muted-foreground mt-6">支援 PDF, DOCX, XLSX, TXT, EPUB, 圖片, 程式碼等多種格式</p>
    </div>
  );
}
