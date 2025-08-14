
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
import { deleteConversion } from "@/lib/db";
import { motion } from "framer-motion";

interface FileHistoryProps {
  history: ConversionResult[];
  setHistory: React.Dispatch<React.SetStateAction<ConversionResult[]>>;
  onDelete: (id: string | string[]) => void;
}

const getOutputFilename = (inputFile: File, outputFileType?: string): string => {
    if (!outputFileType) return "converted.file";
    const nameWithoutExtension = inputFile.name.split('.').slice(0, -1).join('.');
    return `${nameWithoutExtension || 'converted'}.${outputFileType}`;
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};


export function FileHistory({ history, setHistory, onDelete }: FileHistoryProps) {
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

  const handleDelete = async (id: string) => {
    await deleteConversion(id);
    onDelete(id);
    const newSelection = new Set(selectedItems);
    newSelection.delete(id);
    setSelectedItems(newSelection);
  };

  const handleDeleteSelected = async () => {
    const idsToDelete = Array.from(selectedItems);
    for (const id of idsToDelete) {
        await deleteConversion(id);
    }
    onDelete(idsToDelete);
    setSelectedItems(new Set());
  }
  
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
    const zipBlob = await zip.generateAsync({ type: "blob" });
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


  const handlePreview = (e: React.MouseEvent, file: File | Blob, name: string) => {
    e.preventDefault();
    showPreview(file, name);
  };

  const selectedCount = selectedItems.size;
  const allSelected = selectedCount === uniqueHistory.length && uniqueHistory.length > 0;

  return (
     <div className="space-y-4">
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
                <TableHead className="w-[50px] text-right">
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={selectedCount === 0}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Batch Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleDownloadSelected} disabled={selectedCount === 0}>
                           <Download className="mr-2 h-4 w-4" />
                           Download Selected ({selectedCount})
                        </DropdownMenuItem>
                         {selectedCount > 1 && (
                            <DropdownMenuItem onClick={handleDownloadZip}>
                                <FileArchive className="mr-2 h-4 w-4" />
                                Download ZIP ({selectedCount})
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={handleDeleteSelected} className="text-destructive" disabled={selectedCount === 0}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Selected ({selectedCount})
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableHead>
            </TableRow>
            </TableHeader>
            <motion.tbody
                variants={listVariants}
                initial="hidden"
                animate="visible"
            >
            {uniqueHistory.map((item) => (
                <motion.tr
                    key={item.id}
                    variants={itemVariants}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    data-state={selectedItems.has(item.id) ? "selected" : ""}
                >
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
                        onClick={(e) => handlePreview(e, item.inputFile, item.inputFile.name)}
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
                        <DropdownMenuItem onClick={() => handleDownload(item.outputBlob, getOutputFilename(item.inputFile, item.outputFileType))} disabled={!item.outputBlob}>
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
                </motion.tr>
            ))}
            </motion.tbody>
        </Table>
        </div>
    </div>
  );
}
