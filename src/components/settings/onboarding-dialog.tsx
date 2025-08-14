
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OnboardingDialogProps {
    onComplete: () => void;
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


export function OnboardingDialog({ onComplete }: OnboardingDialogProps) {
    const [step, setStep] = useState(1);
    const { setTheme } = useTheme();
    const [password, setPassword] = useLocalStorage<string | null>('app-password', null);
    const [tempPassword, setTempPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleNext = () => setStep(s => s + 1);

    const handleThemeChange = (value: string) => {
        setTheme(value);
    }

    const handleSetPassword = () => {
        if (tempPassword !== confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
            return;
        }
        if (tempPassword.length > 0) {
            setPassword(simpleHash(tempPassword));
        }
        handleNext();
    }
    
    const handleSkipPassword = () => {
        setPassword(null);
        handleNext();
    }
    
    const handleFinish = () => {
        onComplete();
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md mx-auto p-8 border rounded-lg shadow-lg">
                {step === 1 && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl text-center">Welcome to LexiConvert</DialogTitle>
                            <DialogDescription className="text-center pt-2">
                                A powerful, privacy-focused file conversion tool.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 text-center text-muted-foreground">
                            <p>All conversions run locally in your browser. Your files are never uploaded to any server.</p>
                        </div>
                        <DialogFooter>
                            <Button className="w-full" size="lg" onClick={handleNext}>Get Started</Button>
                        </DialogFooter>
                    </>
                )}
                {step === 2 && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl text-center">Choose Your Theme</DialogTitle>
                            <DialogDescription className="text-center pt-2">
                                Select a theme that's easy on your eyes.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6">
                            <RadioGroup defaultValue="system" onValueChange={handleThemeChange} className="grid grid-cols-3 gap-4">
                                <div>
                                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                                    <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        Light
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                                    <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        Dark
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="system" id="system" className="peer sr-only" />
                                    <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        System
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <DialogFooter>
                            <Button className="w-full" size="lg" onClick={handleNext}>Next</Button>
                        </DialogFooter>
                    </>
                )}
                {step === 3 && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl text-center">Set a Password (Optional)</DialogTitle>
                            <DialogDescription className="text-center pt-2">
                                Secure your session. You'll be asked for this password every time you visit.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 space-y-4">
                             <Input 
                                type="password" 
                                placeholder="Enter password" 
                                value={tempPassword}
                                onChange={(e) => setTempPassword(e.target.value)}
                             />
                             <Input 
                                type="password" 
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                             />
                        </div>
                        <DialogFooter className="flex-col gap-2">
                            <Button className="w-full" size="lg" onClick={handleSetPassword} disabled={tempPassword.length > 0 && tempPassword !== confirmPassword}>Set Password & Continue</Button>
                            <Button className="w-full" variant="ghost" onClick={handleSkipPassword}>Skip</Button>
                        </DialogFooter>
                    </>
                )}
                 {step === 4 && (
                    <>
                        <div className="text-center py-6">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <DialogTitle className="text-2xl text-center">All Set!</DialogTitle>
                            <DialogDescription className="text-center pt-2">
                                Welcome to LexiConvert.
                            </DialogDescription>
                        </div>
                        <DialogFooter>
                            <Button className="w-full" size="lg" onClick={handleFinish}>Start Converting</Button>
                        </DialogFooter>
                    </>
                )}
            </div>
        </div>
    );
}
