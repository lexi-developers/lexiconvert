"use client";

import { useState, useCallback, useRef } from "react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun } from "docx";
import {
  UploadCloud,
  FileText,
  X,
  ArrowRight,
  CheckCircle,
  Download,
  AlertCircle,
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

type ConversionStatus = "idle" | "converting" | "success" | "error";

const CONVERSION_FORMATS = ["PDF", "DOCX", "TXT", "HTML", "JSON", "MD"];

export function Converter() {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>(CONVERSION_FORMATS[0]);
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [convertedFile, setConvertedFile] = useState<{ name: string; content: string | Uint8Array; type: string; } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setConversionProgress(0);
    setConvertedFile(null);
    setErrorMessage("");
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, []);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
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

  const handleConvert = async () => {
    if (!file) return;

    setStatus("converting");
    setConversionProgress(0);
    setConvertedFile(null);
    setErrorMessage("");

    const progressInterval = setInterval(() => {
      setConversionProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 100);

    try {
      const fileContent = await file.text();
      let convertedContent: string | Uint8Array;
      const newExtension = outputFormat.toLowerCase();
      
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const newFileName = `${baseName}.${newExtension}`;
      let blobType = "text/plain;charset=utf-8";
      
      switch(outputFormat) {
          case 'PDF': {
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const textSize = 11;
            const margin = 50;
            const textLines = fileContent.split('\n');
            
            let page = pdfDoc.addPage();
            let { height } = page.getSize();
            let y = height - margin;

            for (const line of textLines) {
              if (y < margin) {
                page = pdfDoc.addPage();
                height = page.getHeight();
                y = height - margin;
              }
              page.drawText(line, { x: margin, y, font, size: textSize });
              y -= textSize * 1.4;
            }

            convertedContent = await pdfDoc.save();
            blobType = "application/pdf";
            break;
          }
          case 'DOCX': {
            const doc = new Document({
              sections: [{
                children: fileContent.split('\n').map(line => new Paragraph({ children: [new TextRun(line)] })),
              }],
            });
            convertedContent = await Packer.toBuffer(doc);
            blobType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            break;
          }
          case 'HTML':
              convertedContent = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${file.name}</title>\n</head>\n<body>\n  <pre>${fileContent}</pre>\n</body>\n</html>`;
              break;
          case 'JSON':
              convertedContent = JSON.stringify({ source: file.name, content: fileContent }, null, 2);
              break;
          case 'MD':
              convertedContent = `# ${file.name}\n\n${fileContent}`;
              break;
          default: // TXT
              convertedContent = fileContent;
              break;
      }
      
      clearInterval(progressInterval);
      setConversionProgress(100);
      
      setTimeout(() => {
        setConvertedFile({ name: newFileName, content: convertedContent, type: blobType });
        setStatus("success");
      }, 300);

    } catch (err) {
      clearInterval(progressInterval);
      setStatus("error");
      const errorMsg = "Failed to read or convert the file. Please ensure it's a valid file.";
      setErrorMessage(errorMsg);
      toast({
        variant: "destructive",
        title: "Conversion Error",
        description: errorMsg,
      });
    }
  };

  const handleDownload = () => {
    if (!convertedFile) return;

    const blob = new Blob([convertedFile.content], { type: convertedFile.type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = convertedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>File Converter</CardTitle>
        <CardDescription>
          Upload a document and select the format to convert.
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
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">Supports PDF, DOCX, TXT, and other text-based files.</p>
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
                <span>File ready for conversion.</span>
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetState}>
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select output format" />
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
                disabled={status === "converting"}
                className="w-full sm:w-auto"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Convert
              </Button>
            </div>
          </div>
        )}

        {status === "converting" && (
            <div className="space-y-2 text-center">
                <Progress value={conversionProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">Converting...</p>
            </div>
        )}

        {status === "success" && convertedFile && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Conversion Successful!</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-2 text-green-700">
              Your file <span className="font-semibold">{convertedFile.name}</span> is ready.
              <Button onClick={handleDownload} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Conversion Failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
