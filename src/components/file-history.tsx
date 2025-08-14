
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Download, Trash2, FileArchive } from "lucide-react";
import JSZip from 'jszip';
import { ConversionResult } from "@/app/page";
import { getFileIcon } from "@/lib/icons";
import { usePreview } from "@/context/preview-provider";

interface FileHistoryProps {
  history: ConversionResult[];
  setHistory: React.Dispatch<React.SetStateAction<ConversionResult[]>>;
}

const getOutputFilename = (inputFile: File, outputFileType?: string): string => {
    if (!outputFileType) return "converted.file";
    const nameWithoutExtension = inputFile.name.split('.').slice(0, -1).join('.');
    return `${nameWithoutExtension || 'converted'}.${outputFileType}`;
};

export function FileHistory({ history, setHistory }: FileHistoryProps) {
  const { showPreview } = usePreview();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Create a Set of seen IDs to filter out duplicates for display
  const seen = new Set();
  const uniqueHistory = history.filter(item => {
    const duplicate = seen.has(item.id);
    seen.add(item.id);
    return !duplicate;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(uniqueHistory.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedItems(newSelection);
  };
  
  const handleDownload = (blob?: Blob, filename?: string) => {
    if (!blob || !filename) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    const newSelection = new Set(selectedItems);
    newSelection.delete(id);
    setSelectedItems(newSelection);
  };
  
  const getSelectedResultObjects = () => {
    return uniqueHistory.filter(r => selectedItems.has(r.id));
  };
  
  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const selected = getSelectedResultObjects();
    selected.forEach(result => {
        if (result.outputBlob) {
            const filename = getOutputFilename(result.inputFile, result.outputFileType);
            zip.file(filename, result.outputBlob);
        }
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    handleDownload(zipBlob, `LexiConvert_Batch_${Date.now()}.zip`);
  };

  const handleDownloadSelected = () => {
     const selected = getSelectedResultObjects();
     selected.forEach(result => {
        if (result.outputBlob) {
            const filename = getOutputFilename(result.inputFile, result.outputFileType);
            handleDownload(result.outputBlob, filename);
        }
    });
  };


  const handlePreview = (e: React.MouseEvent, file: File) => {
    e.preventDefault();
    showPreview(file, file.name);
  };

  const selectedCount = selectedItems.size;
  const allSelected = selectedCount === uniqueHistory.length && uniqueHistory.length > 0;

  return (
     <div className="space-y-4">
        {selectedCount > 0 && (
            <div className="flex justify-end items-center">
                {selectedCount > 1 ? (
                    <Button onClick={handleDownloadZip}>
                        <FileArchive className="mr-2 h-4 w-4" />
                        Download ZIP ({selectedCount})
                    </Button>
                ) : (
                    <Button onClick={handleDownloadSelected}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Selected ({selectedCount})
                    </Button>
                )}
            </div>
        )}
        <div className="border rounded-lg">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead className="w-[40px]">
                    <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        aria-label="Select all"
                        disabled={uniqueHistory.length === 0}
                    />
                </TableHead>
                <TableHead className="w-[50px]">Type</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px] text-right"></TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {uniqueHistory.map((item) => (
                <TableRow key={item.id} data-state={selectedItems.has(item.id) ? "selected" : ""}>
                 <TableCell>
                    <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => handleSelectOne(item.id, checked as boolean)}
                        aria-label={`Select ${item.inputFile.name}`}
                    />
                </TableCell>
                <TableCell>
                    <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
                        {getFileIcon(item.inputFile.name, item.inputFile.type)}
                    </div>
                </TableCell>
                <TableCell className="font-medium">
                    <span 
                        className="cursor-pointer hover:underline"
                        onClick={(e) => handlePreview(e, item.inputFile)}
                    >
                        {item.inputFile.name}
                    </span>
                </TableCell>
                <TableCell>
                    {new Date(parseInt(item.id.split('-')[1])).toLocaleString()}
                </TableCell>
                 <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(item.outputBlob, getOutputFilename(item.inputFile, item.outputFileType))}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>
    </div>
  );
}
