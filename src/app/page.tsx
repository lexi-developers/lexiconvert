
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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

  const handleFlowDone = (results: ConversionResult[] = []) => {
    // Add the new results to the history and close the dialog.
    if (results.length > 0) {
      setHistory((prev) => [...results, ...prev]);
    }
    setIsConversionFlowOpen(false);
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

        {history.length > 0 ? (
          <FileHistory history={history} />
        ) : (
          <div className="text-center py-24">
             <h2 className="text-2xl font-semibold text-muted-foreground">立即開始你的轉換</h2>
          </div>
        )}

      </div>
       <Dialog open={isConversionFlowOpen} onOpenChange={setIsConversionFlowOpen}>
          <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0" hideCloseButton={true}>
              <ConversionFlow onDone={handleFlowDone} />
          </DialogContent>
       </Dialog>
    </main>
  );
}
