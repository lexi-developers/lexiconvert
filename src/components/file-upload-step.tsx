
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
      <h2 className="mt-6 text-2xl font-semibold">Drag & drop files here</h2>
      <p className="mt-2 text-muted-foreground">
        or click the button to select
      </p>
      <div className="mt-6">
        <Button size="lg" onClick={() => fileInputRef.current?.click()}>
          <UploadCloud className="mr-2 h-5 w-5" />
          Select Files
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
    </div>
  );
}
