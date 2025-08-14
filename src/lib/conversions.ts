
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import ePub from "epubjs";
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { Potrace } from 'potrace';
import * as pdfjsLib from 'pdfjs-dist';
import { toast } from "@/hooks/use-toast";


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
export type ImageFileType = "jpg" | "png" | "gif" | "bmp" | "webp" | "svg" | "ico";
export type AudioFileType = "mp3" | "wav" | "m4a" | "ogg";
export type VideoFileType = "mp4" | "mov" | "avi" | "webm";
export type TextBasedFileType = "html" | "xml" | "csv" | "json" | "md" | "js" | "ts" | "css" | "py" | "sql";
export type FileType = DocumentFileType | ImageFileType | AudioFileType | VideoFileType | TextBasedFileType | "unknown";
export type OutputFormat = "pdf" | "jpg" | "png" | "webp" | "gif" | "bmp" | "svg" | "zip" | "ico" | "mp3" | "wav" | "mp4" | "mov";

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
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  // Audio
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/webm": "ogg",
  // Video
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/webm": "webm",
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
  jpg: ["png", "pdf", "webp", "gif", "bmp", "svg", "ico"],
  png: ["jpg", "pdf", "webp", "gif", "bmp", "svg", "ico"],
  gif: ["png", "pdf", "jpg", "webp", "bmp", "ico", "mp4"], // Added MP4
  bmp: ["png", "pdf", "jpg", "webp", "gif", "svg", "ico"],
  webp: ["png", "pdf", "jpg", "gif", "bmp", "svg", "ico"],
  svg: ["png", "pdf", "jpg", "ico"],
  ico: ["png", "jpg", "webp", "bmp", "gif", "pdf"],
  // Audio
  mp3: ["wav"],
  wav: ["mp3"],
  m4a: ["mp3", "wav"],
  ogg: ["mp3", "wav"],
  // Video
  mp4: ["gif", "mp3", "mov"], // Added MOV (mock)
  mov: ["mp4", "gif", "mp3"], // Added MP4 (mock) and GIF
  avi: ["mp4", "gif", "mp3"],
  webm: ["mp4", "gif", "mp3"],
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
        'pdf': 'pdf', 'ico': 'ico',
        'mp3': 'mp3', 'wav': 'wav', 'm4a': 'm4a', 'ogg': 'ogg',
        'mp4': 'mp4', 'mov': 'mov', 'avi': 'avi', 'webm': 'webm'
    };
    if (extMap[extension]) return extMap[extension];
    return "unknown";
}


// === CONVERSION HELPERS ===

const mockApiCall = (file: File, outputFormat: string, toast: (options:any) => void): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        toast({
            description: `This is a placeholder. In a real app, '${file.name}' would be uploaded and converted to ${outputFormat.toUpperCase()} on a server.`
        });
        setTimeout(() => {
            // Simulate a successful conversion by creating a dummy file
            const dummyContent = `This is a mock converted ${outputFormat.toUpperCase()} file from ${file.name}.`;
            let mimeType = 'application/octet-stream';
            if (['mp4', 'mov'].includes(outputFormat)) {
                mimeType = `video/${outputFormat}`;
            } else if (outputFormat === 'mp3') {
                mimeType = 'audio/mpeg';
            }
            const blob = new Blob([dummyContent], { type: mimeType });
            resolve(blob);
        }, 3000);
    });
};

const convertAudio = async(file: File, outputFormat: 'mp3' | 'wav', toast: (options: any) => void): Promise<Blob> => {
    // In a real app, this would be an API call to a backend with FFMPEG
    return mockApiCall(file, outputFormat, toast);
}

const convertVideoToGif = (file: File, toast: (options: any) => void): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        toast({ description: "Starting video to GIF conversion. This may be slow and consume significant memory." });
        
        // Dynamically import gif.js
        const { default: GIF } = await import('gif.js');

        const videoUrl = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.muted = true;
        video.src = videoUrl;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            URL.revokeObjectURL(videoUrl);
            return reject(new Error("Could not create canvas context."));
        }

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const duration = video.duration;
            const frameRate = 10; // Capture 10 frames per second
            const frameDelay = 1000 / frameRate; // Delay in ms

            const gif = new GIF({
                workers: 2,
                quality: 10,
                workerScript: new URL('gif.js/dist/gif.worker.js', import.meta.url).toString(),
            });

            video.currentTime = 0;
            let framesAdded = 0;

            video.onseeked = () => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                gif.addFrame(ctx, { copy: true, delay: frameDelay });
                framesAdded++;

                if (video.currentTime < duration) {
                    video.currentTime += 1 / frameRate;
                } else {
                    toast({ description: "Finalizing GIF, please wait..." });
                    gif.on('finished', (blob: Blob) => {
                        URL.revokeObjectURL(videoUrl);
                        video.remove();
                        canvas.remove();
                        resolve(blob);
                    });
                    gif.render();
                }
            };

            // Start the process
            video.onseeked(new Event('seeked'));
        };

        video.onerror = (e) => {
            URL.revokeObjectURL(videoUrl);
            reject(new Error("Failed to load video file. It might be in a format your browser doesn't support."));
        };
    });
};

const convertGifToVideo = (gifFile: File, outputFormat: 'mp4', toast: (options: any) => void): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        toast({ description: "Starting GIF to MP4 conversion. This can be memory intensive." });

        const { default: GIF } = await import('gif.js');

        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(gifFile);

        fileReader.onload = async (event) => {
            const buffer = event.target?.result as ArrayBuffer;
            if (!buffer) return reject(new Error("Could not read GIF file"));

            try {
                // This is a workaround to parse GIF frames using a library designed for encoding.
                // A proper solution would use a dedicated GIF parsing library.
                // The gif.js library does not expose a parsing API directly.
                // We will have to draw the GIF on a canvas and capture frames.
                
                const gifUrl = URL.createObjectURL(gifFile);
                const img = new Image();
                img.src = gifUrl;

                img.onload = async () => {
                     // We can't easily get individual frames and their delays from a GIF in the browser.
                    // This is a major limitation for a high-quality conversion.
                    // A proper implementation requires a GIF decoder library.
                    // As a fallback, we treat it as a video-to-video conversion with a mock API.
                    URL.revokeObjectURL(gifUrl);
                    toast({ description: "Browser-based GIF to Video conversion is highly experimental and limited." });
                    const mockResult = await mockApiCall(gifFile, outputFormat, toast);
                    resolve(mockResult);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(gifUrl);
                    reject(new Error("Failed to load GIF as image."));
                }
            } catch (error: any) {
                reject(new Error(`Failed to process GIF: ${error.message}`));
            }
        };

        fileReader.onerror = () => {
            reject(new Error("Failed to read the GIF file."));
        };
    });
};


const convertVideo = async(file: File, fileType: VideoFileType, outputFormat: 'mp4' | 'gif' | 'mp3' | 'mov', toast: (options: any) => void): Promise<Blob> => {
    if (outputFormat === 'gif') {
        return convertVideoToGif(file, toast);
    }
    // In a real app, this would be an API call to a backend with FFMPEG for other formats
    return mockApiCall(file, outputFormat, toast);
}

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

const convertDocxToPdf = async (arrayBuffer: ArrayBuffer, toast: (options: { description: string; }) => void): Promise<Blob> => {
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
    
    toast({ description: "DOCX Conversion Limitation: Only plain text is extracted. All styling and images are lost." });
    const pdfDoc = await PDFDocument.create();
    await drawTextInPdf(pdfDoc, textContent);
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
}

const convertXlsxToPdf = async (arrayBuffer: ArrayBuffer, toast: (options: { description: string; }) => void): Promise<Blob> => {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_csv(worksheet);
    
    toast({ description: "XLSX Conversion Limitation: Only data from the first sheet is converted to plain text. All styling, charts, and formulas are lost." });
    const pdfDoc = await PDFDocument.create();
    await drawTextInPdf(pdfDoc, data);
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
}

const convertImageToPdf = async (fileType: FileType, arrayBuffer: ArrayBuffer): Promise<Blob> => {
  const pdfDoc = await PDFDocument.create();
  
  if (fileType === "jpg" || fileType === "png" || fileType === "gif" || fileType === "bmp" || fileType === "webp" || fileType === "ico") {
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

    toast({ description: `Converting ${numPages} page(s) to ${outputFormat.toUpperCase()}...` });
    
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
        toast({ description: "Compressing all images into a ZIP file." });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        return { blob: zipBlob, isZip: true };
    }
};

const convertImage = async (arrayBuffer: ArrayBuffer, sourceType: FileType, targetFormat: Exclude<OutputFormat, 'pdf' | 'svg' | 'zip' | 'ico' | 'mp3' | 'wav' | 'mp4' | 'mov'>): Promise<Blob> => {
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
    const sourceMime = Object.keys(mimeTypeToType).find(key => mimeTypeToType[key] === sourceType) || `image/${sourceType}`;
    
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

const convertImageToIco = async (arrayBuffer: ArrayBuffer, sourceType: FileType): Promise<Blob> => {
    // 1. Load the source image
    const sourceBlob = new Blob([arrayBuffer], { type: `image/${sourceType}` });
    const imageBitmap = await createImageBitmap(sourceBlob);

    // 2. Resize to 32x32 on a canvas
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas context");
    ctx.drawImage(imageBitmap, 0, 0, 32, 32);

    // 3. Get the PNG data from the canvas
    const pngDataUrl = canvas.toDataURL('image/png');
    const pngBuffer = await (await fetch(pngDataUrl)).arrayBuffer();
    const pngView = new DataView(pngBuffer);

    // 4. Manually construct the ICO file
    // ICO header (6 bytes) + ICONDIRENTRY (16 bytes) + PNG data
    const icoBuffer = new ArrayBuffer(6 + 16 + pngBuffer.byteLength);
    const icoView = new DataView(icoBuffer);

    // ICONDIR header
    icoView.setUint16(0, 0, true); // Reserved, must be 0
    icoView.setUint16(2, 1, true); // Type: 1 for icon
    icoView.setUint16(4, 1, true); // Number of images

    // ICONDIRENTRY
    icoView.setUint8(6, 32); // Width (32px)
    icoView.setUint8(7, 32); // Height (32px)
    icoView.setUint8(8, 0);  // Color count (0 for > 256)
    icoView.setUint8(9, 0);  // Reserved, should be 0
    icoView.setUint16(10, 1, true); // Color planes
    icoView.setUint16(12, 32, true); // Bits per pixel
    icoView.setUint32(14, pngBuffer.byteLength, true); // Size of image data
    icoView.setUint32(18, 22, true); // Offset of image data (6+16)

    // Copy PNG data
    const icoBytes = new Uint8Array(icoBuffer);
    const pngBytes = new Uint8Array(pngBuffer);
    icoBytes.set(pngBytes, 22);

    return new Blob([icoBuffer], { type: 'image/vnd.microsoft.icon' });
};


const convertToPng = async (arrayBuffer: ArrayBuffer, sourceType: FileType): Promise<ArrayBuffer> => {
  const blob = await convertImage(arrayBuffer, sourceType, 'png');
  return blob.arrayBuffer();
}

const convertToSvg = (buffer: Buffer, toast: (options: { description: string; }) => void): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        toast({ description: "Image to SVG Limitation: This is an experimental feature. Conversion may not work well for complex images." });
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

    const imageOutputFormats: (OutputFormat)[] = ["png", "jpg", "webp", "bmp", "gif"];
    const audioOutputFormats: (OutputFormat)[] = ["mp3", "wav"];
    const videoOutputFormats: (OutputFormat)[] = ["mp4", "gif", "mov"];

    if (audioOutputFormats.includes(outputFormat)) {
        blob = await convertAudio(file, outputFormat as 'mp3' | 'wav', toast);
    } else if (fileType === 'gif' && outputFormat === 'mp4') {
        blob = await convertGifToVideo(file, outputFormat, toast);
    } else if (['mp4', 'mov', 'avi', 'webm'].includes(fileType) && videoOutputFormats.includes(outputFormat)) {
        blob = await convertVideo(file, fileType as VideoFileType, outputFormat as 'mp4' | 'gif' | 'mov', toast);
    }
    else if (fileType === 'pdf' && imageOutputFormats.includes(outputFormat)) {
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
    } else if (outputFormat === 'ico') {
        if (fileType === 'png' || fileType === 'jpg' || fileType === 'webp' || fileType === 'bmp' || fileType === 'gif' || fileType === 'svg') {
            blob = await convertImageToIco(arrayBuffer, fileType);
        } else {
            throw new Error(`Conversion from ${fileType} to ICO is not supported.`);
        }
    }
    else {
      blob = await convertImage(arrayBuffer, fileType, outputFormat as Exclude<OutputFormat, 'pdf' | 'svg' | 'zip' | 'ico' | 'mp3' | 'wav' | 'mp4' | 'mov'>);
    }
    return { blob, finalOutputFormat };
}
