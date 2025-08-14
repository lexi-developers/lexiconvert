
"use client";

import { useState, useMemo } from 'react';
import { ConversionResult } from '@/app/page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { getFileExtension, getFileTypeFromMime, supportedConversions, OutputFormat } from '@/lib/conversions';
import { getFileIcon } from '@/lib/icons';

interface FileConfigStepProps {
  files: ConversionResult[];
  onConfigComplete: (files: ConversionResult[]) => void;
  onBack: () => void;
}

export function FileConfigStep({ files: initialFiles, onConfigComplete, onBack }: FileConfigStepProps) {
  const [tasks, setTasks] = useState<ConversionResult[]>(
    initialFiles.map(file => {
      const extension = getFileExtension(file.inputFile.name);
      const type = getFileTypeFromMime(file.inputFile.type, extension);
      const availableFormats = supportedConversions[type] || [];
      return {
        ...file,
        outputFileType: availableFormats[0], // Set default output format
      };
    })
  );

  const handleFormatChange = (id: string, newFormat: OutputFormat) => {
    setTasks(tasks.map(task => (task.id === id ? { ...task, outputFileType: newFormat } : task)));
  };

  const handleRemoveTask = (id: string) => {
      setTasks(tasks.filter(task => task.id !== id));
  }

  const isNextDisabled = useMemo(() => {
    if(tasks.length === 0) return true;
    return tasks.some(task => !task.outputFileType);
  }, [tasks]);

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-semibold">Configure Conversion Options</h2>
       <div className="border rounded-lg">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead className="w-[50px]">Type</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="w-[200px]">Convert To</TableHead>
                <TableHead className="w-[50px] text-right"></TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {tasks.map(task => {
                const extension = getFileExtension(task.inputFile.name);
                const type = getFileTypeFromMime(task.inputFile.type, extension);
                const availableFormats = supportedConversions[type] || [];
                return (
                <TableRow key={task.id}>
                    <TableCell>
                        <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
                            {getFileIcon(task.inputFile.name, task.inputFile.type)}
                        </div>
                    </TableCell>
                    <TableCell className="font-medium">{task.inputFile.name}</TableCell>
                    <TableCell>{(task.inputFile.size / 1024).toFixed(2)} KB</TableCell>
                    <TableCell>
                    <Select
                        value={task.outputFileType}
                        onValueChange={(value) => handleFormatChange(task.id, value as OutputFormat)}
                        disabled={availableFormats.length === 0}
                    >
                        <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                        {availableFormats.length > 0 ? (
                            availableFormats.map(format => (
                            <SelectItem key={format} value={format}>{format.toUpperCase()}</SelectItem>
                            ))
                        ) : (
                            <SelectItem value="none" disabled>No formats available</SelectItem>
                        )}
                        </SelectContent>
                    </Select>
                    </TableCell>
                    <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => handleRemoveTask(task.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </TableCell>
                </TableRow>
                );
            })}
            </TableBody>
        </Table>
        {tasks.length === 0 && (
            <div className="text-center p-8">
                <p className="text-muted-foreground">All files have been removed. Go back to re-upload.</p>
            </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Upload
        </Button>
        <Button size="lg" onClick={() => onConfigComplete(tasks)} disabled={isNextDisabled}>
          Start Conversion
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
