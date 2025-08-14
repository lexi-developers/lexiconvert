
"use client";

import { useEffect, useState } from 'react';
import { ConversionResult } from '@/app/page';
import { performConversion, getFileExtension, getFileTypeFromMime } from '@/lib/conversions';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Loader } from 'lucide-react';

interface ConversionProgressStepProps {
  tasks: ConversionResult[];
  onConversionComplete: (results: ConversionResult[]) => void;
}

export function ConversionProgressStep({ tasks, onConversionComplete }: ConversionProgressStepProps) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, onConversionComplete]);

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-6 p-8">
        <Loader className="animate-spin h-16 w-16" />
        
        <div className="w-full max-w-md space-y-2">
            <Progress value={progress} className="transition-all duration-500 ease-in-out"/>
        </div>

    </div>
  );
}
