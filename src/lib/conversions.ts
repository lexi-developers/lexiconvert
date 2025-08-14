
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
export type OutputFormat = "pdf" | "jpg" | "png" | "webp" | "gif" | "bmp" | "svg" | "zip" | "ico" | "mp3" | "wav" | "m4a" | "ogg" | "mp4" | "mov";

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
    // This list now only contains REAL, browser-achievable conversions.
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
    gif: ["png", "pdf", "jpg", "webp", "bmp", "ico", "mp4"],
    bmp: ["png", "pdf", "jpg", "webp", "gif", "svg", "ico"],
    webp: ["png", "pdf", "jpg", "gif", "bmp", "svg", "ico"],
    svg: ["png", "pdf", "jpg", "ico"],
    ico: ["png", "jpg", "webp", "bmp", "gif", "pdf"],
    // Audio (Real conversions)
    mp3: ["wav"],
    wav: ["mp3"],
    m4a: [],
    ogg: [],
    // Video (Real conversions)
    mp4: ["gif"],
    mov: ["gif"],
    avi: [],
    webm: [],
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
            description: `This conversion (${file.type} to ${outputFormat}) is not supported in the browser. This is a placeholder.`
        });
        setTimeout(() => {
            // Simulate an error or dummy file
             reject(new Error(`Browser-based conversion for ${file.name} to ${outputFormat} is not supported.`));
        }, 1000);
    });
};

const convertAudio = async(file: File, outputFormat: 'mp3' | 'wav', toast: (options: any) => void): Promise<Blob> => {
    toast({ description: "Decoding audio file... This may take a moment." });

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    if (outputFormat === 'wav') {
        toast({ description: "Encoding to WAV..." });
        // Source: https://github.com/awordforthat/web-audio-recording-tests/blob/master/js/WavAudioEncoder.js
        const getWavBlob = (buffer: AudioBuffer) => {
            const numOfChan = buffer.numberOfChannels;
            const length = buffer.length * numOfChan * 2 + 44;
            const bufferArray = new ArrayBuffer(length);
            const view = new DataView(bufferArray);
            const channels = [];
            let i, sample;
            let offset = 0;
            let pos = 0;

            // write WAV header
            const setUint16 = (data: number) => {
                view.setUint16(pos, data, true);
                pos += 2;
            }
            const setUint32 = (data: number) => {
                view.setUint32(pos, data, true);
                pos += 4;
            }

            setUint32(0x46464952); // "RIFF"
            setUint32(length - 8); // file length - 8
            setUint32(0x45564157); // "WAVE"

            setUint32(0x20746d66); // "fmt " chunk
            setUint32(16); // length = 16
            setUint16(1); // PCM (uncompressed)
            setUint16(numOfChan);
            setUint32(buffer.sampleRate);
            setUint32(buffer.sampleRate * 2 * numOfChan); // avg bytes/sec
            setUint16(numOfChan * 2); // block-align
            setUint16(16); // 16-bit

            setUint32(0x61746164); // "data" - chunk
            setUint32(length - pos - 4); // chunk length

            // write interleaved data
            for (i = 0; i < numOfChan; i++) {
                channels.push(buffer.getChannelData(i));
            }

            while (pos < length) {
                for (i = 0; i < numOfChan; i++) {
                    sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
                    sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
                    view.setInt16(pos, sample, true);
                    pos += 2;
                }
                offset++;
            }
            return new Blob([view], { type: 'audio/wav' });
        }
        return getWavBlob(audioBuffer);
    }

    if (outputFormat === 'mp3') {
        toast({ description: "MP3 encoding in the browser is experimental and may be slow. Please wait." });
        // Dynamically import lamejs
        const { Mp3Encoder } = await import('lamejs');
        const encoder = new Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, 128); // 128 kbps
        const mp3Data = [];
        
        const samples = new Int16Array(44100); // chunk size
        let remaining = audioBuffer.length;
        
        for (let i = 0; remaining >= 0; i += samples.length) {
            const left = audioBuffer.getChannelData(0).subarray(i, i + samples.length);
            const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1).subarray(i, i + samples.length) : left;
            
            // convert to Int16
            for (let j = 0; j < left.length; j++) {
                samples[j] = Math.max(-1, Math.min(1, left[j])) * 32767;
            }
            
            const mp3buf = encoder.encodeBuffer(samples);
            if (mp3buf.length > 0) {
                mp3Data.push(new Int8Array(mp3buf));
            }
            remaining -= samples.length;
        }
        
        const mp3buf = encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(new Int8Array(mp3buf));
        }

        return new Blob(mp3Data, { type: 'audio/mpeg' });
    }
    
    // Fallback for any other requested formats
    throw new Error(`Audio conversion to ${outputFormat} is not supported.`);
}


const convertVideoToGif = (file: File, toast: (options: any) => void): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        toast({ description: "Starting video to GIF conversion. This may be slow and consume significant memory." });
        
        const { default: GIF } = await import('gif.js');

        const videoUrl = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata'; // Use metadata to get duration faster
        video.src = videoUrl;

        video.addEventListener('error', (e) => {
            URL.revokeObjectURL(videoUrl);
            reject(new Error("Failed to load video file. It might be in an unsupported format or corrupt."));
        });

        video.addEventListener('loadedmetadata', async () => {
            // Immediately revoke URL after getting metadata as we don't need it for playback anymore
            URL.revokeObjectURL(videoUrl);
            const duration = video.duration;

            if (!isFinite(duration) || duration <= 0) {
                return reject(new Error("Invalid or zero-length video duration. Cannot convert to GIF."));
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error("Could not create canvas context."));
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Optimization: Lower frame rate and increase quality (higher value is lower quality for gif.js)
            const frameRate = 8; 
            const frameDelay = 1000 / frameRate;

            const gif = new GIF({
                workers: 2,
                quality: 15, // Increased from 10 to 15 to trade quality for speed
                workerScript: new URL('gif.js/dist/gif.worker.js', import.meta.url).toString(),
            });

            gif.on('finished', (blob: Blob) => {
                video.remove();
                canvas.remove();
                resolve(blob);
            });
            
            gif.on('progress', (p: number) => {
                 toast({ description: `Encoding GIF: ${Math.round(p * 100)}% complete`});
            });


            let currentTime = 0;
            video.currentTime = currentTime;
            
            await new Promise(resolveSeek => {
                video.addEventListener('seeked', () => resolveSeek(null), { once: true });
            });


            const captureFrame = async () => {
                if (!ctx) return;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const validDelay = isFinite(frameDelay) ? frameDelay : 100;
                gif.addFrame(ctx, { copy: true, delay: validDelay });
                
                currentTime += 1 / frameRate;

                if (currentTime <= duration) {
                    video.currentTime = currentTime;
                    await new Promise(rs => video.addEventListener('seeked', () => rs(null), { once: true }));
                    // Use timeout to prevent call stack overflow and unblock the main thread
                    setTimeout(captureFrame, 0);
                } else {
                    toast({ description: "Finalizing GIF, please wait..." });
                    gif.render();
                }
            };

            captureFrame();
        });
    });
};


const convertGifToVideo = async (gifFile: File, outputFormat: 'mp4', toast: (options: any) => void): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        toast({ description: "Decoding GIF frames. This may be slow for large animations." });

        const { default: GIF } = await import('gif.js');

        // This is a workaround to parse GIF frames using gif.js's logic
        const tempGif = new GIF({ workers: 1, workerScript: new URL('gif.js/dist/gif.worker.js', import.meta.url).toString() });
        const reader = new FileReader();

        reader.onload = async (e) => {
            if (!e.target || !e.target.result) {
                return reject(new Error("Failed to read GIF file."));
            }
            const arrayBuffer = e.target.result as ArrayBuffer;

            // This is a super-hacky way to get the frames from the gif.js library,
            // as it doesn't expose them directly. We'll add one dummy frame,
            // which forces it to process the input, then intercept the frame data.
            let frames: any[] = [];
            const originalAddFrame = (tempGif as any).addFrame;
            (tempGif as any).addFrame = (image: any, options: any) => {
                frames.push({ ...options });
            };
            
            (tempGif as any).onRenderFrame({
              data: new Uint8Array(arrayBuffer)
            });

            if (frames.length === 0) {
                return reject(new Error("Could not decode any frames from the GIF."));
            }

            toast({ description: `Found ${frames.length} frames. Preparing for video encoding...`});
            
            // This feature is highly experimental and might not work in all browsers.
            // A proper implementation would require a WASM-based MP4 muxer.
            // For now, we will throw a more informative error.
            reject(new Error("Browser-based GIF to MP4 encoding is not yet supported. This is an experimental stub."));
        };

        reader.onerror = () => reject(new Error("Error reading GIF file."));
        reader.readAsArrayBuffer(gifFile);
    });
};


const convertVideo = async(file: File, fileType: VideoFileType, outputFormat: OutputFormat, toast: (options: any) => void): Promise<Blob> => {
    if ((fileType === 'mp4' || fileType === 'mov' || fileType === 'webm') && outputFormat === 'gif') {
        return convertVideoToGif(file, toast);
    }
    if (fileType === 'gif' && outputFormat === 'mp4') {
        return convertGifToVideo(file, outputFormat, toast);
    }
    
    throw new Error(`Video conversion from ${fileType} to ${outputFormat} is not supported.`);
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

const convertImage = async (arrayBuffer: ArrayBuffer, sourceType: FileType, targetFormat: Exclude<OutputFormat, 'pdf' | 'svg' | 'zip' | 'ico' | 'mp3' | 'wav' | 'mp4' | 'mov' | 'm4a' | 'ogg'>): Promise<Blob> => {
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
    const videoOutputFormats: (OutputFormat)[] = ["mp4", "gif"];

    if (audioOutputFormats.includes(outputFormat)) {
        blob = await convertAudio(file, outputFormat as 'mp3' | 'wav', toast);
    } else if (['mp4', 'mov', 'avi', 'webm', 'gif'].includes(fileType) && videoOutputFormats.includes(outputFormat)) {
        blob = await convertVideo(file, fileType as VideoFileType, outputFormat, toast);
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
      blob = await convertImage(arrayBuffer, fileType, outputFormat as Exclude<OutputFormat, 'pdf' | 'svg' | 'zip' | 'ico' | 'mp3' | 'wav' | 'mp4' | 'mov' | 'm4a' | 'ogg'>);
    }
    return { blob, finalOutputFormat };
}
