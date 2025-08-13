"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  UploadCloud,
  FileText,
  X,
  ArrowRight,
  CheckCircle,
  Download,
  AlertCircle,
  Loader,
  Image as ImageIcon,
  FileSymlink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as docx from "docx";
import levenshtein from "js-levenshtein";

type ConversionStatus = "idle" | "converting" | "success" | "error";
type FileType = "docx" | "txt" | "jpg" | "png" | "unknown";
type OutputFormat = "pdf" | "jpg" | "png";

const mimeTypeToType: Record<string, FileType> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const supportedConversions: Record<FileType, OutputFormat[]> = {
  docx: ["pdf"],
  txt: ["pdf"],
  jpg: ["pdf", "png"],
  png: ["pdf", "jpg"],
  unknown: [],
};

export function Converter() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>("unknown");
  const [outputFormat, setOutputFormat] = useState<OutputFormat | null>(null);
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [convertedFileType, setConvertedFileType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const availableOutputFormats = useMemo(() => {
    return supportedConversions[fileType] || [];
  }, [fileType]);

  const resetState = useCallback(() => {
    setFile(null);
    setFileType("unknown");
    setOutputFormat(null);
    setStatus("idle");
    setConvertedFileUrl(null);
    setConvertedFileType(null);
    setErrorMessage("");
    if (convertedFileUrl) {
      URL.revokeObjectURL(convertedFileUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [convertedFileUrl]);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const selectedFile = files[0];
      const detectedType = mimeTypeToType[selectedFile.type] || "unknown";

      if (detectedType === "unknown") {
        toast({
          variant: "destructive",
          title: "檔案格式不受支援",
          description: "抱歉，目前不支援此檔案類型。",
        });
        return;
      }
      
      resetState();
      setFile(selectedFile);
      setFileType(detectedType);
      const possibleFormats = supportedConversions[detectedType];
      if (possibleFormats.length > 0) {
        setOutputFormat(possibleFormats[0]);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const convertToPdf = async (file: File, fileType: FileType, arrayBuffer: ArrayBuffer): Promise<Blob> => {
    const pdfDoc = await PDFDocument.create();
    
    if (fileType === "jpg" || fileType === "png") {
      let image;
      if (fileType === 'jpg') {
          image = await pdfDoc.embedJpg(arrayBuffer);
      } else { // png
          image = await pdfDoc.embedPng(arrayBuffer);
      }
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    } else { // txt, docx
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      let textContent = "";
      
      if (fileType === "docx") {
        textContent = "DOCX parsing is complex and not fully supported in this offline version. This is a placeholder.";
        toast({ title: "注意", description: "DOCX 內容解析功能受限。" });
      } else if (fileType === "txt") {
        const decoder = new TextDecoder("utf-8");
        textContent = decoder.decode(arrayBuffer);
      }
      
      page.drawText(textContent, {
        x: 50, y: height - 4 * fontSize, font, size: fontSize, color: rgb(0, 0, 0), maxWidth: width - 100, lineHeight: 15
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  };
  
  const convertImage = async (fileType: FileType, outputFormat: 'jpg' | 'png', arrayBuffer: ArrayBuffer): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get canvas context'));

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const targetMimeType = `image/${outputFormat}`;
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Canvas to Blob conversion failed'));
          resolve(blob);
        }, targetMimeType, 0.9);
      };
      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = URL.createObjectURL(new Blob([arrayBuffer], { type: `image/${fileType}` }));
    });
  };


  const handleConvert = async () => {
    if (!file || !outputFormat) return;

    setStatus("converting");
    setConvertedFileUrl(null);
    setErrorMessage("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      let blob: Blob;

      if (outputFormat === 'pdf') {
        blob = await convertToPdf(file, fileType, arrayBuffer);
      } else if (outputFormat === 'jpg' || outputFormat === 'png') {
        if (fileType !== 'jpg' && fileType !== 'png') {
          throw new Error(`Cannot convert ${fileType} to ${outputFormat}`);
        }
        blob = await convertImage(fileType, outputFormat, arrayBuffer);
      } else {
        throw new Error(`Unsupported output format: ${outputFormat}`);
      }
      
      const url = URL.createObjectURL(blob);
      setConvertedFileUrl(url);
      setConvertedFileType(blob.type);
      setStatus("success");
      toast({
        title: "轉換成功！",
        description: `您的 ${outputFormat.toUpperCase()} 檔案已準備就緒。`,
      });

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      const errorMsg = "檔案轉換失敗。請確認檔案是否毀損或格式是否正確。";
      setErrorMessage(errorMsg);
      toast({
        variant: "destructive",
        title: "轉換錯誤",
        description: errorMsg,
      });
    }
  };
  
  const getOutputFilename = () => {
    if (!file || !outputFormat) return "converted.file";
    const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
    return `${nameWithoutExtension}.${outputFormat}`;
  }

  const getFileIcon = () => {
    if (!file) return null;
    if (fileType === 'jpg' || fileType === 'png') {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>離線檔案轉換器</CardTitle>
        <CardDescription>
          將您的檔案安全地轉換為不同格式，完全在您的瀏覽器中完成。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!file ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
              isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/50"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-center text-muted-foreground">
              <span className="font-semibold text-primary">點擊上傳</span> 或拖放檔案
            </p>
            <p className="text-xs text-muted-foreground mt-1">支援 .docx, .txt, .jpg, .png</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".docx,.txt,.jpg,.jpeg,.png,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => handleFileChange(e.target.files)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="default" className="border-primary/20">
               <div className="flex items-center gap-2">
                {getFileIcon()}
                <AlertTitle>{file.name}</AlertTitle>
               </div>
              <AlertDescription className="flex justify-between items-center mt-2">
                <span>檔案已就緒。請選擇要轉換的格式。</span>
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetState}>
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-2 text-sm font-medium">
                  <FileSymlink className="h-5 w-5 text-muted-foreground" />
                  轉換為:
               </div>
               <Select
                value={outputFormat ?? ""}
                onValueChange={(value) => setOutputFormat(value as OutputFormat)}
               >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="選擇格式" />
                </SelectTrigger>
                <SelectContent>
                    {availableOutputFormats.map(format => (
                        <SelectItem key={format} value={format}>{format.toUpperCase()}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleConvert}
              disabled={status === "converting" || !outputFormat}
              className="w-full"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              {outputFormat ? `轉換為 ${outputFormat.toUpperCase()}` : "請選擇格式"}
            </Button>
          </div>
        )}

        {status === "converting" && (
            <div className="space-y-2 text-center flex items-center justify-center">
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">正在轉換檔案...</p>
            </div>
        )}

        {status === "success" && convertedFileUrl && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">轉換成功！</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-2 text-green-700">
              您的檔案 <span className="font-semibold">{getOutputFilename()}</span> 已準備就緒。
              <Button asChild size="sm">
                <a href={convertedFileUrl} download={getOutputFilename()}>
                  <Download className="mr-2 h-4 w-4" />
                  下載
                </a>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>轉換失敗</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
