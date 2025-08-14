
"use client";

import { useState, useEffect } from "react";
import { Plus, FileUp } from "lucide-react";
import { FileHistory } from "@/components/file-history";
import { ConversionFlow } from "@/components/conversion-flow";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getAllConversions, deleteConversion } from "@/lib/db";


export type ConversionResult = {
  id: string;
  inputFile: File;
  outputBlob?: Blob;
  outputFileType?: string;
  status: "pending" | "converting" | "success" | "error";
  error?: string;
  conversionTime?: number; // in milliseconds
};

export default function Home() {
  const [history, setHistory] = useState<ConversionResult[]>([]);
  const [isConversionFlowOpen, setIsConversionFlowOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const storedConversions = await getAllConversions();
      setHistory(storedConversions.sort((a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1])));
      setIsLoading(false);
    };
    loadHistory();
  }, []);

  const handleFlowDone = (results: ConversionResult[] = []) => {
    if (results.length > 0) {
      // Since results are now saved to DB within the flow, we just need to re-read
       const loadHistory = async () => {
        const storedConversions = await getAllConversions();
        setHistory(storedConversions.sort((a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1])));
      };
      loadHistory();
    }
    setIsConversionFlowOpen(false);
  }

  const handleSetHistory = (newHistory: ConversionResult[] | ((prev: ConversionResult[]) => ConversionResult[])) => {
    if (typeof newHistory === 'function') {
      setHistory(prev => {
        const updated = newHistory(prev);
        // This is tricky to sync with DB. For now, deletions are handled separately.
        return updated;
      });
    } else {
      setHistory(newHistory);
    }
  }

  const handleDeleteFromHistory = async (id: string) => {
    await deleteConversion(id);
    setHistory(prev => prev.filter(item => item.id !== id));
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-5xl">
        <header className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl font-bold font-headline">
              LexiConvert
            </h1>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" className="rounded-full" onClick={() => setIsConversionFlowOpen(true)}>
                  <Plus className="h-5 w-5" />
                  <span className="sr-only">New Conversion</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New Conversion</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </header>

        {isLoading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <p>Loading history...</p>
            </div>
        ) : history.length > 0 ? (
          <FileHistory history={history} setHistory={handleSetHistory} onDelete={handleDeleteFromHistory} />
        ) : (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center p-8 border border-dashed rounded-lg">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FileUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No conversions yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Click the button below to start your first file conversion.
                </p>
                <div className="mt-6">
                    <Button onClick={() => setIsConversionFlowOpen(true)}>
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
                        New Conversion
                    </Button>
                </div>
            </div>
        </div>
        )}

      </div>
       <Dialog open={isConversionFlowOpen} onOpenChange={setIsConversionFlowOpen}>
          <DialogContent className="max-w-4xl w-full h-full sm:h-[90vh] flex flex-col p-0">
              <ConversionFlow onDone={handleFlowDone} />
          </DialogContent>
       </Dialog>
    </main>
  );
}
