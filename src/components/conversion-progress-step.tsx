"use client";

import { useEffect, useState } from 'react';
import { ConversionResult } from '@/app/page';
import { performConversion, getFileExtension, getFileTypeFromMime } from '@/lib/conversions';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

interface ConversionProgressStepProps {
  tasks: ConversionResult[];
  onConversionComplete: (results: ConversionResult[]) => void;
}

export function ConversionProgressStep({ tasks, onConversionComplete }: ConversionProgressStepProps) {
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const processAllTasks = async () => {
      const newResults: ConversionResult[] = [];
      for (let i = 0; i < tasks.length; i++) {
        setCurrentTaskIndex(i);
        const task = tasks[i];
        let result: ConversionResult;
        const startTime = Date.now();
        try {
          if (!task.outputFileType) {
              throw new Error("未指定輸出格式");
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
            error: error.message || '未知錯誤',
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

  const currentTask = tasks[currentTaskIndex];

  return (
    <div className="space-y-8 flex flex-col items-center justify-center p-12 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4 text-2xl font-semibold">
            <Loader className="animate-spin h-8 w-8 text-primary" />
            <p>正在轉換檔案...</p>
        </div>
        
        <div className="w-full max-w-lg space-y-4">
            <Progress value={progress} />
            <div className="text-center text-muted-foreground">
                <p>總進度: {Math.round(progress)}%</p>
                {currentTask && <p>正在處理: {currentTask.inputFile.name}</p>}
            </div>
        </div>

        <div className="w-full max-w-lg space-y-2">
            <h3 className="font-semibold text-center">轉換詳情</h3>
            <ul className="max-h-48 overflow-y-auto bg-background p-2 rounded-md border">
                {results.map(res => (
                    <li key={res.id} className="flex items-center justify-between text-sm p-1">
                        <span className="truncate pr-4">{res.inputFile.name}</span>
                        {res.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {res.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );
}
