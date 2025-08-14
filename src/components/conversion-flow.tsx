
"use client";

import { useState } from "react";
import { ConversionResult } from "@/app/page";
import { FileUploadStep } from "./file-upload-step";
import { FileConfigStep } from "./file-config-step";
import { ConversionProgressStep } from "./conversion-progress-step";
import { ConversionResultStep } from "./conversion-result-step";
import { generateUniqueId } from "@/lib/conversions";

type FlowStep = "upload" | "config" | "progress" | "result";

interface ConversionFlowProps {
  onComplete: (results: ConversionResult[]) => void;
  onDone: (results: ConversionResult[]) => void;
}

export function ConversionFlow({ onComplete, onDone }: ConversionFlowProps) {
  const [step, setStep] = useState<FlowStep>("upload");
  const [filesToConvert, setFilesToConvert] = useState<ConversionResult[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<ConversionResult[]>([]);

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
    setConvertedFiles(results);
    setStep("result");
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

  return (
    <div className="w-full">
      {step === "upload" && <FileUploadStep onFilesSelected={handleFilesSelected} />}
      {step === "config" && (
        <FileConfigStep
          files={filesToConvert}
          onConfigComplete={handleConfigComplete}
          onBack={handleReset}
        />
      )}
      {step === "progress" && (
        <ConversionProgressStep
          tasks={filesToConvert}
          onConversionComplete={handleConversionComplete}
        />
      )}
      {step === "result" && (
        <ConversionResultStep results={convertedFiles} onDone={handleDone} />
      )}
    </div>
  );
}
