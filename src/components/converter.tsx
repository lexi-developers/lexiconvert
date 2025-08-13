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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

type ConversionStatus = "idle" | "uploading" | "converting" | "success" | "error";

// Abridged list of some popular formats, more can be added
const CONVERSION_FORMATS = [
    "pdf", "docx", "pptx", "xlsx", "jpg", "png", "gif", "mp3", "wav", "mp4", 
    "mov", "avi", "txt", "html", "epub", "mobi", "azw3", "odt", "ods", "odp",
    "rtf", "tex", "csv", "xml", "json", "md", "zip", "rar", "7z", "tar", "gz",
    "svg", "webp", "bmp", "tiff", "ico", "flac", "ogg", "wma", "m4a", "aac",
    "mkv", "flv", "webm", "wmv", "mpg", "doc", "xls", "ppt", "key", "numbers", "pages"
];

const API_KEY = "d3228b38038b55694c97484e8785718a"; // THIS IS A DEMO KEY

export function Converter() {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>(CONVERSION_FORMATS[0]);
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [statusText, setStatusText] = useState<string>("");
  const [convertedFile, setConvertedFile] = useState<{ name: string; url: string; } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setStatusText("");
    setConvertedFile(null);
    setErrorMessage("");
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, []);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      if (files[0].size > 100 * 1024 * 1024) { // 100MB limit for demo key
        toast({
          variant: "destructive",
          title: "檔案太大",
          description: "免費版金鑰不支援超過 100MB 的檔案。",
        });
        return;
      }
      resetState();
      setFile(files[0]);
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
  
  const pollConversionStatus = async (id: string) => {
    setStatusText("正在轉換檔案...");
    try {
      while(true) {
        const statusRes = await fetch(`https://api.convertio.co/convert/${id}/status`);
        const statusData = await statusRes.json();
        
        if (statusData.status === 'error') {
            throw new Error(statusData.error || "轉換過程中發生錯誤。");
        }
        
        if (statusData.data.step === 'finish') {
            const fileData = statusData.data.output.files[0];
            setConvertedFile({ name: fileData.name, url: fileData.url });
            setStatus("success");
            setStatusText("轉換成功！");
            return;
        }

        setStatusText(`正在轉換... (${statusData.data.step_percent || 0}%)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
      }
    } catch (err: any) {
        setStatus("error");
        const errorMsg = err.message || "無法確認轉換狀態。";
        setErrorMessage(errorMsg);
        toast({
          variant: "destructive",
          title: "轉換錯誤",
          description: errorMsg,
        });
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setStatus("uploading");
    setStatusText("正在上傳檔案...");
    setConvertedFile(null);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("apikey", API_KEY);
      formData.append("file", file);
      formData.append("outputformat", outputFormat);

      const res = await fetch("https://api.convertio.co/convert", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.status === "error") {
        throw new Error(data.error || "檔案上傳失敗。");
      }
      
      setStatus("converting");
      await pollConversionStatus(data.data.id);

    } catch (err: any) {
      setStatus("error");
      const errorMsg = err.message || "無法讀取或轉換檔案。請確保檔案有效。";
      setErrorMessage(errorMsg);
      toast({
        variant: "destructive",
        title: "轉換錯誤",
        description: errorMsg,
      });
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>檔案轉換器</CardTitle>
        <CardDescription>
          支援超過 50 種格式，由 Convertio.co 提供技術支援。
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
            <p className="text-xs text-muted-foreground mt-1">支援圖像、文件、影片、音訊等格式。</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="default" className="border-primary/20">
              <FileText className="h-4 w-4" />
              <AlertTitle>{file.name}</AlertTitle>
              <AlertDescription className="flex justify-between items-center">
                <span>檔案已準備好進行轉換。</span>
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetState}>
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="選擇輸出格式" />
                </SelectTrigger>
                <SelectContent>
                  {CONVERSION_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      .{format.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleConvert}
                disabled={status === "converting" || status === "uploading"}
                className="w-full sm:w-auto"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                轉換
              </Button>
            </div>
          </div>
        )}

        {(status === "uploading" || status === "converting") && (
            <div className="space-y-2 text-center flex items-center justify-center">
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">{statusText}</p>
            </div>
        )}

        {status === "success" && convertedFile && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">轉換成功！</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-2 text-green-700">
              您的檔案 <span className="font-semibold">{convertedFile.name}</span> 已準備就緒。
              <Button asChild size="sm">
                <a href={convertedFile.url} download target="_blank" rel="noopener noreferrer">
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
