
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FileHistory } from "@/components/file-history";
import { ConversionFlow } from "@/components/conversion-flow";
import { Button } from "@/components/ui/button";

type View = "history" | "conversion";

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
  const [view, setView] = useState<View>("history");
  const [history, setHistory] = useState<ConversionResult[]>([]);

  const handleConversionComplete = (results: ConversionResult[]) => {
    // This function is now primarily for potential future use, like logging.
    // The main history update is handled by handleFlowDone.
    console.log("Conversion complete:", results);
  };

  const handleFlowDone = (results: ConversionResult[] = []) => {
    // Add the new results to the history and switch the view.
    setHistory((prev) => [...results, ...prev]);
    setView("history");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-5xl">
        <header className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl font-bold font-headline">
              LexiConvert
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              A simple, secure, and offline file conversion tool.
            </p>
          </div>
          {view === "history" && (
            <Button size="lg" onClick={() => setView("conversion")}>
              <Plus className="mr-2 h-5 w-5" />
              New Conversion
            </Button>
          )}
        </header>

        {view === "history" ? (
          <FileHistory history={history} />
        ) : (
          <ConversionFlow onComplete={handleConversionComplete} onDone={handleFlowDone} />
        )}

      </div>
    </main>
  );
}
