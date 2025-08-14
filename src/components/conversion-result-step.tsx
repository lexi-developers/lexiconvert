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
            <h2 className="mt-4 text-2xl font-semibold">轉換完成！</h2>
            <p className="mt-1 text-muted-foreground">您的檔案已成功轉換。</p>
        </div>
        
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">類型</TableHead>
                    <TableHead>原始檔名</TableHead>
                    <TableHead>轉換後檔名</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead className="text-right">操作</TableHead>
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
                            <span className="flex items-center text-green-600"><CheckCircle className="mr-1 h-4 w-4" /> 成功</span>
                        ) : (
                            <span className="flex items-center text-destructive"><XCircle className="mr-1 h-4 w-4" /> 失敗</span>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                        {result.status === 'success' && (
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(result.outputBlob, getOutputFilename(result.inputFile, result.outputFileType))}>
                                <Download className="h-4 w-4" />
                            </Button>
                        )}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>

        <div className="flex justify-between items-center">
             <Button variant="outline" onClick={onDone}>
                完成
             </Button>

            {successfulConversions.length > 1 && (
                 <div className="flex gap-2">
                    <Button onClick={handleDownloadAllIndividually}>
                        <Download className="mr-2 h-4 w-4" />
                        全部下載
                    </Button>
                    <Button onClick={handleDownloadAllAsZip}>
                        <FileArchive className="mr-2 h-4 w-4" />
                        下載 ZIP 壓縮檔
                    </Button>
                 </div>
            )}

             {successfulConversions.length === 1 && (
                 <Button onClick={() => handleDownload(successfulConversions[0].outputBlob, getOutputFilename(successfulConversions[0].inputFile, successfulConversions[0].outputFileType))}>
                    <Download className="mr-2 h-4 w-4" />
                    下載檔案
                 </Button>
            )}
        </div>
    </div>
  );
}
