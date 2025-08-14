
"use client";

import { ConversionResult } from "@/app/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, XCircle, FileArchive } from "lucide-react";
import { getFileIcon } from "@/lib/icons";
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
    results.forEach(result => {
      if (result.status === 'success' && result.outputBlob) {
        const filename = getOutputFilename(result.inputFile, result.outputFileType);
        zip.file(filename, result.outputBlob);
      }
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    handleDownload(zipBlob, `LexiConvert_Batch_${Date.now()}.zip`);
  };

  const handleDownloadAllIndividually = () => {
     results.forEach(result => {
      if (result.status === 'success' && result.outputBlob) {
        const filename = getOutputFilename(result.inputFile, result.outputFileType);
        handleDownload(result.outputBlob, filename);
      }
    });
  }

  const successfulConversions = results.filter(r => r.status === 'success');

  return (
    <div className="space-y-6">
        <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-2xl font-semibold">Conversion Complete!</h2>
            <p className="mt-1 text-muted-foreground">Your files have been successfully converted.</p>
        </div>
        
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Original Filename</TableHead>
                    <TableHead>Converted Filename</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {results.map(result => (
                    <TableRow key={result.id}>
                    <TableCell>
                         <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
                            {getFileIcon(result.inputFile.name, result.inputFile.type)}
                         </div>
                    </TableCell>
                    <TableCell className="font-medium">{result.inputFile.name}</TableCell>
                    <TableCell>
                        {result.status === 'success' ? getOutputFilename(result.inputFile, result.outputFileType) : '-'}
                    </TableCell>
                    <TableCell>
                        {result.status === 'success' ? (
                            <span className="flex items-center text-green-600"><CheckCircle className="mr-1 h-4 w-4" /> Success</span>
                        ) : (
                            <span className="flex items-center text-destructive"><XCircle className="mr-1 h-4 w-4" /> Failed</span>
                        )}
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

            {successfulConversions.length > 1 && (
                 <div className="flex gap-2">
                    <Button onClick={handleDownloadAllIndividually}>
                        <Download className="mr-2 h-4 w-4" />
                        Download All
                    </Button>
                    <Button onClick={handleDownloadAllAsZip}>
                        <FileArchive className="mr-2 h-4 w-4" />
                        Download as ZIP
                    </Button>
                 </div>
            )}

             {successfulConversions.length === 1 && (
                 <Button onClick={() => handleDownload(successfulConversions[0].outputBlob, getOutputFilename(successfulConversions[0].inputFile, successfulConversions[0].outputFileType))}>
                    <Download className="mr-2 h-4 w-4" />
                    Download File
                 </Button>
            )}
        </div>
    </div>
  );
}
