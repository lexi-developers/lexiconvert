
"use client";

import { useState } from "react";
import { ConversionResult } from "@/app/page";
import { FileUploadStep } from "./file-upload-step";
import { FileConfigStep } from "./file-config-step";
import { ConversionProgressStep } from "./conversion-progress-step";
import { ConversionResultStep } from "./conversion-result-step";
import { generateUniqueId } from "@/lib/conversions";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  onComplete: (results: ConversionResult[]) => void;
  onDone: (results: ConversionResult[]) => void;
}

export function ConversionFlow({ onComplete, onDone }: ConversionFlowProps) {
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
    onComplete(results);
  };

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

  const renderStep = () => {
    switch(step) {
      case "upload":
        return <FileUploadStep onFilesSelected={handleFilesSelected} />;
      case "config":
        return (
          <FileConfigStep
            files={filesToConvert}
            onConfigComplete={handleConfigComplete}
            onBack={handleReset}
          />
        );
      case "progress":
        // Desktop: show in a dialog. On mobile, it will be a full screen takeover implicitly.
        // The dialog is controlled by the step, so it opens when step becomes 'progress'.
        // We don't want the user to close it accidentally.
        return (
           <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent hideCloseButton={true} className="p-0 bg-transparent border-0 max-w-lg">
               <ConversionProgressStep
                  tasks={filesToConvert}
                  onConversionComplete={handleConversionComplete}
                  onCancelRequest={() => setIsCancelAlertOpen(true)}
                />
            </DialogContent>
           </Dialog>
        );
      case "result":
         return <ConversionResultStep results={convertedFiles} onDone={handleDone} />;
      default:
        return null;
    }
  }

  return (
    <div className="w-full">
      {renderStep()}

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
            <AlertDialogAction onClick={handleReset}>Cancel Conversion</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
