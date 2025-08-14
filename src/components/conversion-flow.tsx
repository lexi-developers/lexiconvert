
"use client";

import { useState } from "react";
import { ConversionResult } from "@/app/page";
import { FileUploadStep } from "./file-upload-step";
import { FileConfigStep } from "./file-config-step";
import { ConversionProgressStep } from "./conversion-progress-step";
import { ConversionResultStep } from "./conversion-result-step";
import { generateUniqueId } from "@/lib/conversions";
import { DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type FlowStep = "upload" | "config" | "progress" | "result";

interface ConversionFlowProps {
  onDone: (results: ConversionResult[]) => void;
}

export function ConversionFlow({ onDone }: ConversionFlowProps) {
  const [step, setStep] = useState<FlowStep>("upload");
  const [filesToConvert, setFilesToConvert] = useState<ConversionResult[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<ConversionResult[]>([]);
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    const newTasks: ConversionResult[] = files.map((file) => ({
      id: generateUniqueId(file.name),
      inputFile: file,
      status: "pending",
    }));
    setFilesToConvert(newTasks);
    setStep("config");
  };

  const handleConfigComplete = (configuredFiles: ConversionResult[]) => {
    setFilesToConvert(configuredFiles);
    setStep("progress");
  };

  const handleConversionComplete = (results: ConversionResult[]) => {
    setStep("result");
    setConvertedFiles(results);
  };
  
  const handleBackToUpload = () => {
    setFilesToConvert([]);
    setStep("upload");
  }

  const handleReset = () => {
    setFilesToConvert([]);
    setConvertedFiles([]);
    setStep("upload");
  };
  
  const handleDone = () => {
    const successfulConversions = convertedFiles.filter(r => r.status === 'success');
    onDone(successfulConversions);
    handleReset();
  }

  const handleCloseRequest = () => {
    if (step === 'upload' || filesToConvert.length === 0) {
        onDone([]); 
        handleReset();
    } else {
        setIsCancelAlertOpen(true);
    }
  }

  const handleConfirmCancel = () => {
    setIsCancelAlertOpen(false);
    onDone([]);
    handleReset();
  }

  const getTitleForStep = () => {
    switch(step) {
        case "upload": return "Upload Files";
        case "config": return "Configure Conversion";
        case "progress": return "Converting...";
        case "result": return "Conversion Complete";
        default: return "LexiConvert";
    }
  }

  const renderStep = () => {
    switch(step) {
      case "upload":
        return <FileUploadStep onFilesSelected={handleFilesSelected} />;
      case "config":
        return (
          <FileConfigStep
            files={filesToConvert}
            onConfigComplete={handleConfigComplete}
            onBack={handleBackToUpload}
          />
        );
      case "progress":
        return (
           <ConversionProgressStep
              tasks={filesToConvert}
              onConversionComplete={handleConversionComplete}
            />
        );
      case "result":
         return <ConversionResultStep results={convertedFiles} onDone={handleDone} />;
      default:
        return null;
    }
  }

  const showBackButton = step === 'config';

  return (
    <div className="h-full flex flex-col">
       <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    {showBackButton && (
                        <Button variant="ghost" size="icon" onClick={handleBackToUpload}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <DialogTitle className="text-2xl">{getTitleForStep()}</DialogTitle>
                 </div>
                 <DialogClose asChild>
                    <button onClick={(e) => {
                        e.preventDefault();
                        handleCloseRequest();
                    }}>
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </button>
                </DialogClose>
            </div>
        </DialogHeader>
      
      <div className="flex-grow p-6 overflow-y-auto">
        {renderStep()}
      </div>

      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop the current conversion process and you will lose all progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Converting</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>Cancel Conversion</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
