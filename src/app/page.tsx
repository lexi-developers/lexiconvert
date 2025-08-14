
"use client";

import { useState, useEffect } from "react";
import { Plus, FileUp, Settings as SettingsIcon, Loader2 } from "lucide-react";
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
import { getAllConversions } from "@/lib/db";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { OnboardingDialog } from "@/components/settings/onboarding-dialog";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { LockScreen } from "@/components/settings/lock-screen";
import { motion } from "framer-motion";


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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [hasOnboarded, setHasOnboarded] = useLocalStorage("hasOnboarded", false);
  const [isClient, setIsClient] = useState(false)
  const [password] = useLocalStorage<string | null>('app-password', null);
  const [isUnlocked, setIsUnlocked] = useState(!password);


  useEffect(() => {
    setIsClient(true)
    if (isUnlocked) {
      const loadHistory = async () => {
        setIsLoading(true);
        const storedConversions = await getAllConversions();
        setHistory(storedConversions.sort((a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1])));
        setIsLoading(false);
      };
      loadHistory();
    }
  }, [isUnlocked]);
  
  const refreshHistory = async () => {
    setIsLoading(true);
    const storedConversions = await getAllConversions();
    setHistory(storedConversions.sort((a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1])));
    setIsLoading(false);
  };


  const handleFlowDone = (results: ConversionResult[] = []) => {
    if (results.length >= 0) {
      refreshHistory();
    }
    setIsConversionFlowOpen(false);
  }

  const handleOnboardingComplete = () => {
    setHasOnboarded(true);
  }
  
  const handleDeleteFromHistory = async () => {
    await refreshHistory();
  }
  
  if (!isClient) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }
  
  if (!isUnlocked) {
    return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  if (!hasOnboarded) {
    return <OnboardingDialog onComplete={handleOnboardingComplete} />;
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
          <div className="flex items-center gap-2">
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
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button size="icon" variant="outline" className="rounded-full" onClick={() => setIsSettingsOpen(true)}>
                      <SettingsIcon className="h-5 w-5" />
                      <span className="sr-only">Settings</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        {isLoading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <p>Loading history...</p>
            </div>
        ) : history.length > 0 ? (
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
          >
            <FileHistory history={history} setHistory={setHistory} onDelete={handleDeleteFromHistory} />
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex items-center justify-center h-[60vh]">
            <div className="text-center p-8 border border-dashed rounded-lg">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FileUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No conversions yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    It will not be uploaded to our server.
                </p>
                <div className="mt-6">
                    <Button onClick={() => setIsConversionFlowOpen(true)}>
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
                        New Conversion
                    </Button>
                </div>
            </div>
        </motion.div>
        )}

      </div>
       <Dialog open={isConversionFlowOpen} onOpenChange={setIsConversionFlowOpen}>
        <DialogContent className="max-w-4xl w-full h-full sm:h-[90vh] flex flex-col p-0">
          <ConversionFlow
            onDone={handleFlowDone}
          />
        </DialogContent>
       </Dialog>
       
       <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} onHistoryCleared={refreshHistory} />
    </main>
  );
}
