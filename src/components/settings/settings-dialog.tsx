
"use client"

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from 'next-themes';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { clearAllConversions } from '@/lib/db';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { X } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onHistoryCleared: () => void;
}

const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return hash.toString();
}

export function SettingsDialog({ isOpen, onOpenChange, onHistoryCleared }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const [password, setPassword] = useLocalStorage<string | null>('app-password', null);
  const [tempPassword, setTempPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleClearHistory = async () => {
    await clearAllConversions();
    onHistoryCleared();
    toast({ title: "Success", description: "All conversion history has been deleted." });
    setIsAlertOpen(false);
  }

  const handleSetPassword = () => {
    if (tempPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
     if (tempPassword.length === 0) {
      toast({ title: "Error", description: "Password cannot be empty.", variant: "destructive" });
      return;
    }
    setPassword(simpleHash(tempPassword));
    setTempPassword('');
    setConfirmPassword('');
    toast({ title: "Success", description: "Password has been set." });
  }

  const handleRemovePassword = () => {
    setPassword(null);
    toast({ title: "Success", description: "Password has been removed." });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
           <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
        </DialogHeader>
        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="data" className="pt-4">
             <div className="space-y-4">
                <h3 className="text-md font-medium">Manage Data</h3>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <p className="font-semibold">Clear All History</p>
                        <p className="text-sm text-muted-foreground">Permanently delete all conversion records.</p>
                    </div>
                    <Button variant="destructive" onClick={() => setIsAlertOpen(true)}>Clear</Button>
                </div>
            </div>
          </TabsContent>
          <TabsContent value="theme" className="pt-4">
            <div className="space-y-2">
                <h3 className="text-md font-medium">Appearance</h3>
                <p className="text-sm text-muted-foreground">Select a theme that's easy on your eyes.</p>
            </div>
            <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-4 pt-4">
                 <div>
                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                    <Label htmlFor="light" className="flex h-16 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Light
                    </Label>
                </div>
                <div>
                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                    <Label htmlFor="dark" className="flex h-16 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Dark
                    </Label>
                </div>
                <div>
                    <RadioGroupItem value="system" id="system" className="peer sr-only" />
                    <Label htmlFor="system" className="flex h-16 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        System
                    </Label>
                </div>
            </RadioGroup>
          </TabsContent>
          <TabsContent value="security" className="pt-4">
            <div className="space-y-4">
                <h3 className="text-md font-medium">Password</h3>
                <p className="text-sm text-muted-foreground">Secure your session with a password.</p>
                
                {password ? (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <p className="font-semibold">Password is set</p>
                        <Button variant="secondary" onClick={handleRemovePassword}>Remove</Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Input 
                            type="password" 
                            placeholder="Enter new password"
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                         />
                        <Input 
                            type="password" 
                            placeholder="Confirm new password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Button className="w-full" onClick={handleSetPassword}>Set Password</Button>
                    </div>
                )}
            </div>
          </TabsContent>
        </Tabs>
        
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your conversion history.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </DialogContent>
    </Dialog>
  );
}
