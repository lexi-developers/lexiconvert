
import {
  FileText,
  ImageIcon,
  Book,
  FileSpreadsheet,
  FileX,
  FileCode,
  Database,
  Braces,
  FileJson,
  FileArchive,
} from "lucide-react";
import { getFileExtension, getFileTypeFromMime, FileType } from "./conversions";

export const getFileIcon = (filename: string, filetype: string) => {
    const extension = getFileExtension(filename);
    const type = getFileTypeFromMime(filetype, extension);
    
    if (['jpg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(type)) {
        return <ImageIcon className="h-full w-full" />;
    }
    if (type === 'epub') return <Book className="h-full w-full" />;
    if (type === 'xlsx') return <FileSpreadsheet className="h-full w-full" />;
    if (type === 'pptx') return <FileX className="h-full w-full text-destructive" />;
    if (type === 'csv' || type === 'sql') return <Database className="h-full w-full" />;
    if (type === 'json') return <FileJson className="h-full w-full" />;
    if (type === 'xml' || type === 'html') return <Braces className="h-full w-full" />;
    if (['js', 'ts', 'css', 'py', 'md'].includes(type)) {
        return <FileCode className="h-full w-full" />;
    }
    if (type === 'zip') return <FileArchive className="h-full w-full" />;
    
    return <FileText className="h-full w-full" />;
};
