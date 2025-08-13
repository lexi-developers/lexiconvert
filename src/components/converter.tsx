"use client";

import { useState, useCallback, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as docx from "docx";

type ConversionStatus = "idle" | "converting" | "success" | "error";

export function Converter() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setConvertedFileUrl(null);
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
      const supportedTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
        "text/plain",
        "image/jpeg",
        "image/png"
      ];
      if (!supportedTypes.includes(selectedFile.type)) {
        toast({
          variant: "destructive",
          title: "檔案格式不受支援",
          description: "目前僅支援 .docx, .txt, .jpg, 和 .png 檔案。",
        });
        return;
      }
      resetState();
      setFile(selectedFile);
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

  const handleConvert = async () => {
    if (!file) return;

    setStatus("converting");
    setConvertedFileUrl(null);
    setErrorMessage("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.create();
      
      if (file.type.startsWith('image/')) {
        let image;
        if (file.type === 'image/jpeg') {
            image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (file.type === 'image/png') {
            image = await pdfDoc.embedPng(arrayBuffer);
        } else {
            throw new Error('Unsupported image type');
        }
        
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });
      } else {
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontSize = 12;
        let textContent = "";
        
        if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          textContent = "DOCX parsing is complex and not fully supported in this offline version. This is a placeholder.";
          toast({
            title: "注意",
            description: "DOCX 內容解析功能受限。",
          });
        } else if (file.type === "text/plain") {
          const decoder = new TextDecoder("utf-8");
          textContent = decoder.decode(arrayBuffer);
        }
        
        page.drawText(textContent, {
          x: 50,
          y: height - 4 * fontSize,
          font,
          size: fontSize,
          color: rgb(0, 0, 0),
          maxWidth: width - 100,
          lineHeight: 15,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setConvertedFileUrl(url);
      setStatus("success");
      toast({
        title: "轉換成功！",
        description: "您的 PDF 檔案已準備就緒。",
      });

    } catch (err: any) {
      setStatus("error");
      const errorMsg = "檔案轉換失敗。請確認檔案是否毀損。";
      setErrorMessage(errorMsg);
      toast({
        variant: "destructive",
        title: "轉換錯誤",
        description: errorMsg,
      });
    }
  };
  
  const getOutputFilename = () => {
    if (!file) return "converted.pdf";
    const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
    return `${nameWithoutExtension}.pdf`;
  }

  const getFileIcon = () => {
    if (!file) return null;
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>離線檔案轉換器</CardTitle>
        <CardDescription>
          將您的檔案安全地轉換為 PDF，完全在您的瀏覽器中完成。
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
            <p className="text-xs text-muted-foreground mt-1">目前支援 .docx, .txt, .jpg, .png</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".docx,.txt,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e.target.files)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="default" className="border-primary/20">
              {getFileIcon()}
              <AlertTitle>{file.name}</AlertTitle>
              <AlertDescription className="flex justify-between items-center">
                <span>檔案已準備好轉換為 PDF。</span>
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetState}>
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleConvert}
              disabled={status === "converting"}
              className="w-full"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              轉換為 PDF
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
