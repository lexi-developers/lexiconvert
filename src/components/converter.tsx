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

// === TYPES AND CONSTANTS ===

type ConversionStatus = "idle" | "converting" | "success" | "error";
type DocumentFileType = "docx" | "txt";
type ImageFileType = "jpg" | "png" | "gif" | "bmp" | "webp" | "svg";
type FileType = DocumentFileType | ImageFileType | "unknown";
type OutputFormat = "pdf" | "jpg" | "png" | "webp" | "gif" | "bmp";

const mimeTypeToType: Record<string, FileType> = {
  // Documents
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  // Images
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const supportedConversions: Record<FileType, OutputFormat[]> = {
  docx: ["pdf"],
  txt: ["pdf"],
  jpg: ["pdf", "png", "webp", "gif", "bmp"],
  png: ["pdf", "jpg", "webp", "gif", "bmp"],
  gif: ["pdf", "jpg", "png", "webp", "bmp"],
  bmp: ["pdf", "jpg", "png", "webp", "gif"],
  webp: ["pdf", "jpg", "png", "gif", "bmp"],
  svg: ["pdf", "png", "jpg"], // SVG conversion to bitmap is supported
  unknown: [],
};

// === HELPER FUNCTIONS ===

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
}

const getFileTypeFromMime = (mime: string, extension: string): FileType => {
    if (mime in mimeTypeToType) return mimeTypeToType[mime];
    // Fallback for types not correctly reported by browser
    if (extension === 'jpg' || extension === 'jpeg') return 'jpg';
    if (extension === 'png') return 'png';
    // Add other extension fallbacks if needed
    return "unknown";
}


// === REACT COMPONENT ===

export function Converter() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>("unknown");
  const [outputFormat, setOutputFormat] = useState<OutputFormat | null>(null);
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const availableOutputFormats = useMemo(() => {
    if (!file || fileType === "unknown") return [];
    
    // Prevent converting to the same format
    const extension = getFileExtension(file.name) as OutputFormat;
    return (supportedConversions[fileType] || []).filter(f => f !== extension);
    
  }, [file, fileType]);

  const resetState = useCallback(() => {
    setFile(null);
    setFileType("unknown");
    setOutputFormat(null);
    setStatus("idle");
    setErrorMessage("");
    if (convertedFileUrl) {
      URL.revokeObjectURL(convertedFileUrl);
      setConvertedFileUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [convertedFileUrl]);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      resetState();
      const selectedFile = files[0];
      const extension = getFileExtension(selectedFile.name);
      const detectedType = getFileTypeFromMime(selectedFile.type, extension);

      if (detectedType === "unknown" || supportedConversions[detectedType].length === 0) {
        toast({
          variant: "destructive",
          title: "檔案格式不受支援",
          description: `抱歉，目前不支援 .${extension} 檔案類型。`,
        });
        return;
      }
      
      setFile(selectedFile);
      setFileType(detectedType);
      
      const possibleFormats = (supportedConversions[detectedType] || []).filter(f => f !== extension);

      if (possibleFormats.length > 0) {
        setOutputFormat(possibleFormats[0]);
      } else {
        setOutputFormat(null);
      }
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, inOrOut: "in" | "out" | "over" | "drop") => {
      e.preventDefault();
      e.stopPropagation();
      if (inOrOut === 'in') setIsDragging(true);
      if (inOrOut === 'out') setIsDragging(false);
      if (inOrOut === 'drop') {
          setIsDragging(false);
          handleFileChange(e.dataTransfer.files);
      }
  };

  // === CONVERSION LOGIC ===

  const convertToPdf = async (arrayBuffer: ArrayBuffer): Promise<Blob> => {
    const pdfDoc = await PDFDocument.create();
    
    if (fileType === "jpg" || fileType === "png" || fileType === "gif" || fileType === "bmp" || fileType === "webp") {
      let image;
      if (fileType === 'jpg') image = await pdfDoc.embedJpg(arrayBuffer);
      else image = await pdfDoc.embedPng(await convertToPng(arrayBuffer)); // Convert others to PNG first
      
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

    } else if (fileType === "svg") {
        const pngBlob = await convertImage(arrayBuffer, 'png');
        const pngBuffer = await pngBlob.arrayBuffer();
        const image = await pdfDoc.embedPng(pngBuffer);
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
  
  const convertImage = async (arrayBuffer: ArrayBuffer, targetFormat: Exclude<OutputFormat, 'pdf'>): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get canvas context'));

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const targetMimeType = `image/${targetFormat}`;
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Canvas to Blob conversion failed'));
          resolve(blob);
        }, targetMimeType, 0.95); // Use quality 0.95 for JPG
      };
      img.onerror = () => reject(new Error('Image loading failed. The file might be corrupt or an unsupported format.'));
      img.src = URL.createObjectURL(new Blob([arrayBuffer], { type: file?.type }));
    });
  };

  const convertToPng = async (arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> => {
    const blob = await convertImage(arrayBuffer, 'png');
    return blob.arrayBuffer();
  }

  const handleConvert = async () => {
    if (!file || !outputFormat) return;

    setStatus("converting");
    setConvertedFileUrl(null);
    setErrorMessage("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      let blob: Blob;

      if (outputFormat === 'pdf') {
        blob = await convertToPdf(arrayBuffer);
      } else {
        blob = await convertImage(arrayBuffer, outputFormat);
      }
      
      const url = URL.createObjectURL(blob);
      setConvertedFileUrl(url);
      setStatus("success");
      toast({
        title: "轉換成功！",
        description: `您的 ${outputFormat.toUpperCase()} 檔案已準備就緒。`,
      });

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      const errorMsg = err.message || "檔案轉換失敗。請確認檔案是否毀損或格式是否正確。";
      setErrorMessage(errorMsg);
      toast({
        variant: "destructive",
        title: "轉換錯誤",
        description: errorMsg,
      });
    }
  };
  
  // === UI RENDERING ===

  const getOutputFilename = () => {
    if (!file || !outputFormat) return "converted.file";
    const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
    return `${nameWithoutExtension || 'converted'}.${outputFormat}`;
  }

  const getFileIcon = () => {
    if (!file) return null;
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  }
  
  const acceptedFileTypes = useMemo(() => {
    return Object.keys(mimeTypeToType).join(',');
  }, []);

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
            onDragEnter={(e) => handleDragEvents(e, 'in')}
            onDragLeave={(e) => handleDragEvents(e, 'out')}
            onDragOver={(e) => handleDragEvents(e, 'over')}
            onDrop={(e) => handleDragEvents(e, 'drop')}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-center text-muted-foreground">
              <span className="font-semibold text-primary">點擊上傳</span> 或拖放檔案
            </p>
            <p className="text-xs text-muted-foreground mt-1">支援 DOCX, TXT, JPG, PNG, GIF, BMP, WEBP, SVG</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={acceptedFileTypes}
              onChange={(e) => handleFileChange(e.target.files)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="default" className="border-primary/20">
               <div className="flex items-center gap-2">
                {getFileIcon()}
                <AlertTitle className="truncate" title={file.name}>{file.name}</AlertTitle>
               </div>
              <AlertDescription className="flex justify-between items-center mt-2">
                <span>檔案已就緒。請選擇要轉換的格式。</span>
                 <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={resetState}>
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
                disabled={availableOutputFormats.length === 0}
               >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="選擇格式" />
                </SelectTrigger>
                <SelectContent>
                    {availableOutputFormats.length > 0 ? (
                        availableOutputFormats.map(format => (
                            <SelectItem key={format} value={format}>{format.toUpperCase()}</SelectItem>
                        ))
                    ) : (
                        <SelectItem value="none" disabled>無可用格式</SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleConvert}
              disabled={status === "converting" || !outputFormat || availableOutputFormats.length === 0}
              className="w-full"
            >
              {status === "converting" ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {status === "converting" 
                ? "轉換中..." 
                : (outputFormat ? `轉換為 ${outputFormat.toUpperCase()}` : "請選擇格式")
              }
            </Button>
          </div>
        )}

        {status === "success" && convertedFileUrl && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">轉換成功！</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-2 text-green-700">
              <span className="font-semibold truncate">{getOutputFilename()}</span>
              <Button asChild size="sm" className="flex-shrink-0">
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

    