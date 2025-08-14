
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
  Book,
  FileSpreadsheet,
  FileX,
  FileCode,
  Database,
  Braces,
  FileJson,
  FileArchive,
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
import ePub from "epubjs";
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { Potrace } from 'potrace';
import * as pdfjsLib from 'pdfjs-dist';

// For Next.js, set the worker source
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
}

// === TYPES AND CONSTANTS ===

type ConversionStatus = "idle" | "converting" | "success" | "error";
type DocumentFileType = "docx" | "txt" | "epub" | "xlsx" | "pptx" | "pdf";
type ImageFileType = "jpg" | "png" | "gif" | "bmp" | "webp" | "svg";
type TextBasedFileType = "html" | "xml" | "csv" | "json" | "md" | "js" | "ts" | "css" | "py" | "sql";
type FileType = DocumentFileType | ImageFileType | TextBasedFileType | "unknown";
type OutputFormat = "pdf" | "jpg" | "png" | "webp" | "gif" | "bmp" | "svg" | "zip";

const mimeTypeToType: Record<string, FileType> = {
  // Documents
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "application/epub+zip": "epub",
  // Images
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  // Text-based & Code
  "text/html": "html",
  "text/xml": "xml",
  "application/xml": "xml",
  "text/csv": "csv",
  "application/json": "json",
  "text/markdown": "md",
  "application/javascript": "js",
  "text/javascript": "js",
  "application/x-typescript": "ts",
  "text/typescript": "ts",
  "text/css": "css",
  "text/x-python": "py",
  "application/sql": "sql",
};

const supportedConversions: Record<FileType, OutputFormat[]> = {
  // Documents
  docx: ["pdf"],
  xlsx: ["pdf"],
  pptx: [],
  pdf: ["png", "jpg", "webp", "bmp"],
  txt: ["pdf"],
  epub: ["pdf"],
  // Images
  jpg: ["pdf", "png", "webp", "gif", "bmp", "svg"],
  png: ["pdf", "jpg", "webp", "gif", "bmp", "svg"],
  gif: ["pdf", "jpg", "png", "webp", "bmp"],
  bmp: ["pdf", "jpg", "png", "webp", "gif", "svg"],
  webp: ["pdf", "jpg", "png", "gif", "bmp", "svg"],
  svg: ["pdf", "png", "jpg"],
  // Text-based
  html: ["pdf"],
  xml: ["pdf"],
  csv: ["pdf"],
  json: ["pdf"],
  md: ["pdf"],
  js: ["pdf"],
  ts: ["pdf"],
  css: ["pdf"],
  py: ["pdf"],
  sql: ["pdf"],
  // Unknown
  unknown: [],
};

// === HELPER FUNCTIONS ===

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
}

const getFileTypeFromMime = (mime: string, extension: string): FileType => {
    if (mime in mimeTypeToType) return mimeTypeToType[mime];
    // Fallback for types not correctly reported by browser
    const extMap: { [key: string]: FileType } = {
        'jpg': 'jpg', 'jpeg': 'jpg', 'png': 'png', 'gif': 'gif', 'bmp': 'bmp',
        'webp': 'webp', 'epub': 'epub', 'docx': 'docx', 'xlsx': 'xlsx',
        'pptx': 'pptx', 'svg': 'svg', 'html': 'html', 'htm': 'html',
        'xml': 'xml', 'csv': 'csv', 'json': 'json', 'md': 'md', 'js': 'js',
        'ts': 'ts', 'css': 'css', 'py': 'py', 'sql': 'sql', 'txt': 'txt',
        'pdf': 'pdf',
    };
    if (extMap[extension]) return extMap[extension];
    return "unknown";
}

// === CONVERSION HELPERS ===

const drawTextInPdf = async (pdfDoc: PDFDocument, textContent: string, useMonospace: boolean = false) => {
    const font = await pdfDoc.embedFont(useMonospace ? StandardFonts.Courier : StandardFonts.Helvetica);
    const fontSize = 10;
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    page.drawText(textContent, {
        x: 40, y: height - 4 * fontSize, font, size: fontSize, color: rgb(0, 0, 0), maxWidth: width - 80, lineHeight: 14
    });
}

const convertTextBasedToPdf = async (arrayBuffer: ArrayBuffer, isCode: boolean = false, isJson: boolean = false): Promise<Blob> => {
    const decoder = new TextDecoder("utf-8");
    let textContent = decoder.decode(arrayBuffer);
    if(isJson) {
        try {
            textContent = JSON.stringify(JSON.parse(textContent), null, 2);
        } catch (e) {
            // Not a valid JSON, just use the raw text
        }
    }

    const pdfDoc = await PDFDocument.create();
    await drawTextInPdf(pdfDoc, textContent, isCode || isJson);
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
}

const convertEpubToPdf = async (arrayBuffer: ArrayBuffer, toast: (options: { title: string; description: string; }) => void): Promise<Blob> => {
    const book = ePub(arrayBuffer);
    const pdfDoc = await PDFDocument.create();
    await book.ready;
    const textContent = (await Promise.all(book.spine.items.map(async (item) => {
        const doc = await item.load(book.load.bind(book));
        const body = doc.querySelector('body');
        if (body) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = body.innerHTML;
            return tempDiv.innerText || '';
        }
        return '';
    }))).join('\n\n');

    await drawTextInPdf(pdfDoc, textContent);
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
};

const convertDocxToPdf = async (arrayBuffer: ArrayBuffer, toast: (options: { title: string; description: string; }) => void): Promise<Blob> => {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const content = await zip.file("word/document.xml")?.async("string");
    
    let textContent = "無法讀取 DOCX 內容。這是一個實驗性功能。";
    if (content) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, "application/xml");
        const paragraphs = xmlDoc.getElementsByTagName("w:p");
        let text = [];
        for (let i = 0; i < paragraphs.length; i++) {
            text.push(Array.from(paragraphs[i].getElementsByTagName("w:t")).map(t => t.textContent).join(''));
        }
        textContent = text.join('\n');
    }
    
    toast({ title: "DOCX 轉換限制", description: "僅提取純文字，所有樣式和圖片均會遺失。" });
    const pdfDoc = await PDFDocument.create();
    await drawTextInPdf(pdfDoc, textContent);
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
}

const convertXlsxToPdf = async (arrayBuffer: ArrayBuffer, toast: (options: { title: string; description: string; }) => void): Promise<Blob> => {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_csv(worksheet);
    
    toast({ title: "XLSX 轉換限制", description: "僅轉換第一張工作表的數據為純文字，所有樣式、圖表和公式均會遺失。" });
    const pdfDoc = await PDFDocument.create();
    await drawTextInPdf(pdfDoc, data);
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
}

const convertImageToPdf = async (fileType: FileType, arrayBuffer: ArrayBuffer): Promise<Blob> => {
  const pdfDoc = await PDFDocument.create();
  
  if (fileType === "jpg" || fileType === "png" || fileType === "gif" || fileType === "bmp" || fileType === "webp") {
    let image;
    if (fileType === 'jpg') image = await pdfDoc.embedJpg(arrayBuffer);
    else image = await pdfDoc.embedPng(await convertToPng(arrayBuffer, fileType)); // Convert others to PNG first
    
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

  } else if (fileType === "svg") {
      const pngBlob = await convertImage(arrayBuffer, fileType, 'png');
      const pngBuffer = await pngBlob.arrayBuffer();
      const image = await pdfDoc.embedPng(pngBuffer);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

const convertPdfToImages = async (
  arrayBuffer: ArrayBuffer, 
  outputFormat: 'png' | 'jpg' | 'webp' | 'bmp', 
  toast: (options: any) => void
): Promise<{blob: Blob, isZip: boolean}> => {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    if (numPages === 0) {
        throw new Error("PDF 檔案沒有任何頁面。");
    }

    toast({ title: "開始轉換 PDF", description: `正在將 ${numPages} 個頁面轉換為 ${outputFormat.toUpperCase()} 圖片...` });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("無法建立 Canvas Context");
    
    const renderPage = async (pageNumber: number): Promise<Blob> => {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2.0 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = { canvasContext: ctx, viewport: viewport };
        await page.render(renderContext).promise;

        const mimeType = `image/${outputFormat === 'jpg' ? 'jpeg' : outputFormat}`;
        const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, mimeType, 0.95));
        if (!blob) throw new Error(`無法將頁面 ${pageNumber} 轉換為圖片`);
        page.cleanup();
        return blob;
    };

    if (numPages === 1) {
        const blob = await renderPage(1);
        canvas.remove();
        return { blob, isZip: false };
    } else {
        const zip = new JSZip();
        for (let i = 1; i <= numPages; i++) {
            const blob = await renderPage(i);
            zip.file(`page_${i}.${outputFormat}`, blob);
        }
        canvas.remove();
        toast({ title: "壓縮中...", description: "正在將所有圖片壓縮成 ZIP 檔案。" });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        return { blob: zipBlob, isZip: true };
    }
};

const convertImage = async (arrayBuffer: ArrayBuffer, sourceType: FileType, targetFormat: Exclude<OutputFormat, 'pdf' | 'svg' | 'zip'>): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('無法取得 Canvas context'));

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const targetMimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`;
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas to Blob 轉換失敗'));
        resolve(blob);
      }, targetMimeType, 0.95);
    };
    img.onerror = () => reject(new Error('圖片載入失敗。檔案可能已損毀或格式不支援。'));

    let srcUrl: string;
    const sourceMime = Object.keys(mimeTypeToType).find(key => mimeTypeToType[key] === sourceType);
    if (sourceType === 'svg') {
      const decoder = new TextDecoder('utf-8');
      const svgString = decoder.decode(arrayBuffer);
      srcUrl = 'data:image/svg+xml;base64,' + btoa(svgString);
    } else {
      srcUrl = URL.createObjectURL(new Blob([arrayBuffer], { type: sourceMime }));
    }
    
    img.src = srcUrl;
    // Clean up the object URL
    img.onloadend = () => {
        if(srcUrl.startsWith('blob:')) {
            URL.revokeObjectURL(srcUrl);
        }
    }
  });
};

const convertToPng = async (arrayBuffer: ArrayBuffer, sourceType: FileType): Promise<ArrayBuffer> => {
  const blob = await convertImage(arrayBuffer, sourceType, 'png');
  return blob.arrayBuffer();
}

const convertToSvg = (buffer: Buffer, toast: (options: { title: string; description: string; }) => void): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        toast({ title: "圖片轉 SVG 限制", description: "此為實驗性功能，複雜圖片轉換效果可能不佳。" });
        const potrace = new Potrace();
        potrace.setParameters({
            threshold: 128,
            turdSize: 100,
        });
        potrace.loadImage(buffer, (err) => {
            if (err) return reject(err);
            const svg = potrace.getSVG();
            resolve(new Blob([svg], { type: 'image/svg+xml' }));
        });
    });
};

// === REACT COMPONENT ===

export function Converter() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>("unknown");
  const [outputFormat, setOutputFormat] = useState<OutputFormat | null>(null);
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [convertedFileType, setConvertedFileType] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const availableOutputFormats = useMemo(() => {
    if (!file || fileType === "unknown") return [];
    
    let formats = supportedConversions[fileType] || [];
    
    if (fileType === 'pdf') {
        return formats;
    }

    const extension = getFileExtension(file.name) as OutputFormat;
    // User can convert an SVG to an SVG, which makes no sense.
    if (fileType === 'svg' && formats) {
        return formats.filter(f => f !== 'svg') || [];
    }
    return formats.filter(f => f !== extension);
    
  }, [file, fileType]);

  const resetState = useCallback(() => {
    setFile(null);
    setFileType("unknown");
    setOutputFormat(null);
    setStatus("idle");
    setErrorMessage("");
    setConvertedFileType("");
    if (convertedFileUrl) {
      URL.revokeObjectURL(convertedFileUrl);
      setConvertedFileUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [convertedFileUrl]);

  const handleUnsupportedFile = (extension: string) => {
     toast({
        variant: "destructive",
        title: "不支援的檔案格式",
        description: `抱歉，此離線版本不支援 .${extension} 檔案。`,
      });
  }

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    const selectedFile = files[0];
    if (!selectedFile) {
        return;
    }
    resetState();
    
    const extension = getFileExtension(selectedFile.name);
    const detectedType = getFileTypeFromMime(selectedFile.type, extension);

     if (detectedType === "unknown" || supportedConversions[detectedType].length === 0) {
      handleUnsupportedFile(extension);
      return;
    }
    
    setFile(selectedFile);
    setFileType(detectedType);
    
    let possibleFormats = (supportedConversions[detectedType] || []);
    if (detectedType !== 'pdf' && detectedType !== 'svg') {
        const currentExtension = getFileExtension(selectedFile.name) as OutputFormat;
        possibleFormats = possibleFormats.filter(f => f !== currentExtension);
    }
    
    if (possibleFormats.length > 0) {
      setOutputFormat(possibleFormats[0]);
    } else {
      setOutputFormat(null);
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

  // === MAIN CONVERSION LOGIC ===
  const handleConvert = async () => {
    if (!file || !outputFormat) return;

    setStatus("converting");
    setConvertedFileUrl(null);
    setErrorMessage("");
    setConvertedFileType("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      let blob: Blob;
      let finalOutputFormat = outputFormat;

      const imageOutputFormats = ["png", "jpg", "webp", "bmp"];
      if (fileType === 'pdf' && imageOutputFormats.includes(outputFormat)) {
          const result = await convertPdfToImages(arrayBuffer, outputFormat as 'png' | 'jpg' | 'webp' | 'bmp', toast);
          blob = result.blob;
          if (result.isZip) {
              finalOutputFormat = 'zip';
          }
      } else if (outputFormat === 'pdf') {
          switch(fileType) {
              case 'epub': blob = await convertEpubToPdf(arrayBuffer, toast); break;
              case 'docx': blob = await convertDocxToPdf(arrayBuffer, toast); break;
              case 'xlsx': blob = await convertXlsxToPdf(arrayBuffer, toast); break;
              case 'csv': // Fallthrough
              case 'txt': blob = await convertTextBasedToPdf(arrayBuffer); break;
              case 'json': blob = await convertTextBasedToPdf(arrayBuffer, true, true); break;
              case 'js':
              case 'ts':
              case 'css':
              case 'py':
              case 'sql':
              case 'xml':
              case 'html':
              case 'md':
                blob = await convertTextBasedToPdf(arrayBuffer, true, false); break;
              default: blob = await convertImageToPdf(fileType, arrayBuffer); break;
          }
      } else if (outputFormat === 'svg') {
          if (fileType === 'jpg' || fileType === 'png' || fileType === 'bmp' || fileType === 'gif' || fileType === 'webp') {
              const buffer = Buffer.from(arrayBuffer);
              blob = await convertToSvg(buffer, toast);
          } else {
              throw new Error("僅支援圖片格式轉為 SVG。");
          }
      }
      else {
        blob = await convertImage(arrayBuffer, fileType, outputFormat as Exclude<OutputFormat, 'pdf' | 'svg' | 'zip'>);
      }
      
      const url = URL.createObjectURL(blob);
      setConvertedFileUrl(url);
      setConvertedFileType(finalOutputFormat);
      setStatus("success");
      toast({
        title: "轉換成功！",
        description: `您的 ${finalOutputFormat.toUpperCase()} 檔案已準備就緒。`,
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
    if (!file || !convertedFileType) return "converted.file";
    const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
    return `${nameWithoutExtension || 'converted'}.${convertedFileType}`;
  }

  const getFileIcon = () => {
    if (!file) return null;
    const fileTypeStr = getFileTypeFromMime(file.type, getFileExtension(file.name));
    
    if (['jpg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileTypeStr)) {
        return <ImageIcon className="h-4 w-4" />;
    }
    if (fileTypeStr === 'epub') return <Book className="h-4 w-4" />;
    if (fileTypeStr === 'xlsx') return <FileSpreadsheet className="h-4 w-4" />;
    if (fileTypeStr === 'pptx') return <FileX className="h-4 w-4 text-destructive" />;
    if (fileTypeStr === 'csv' || fileTypeStr === 'sql') return <Database className="h-4 w-4" />;
    if (fileTypeStr === 'json') return <FileJson className="h-4 w-4" />;
    if (fileTypeStr === 'xml' || fileTypeStr === 'html') return <Braces className="h-4 w-4" />;
    if (['js', 'ts', 'css', 'py', 'md'].includes(fileTypeStr)) {
        return <FileCode className="h-4 w-4" />;
    }
    
    return <FileText className="h-4 w-4" />;
  }
  
  const acceptedFileTypes = useMemo(() => {
    const extensions = Object.keys(mimeTypeToType).concat(
      '.md', '.py', '.sql', '.htm', '.jpeg', '.ts' // Add extensions that might not have a unique mime type
    );
    return extensions.join(',');
  }, []);

  const getSelectLabel = (format: OutputFormat) => {
    return format.toUpperCase();
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
            <p className="text-xs text-muted-foreground mt-1">支援 PDF, DOCX, XLSX, TXT, EPUB, 圖片, 程式碼等多種格式</p>
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
                            <SelectItem key={format} value={format}>{getSelectLabel(format)}</SelectItem>
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
            <div className="flex items-center text-green-600">
                {convertedFileType === 'zip' ? <FileArchive className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            </div>
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
