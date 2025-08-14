
"use client";

import { useState, useEffect } from "react";
import { ConversionResult } from "@/app/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, XCircle, FileArchive } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import JSZip from 'jszip';

interface ConversionResultStepProps {
  results: ConversionResult[];
  onDone: () => void;
}

const getOutputFilename = (inputFile: File, outputFileType?: string): string => {
    if (!outputFileType) return "converted.file";
    const nameWithoutExtension = inputFile.name.split('.').slice(0, -1).join('.');
    return `${nameWithoutExtension || 'converted'}.${outputFileType}`;
};


export function ConversionResultStep({ results, onDone }: ConversionResultStepProps) {
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  
  const successfulConversions = results.filter(r => r.status === 'success');

  // Pre-select all successful conversions on initial render
  useEffect(() => {
    setSelectedResults(new Set(successfulConversions.map(r => r.id)));
  }, [results]); // Dependency on results ensures this runs only when results change

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedResults(new Set(successfulConversions.map(r => r.id)));
    } else {
      setSelectedResults(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedResults);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedResults(newSelection);
  };

  const getSelectedResultObjects = () => {
    return results.filter(r => selectedResults.has(r.id));
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

  const handleDownloadAllAsZip = async () => {
    const zip = new JSZip();
    const selected = getSelectedResultObjects();
    selected.forEach(result => {
      if (result.status === 'success' && result.outputBlob) {
        const filename = getOutputFilename(result.inputFile, result.outputFileType);
        zip.file(filename, result.outputBlob);
      }
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    handleDownload(zipBlob, `LexiConvert_Batch_${Date.now()}.zip`);
  };

  const handleDownloadAllIndividually = () => {
     const selected = getSelectedResultObjects();
     selected.forEach(result => {
      if (result.status === 'success' && result.outputBlob) {
        const filename = getOutputFilename(result.inputFile, result.outputFileType);
        handleDownload(result.outputBlob, filename);
      }
    });
  }

  const selectedCount = selectedResults.size;
  const allSuccessfulSelected = selectedCount === successfulConversions.length && successfulConversions.length > 0;
  const someSuccessfulSelected = selectedCount > 0 && selectedCount < successfulConversions.length;


  return (
    <div className="space-y-6">
        <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-2xl font-semibold">Conversion Complete!</h2>
            <p className="mt-1 text-muted-foreground">Select files to download.</p>
        </div>
        
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[40px]">
                       <Checkbox
                        checked={allSuccessfulSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                        disabled={successfulConversions.length === 0}
                      />
                    </TableHead>
                    <TableHead>Original Filename</TableHead>
                    <TableHead>Converted Filename</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {results.map(result => (
                    <TableRow key={result.id}>
                    <TableCell>
                        <Checkbox
                            checked={selectedResults.has(result.id)}
                            onCheckedChange={(checked) => handleSelectOne(result.id, checked as boolean)}
                            aria-label={`Select ${result.inputFile.name}`}
                            disabled={result.status !== 'success'}
                         />
                    </TableCell>
                    <TableCell className="font-medium">
                       <div className="flex items-center gap-2">
                         {result.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          <span>{result.inputFile.name}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                        {result.status === 'success' ? getOutputFilename(result.inputFile, result.outputFileType) : <span className="text-muted-foreground italic">Failed</span>}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>

        <div className="flex justify-between items-center">
             <Button variant="outline" onClick={onDone}>
                Done
             </Button>

            <div className="flex gap-2">
                {selectedCount > 1 && (
                    <Button onClick={handleDownloadAllAsZip} disabled={selectedCount === 0}>
                        <FileArchive className="mr-2 h-4 w-4" />
                        Download ZIP ({selectedCount})
                    </Button>
                )}
                 <Button onClick={handleDownloadAllIndividually} disabled={selectedCount === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Selected ({selectedCount})
                 </Button>
            </div>
        </div>
    </div>
  );
}
