import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import ePub from "epubjs";
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { Potrace } from 'potrace';
import * as pdfjsLib from 'pdfjs-dist';
import { Toast } from "@/hooks/use-toast";

// For Next.js, set the worker source
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
}

// === UNIQUE ID GENERATOR ===
export const generateUniqueId = (filename: string) => {
    // Use Math.random() to ensure uniqueness even across hot-reloads.
    return `${filename}-${Date.now()}-${Math.random()}`;
}

// === TYPES AND CONSTANTS ===

export type DocumentFileType = "docx" | "txt" | "epub" | "xlsx" | "pptx" | "pdf";
export type ImageFileType = "jpg" | "png" | "gif" | "bmp" | "webp" | "svg";
export type TextBasedFileType = "html" | "xml" | "csv" | "json" | "md" | "js" | "ts" | "css" | "py" | "sql";
export type FileType = DocumentFileType | ImageFileType | TextBasedFileType | "unknown";
export type OutputFormat = "pdf" | "jpg" | "png" | "webp" | "gif" | "bmp" | "svg" | "zip";

export const mimeTypeToType: Record<string, FileType> = {
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

export const supportedConversions: Record<FileType, OutputFormat[]> = {
  // Documents
  docx: ["pdf"],
  xlsx: ["pdf"],
  pptx: [],
  pdf: ["png", "jpg", "webp", "bmp"],
  txt: ["pdf"],
  epub: ["pdf"],
  // Images
  jpg: ["png", "pdf", "webp", "gif", "bmp", "svg"],
  png: ["jpg", "pdf", "webp", "gif", "bmp", "svg"],
  gif: ["png", "pdf", "jpg", "webp", "bmp"],
  bmp: ["png", "pdf", "jpg", "webp", "gif", "svg"],
  webp: ["png", "pdf", "jpg", "gif", "bmp", "svg"],
  svg: ["png", "pdf", "jpg"],
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

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export const getFileTypeFromMime = (mime: string, extension: string): FileType => {
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

const convertEpubToPdf = async (arrayBuffer: ArrayBuffer): Promise<Blob> => {
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
    
    let textContent = "Could not read DOCX content. This is an experimental feature.";
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
    
    toast({ title: "DOCX Conversion Limitation", description: "Only plain text is extracted. All styling and images are lost." });
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
    
    toast({ title: "XLSX Conversion Limitation", description: "Only data from the first sheet is converted to plain text. All styling, charts, and formulas are lost." });
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
        throw new Error("The PDF file has no pages.");
    }

    toast({ title: "Starting PDF Conversion", description: `Converting ${numPages} page(s) to ${outputFormat.toUpperCase()}...` });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create Canvas Context");
    
    const renderPage = async (pageNumber: number): Promise<Blob> => {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2.0 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = { canvasContext: ctx, viewport: viewport };
        await page.render(renderContext).promise;

        const mimeType = `image/${outputFormat === 'jpg' ? 'jpeg' : outputFormat}`;
        const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, mimeType, 0.95));
        if (!blob) throw new Error(`Failed to convert page ${pageNumber} to image`);
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
        toast({ title: "Compressing...", description: "Compressing all images into a ZIP file." });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        return { blob: zipBlob, isZip: true };
    }
};

const convertImage = async (arrayBuffer: ArrayBuffer, sourceType: FileType, targetFormat: Exclude<OutputFormat, 'pdf' | 'svg' | 'zip'>): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Could not get Canvas context'));

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const targetMimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`;
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas to Blob conversion failed'));
        resolve(blob);
      }, targetMimeType, 0.95);
    };
    img.onerror = () => reject(new Error('Image failed to load. The file may be corrupt or in an unsupported format.'));

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
        toast({ title: "Image to SVG Limitation", description: "This is an experimental feature. Conversion may not work well for complex images." });
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


export const performConversion = async (file: File, fileType: FileType, outputFormat: OutputFormat, toast: (options: any) => void): Promise<{blob: Blob, finalOutputFormat: string}> => {
    const arrayBuffer = await file.arrayBuffer();
    let blob: Blob;
    let finalOutputFormat: string = outputFormat;

    const imageOutputFormats = ["png", "jpg", "webp", "bmp"];
    if (fileType === 'pdf' && imageOutputFormats.includes(outputFormat)) {
        const result = await convertPdfToImages(arrayBuffer, outputFormat as 'png' | 'jpg' | 'webp' | 'bmp', toast);
        blob = result.blob;
        if (result.isZip) {
            finalOutputFormat = 'zip';
        }
    } else if (outputFormat === 'pdf') {
        switch(fileType) {
            case 'epub': blob = await convertEpubToPdf(arrayBuffer); break;
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
            throw new Error("Only image formats can be converted to SVG.");
        }
    }
    else {
      blob = await convertImage(arrayBuffer, fileType, outputFormat as Exclude<OutputFormat, 'pdf' | 'svg' | 'zip'>);
    }
    return { blob, finalOutputFormat };
}
