
"use client";

import { useEffect, useState } from 'react';
import { ConversionResult } from '@/app/page';
import { performConversion, getFileExtension, getFileTypeFromMime } from '@/lib/conversions';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConversionProgressStepProps {
  tasks: ConversionResult[];
  onConversionComplete: (results: ConversionResult[]) => void;
  onCancelRequest: () => void;
}

export function ConversionProgressStep({ tasks, onConversionComplete, onCancelRequest }: ConversionProgressStepProps) {
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const processAllTasks = async () => {
      const newResults: ConversionResult[] = [];
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        let result: ConversionResult;
        const startTime = Date.now();
        try {
          if (!task.outputFileType) {
              throw new Error("Output format was not specified");
          }
          const extension = getFileExtension(task.inputFile.name);
          const type = getFileTypeFromMime(task.inputFile.type, extension);
          
          const { blob, finalOutputFormat } = await performConversion(task.inputFile, type, task.outputFileType as any, toast);

          result = {
            ...task,
            status: 'success',
            outputBlob: blob,
            outputFileType: finalOutputFormat,
            conversionTime: Date.now() - startTime,
          };
        } catch (error: any) {
            console.error(error);
          result = {
            ...task,
            status: 'error',
            error: error.message || 'An unknown error occurred',
            conversionTime: Date.now() - startTime,
          };
        }
        newResults.push(result);
        setResults([...newResults]);
        setProgress(((i + 1) / tasks.length) * 100);
      }
      onConversionComplete(newResults);
    };

    processAllTasks();
  }, [tasks, onConversionComplete, toast]);

  return (
    <div className="space-y-6 flex flex-col items-center justify-center p-8 bg-background rounded-lg shadow-2xl animate-in fade-in-0 zoom-in-95 duration-500">
        <div className="flex items-center gap-4 text-2xl font-semibold">
            <Loader className="animate-spin h-8 w-8" />
            <p>Converting files...</p>
        </div>
        
        <div className="w-full max-w-md">
            <Progress value={progress} className="transition-all duration-500 ease-in-out"/>
        </div>

        <Button variant="outline" onClick={onCancelRequest} className="mt-4">
            Cancel
        </Button>
    </div>
  );
}
