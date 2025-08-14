
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { usePasswordManager } from '@/hooks/use-password-manager';
import { CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

interface OnboardingDialogProps {
    onComplete: () => void;
}

const stepVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -30, transition: { duration: 0.3, ease: "easeIn" } }
};


export function OnboardingDialog({ onComplete }: OnboardingDialogProps) {
    const [step, setStep] = useState(1);
    const { setTheme } = useTheme();
    const { setPassword } = usePasswordManager();
    const [tempPassword, setTempPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleNext = () => setStep(s => s + 1);

    const handleThemeChange = (value: string) => {
        setTheme(value);
    }

    const handleSetPassword = () => {
        if (tempPassword !== confirmPassword) {
            toast({ description: "Passwords do not match.", variant: "destructive" });
            return;
        }
        if (tempPassword.length > 0) {
            setPassword(tempPassword);
        }
        handleNext();
    }
    
    const handleSkipPassword = () => {
        handleNext();
    }
    
    const handleFinish = () => {
        onComplete();
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md mx-auto p-8 border rounded-lg shadow-lg overflow-hidden">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                            <div className="text-center sm:text-left flex flex-col space-y-1.5">
                                <h1 className="text-2xl font-semibold leading-none tracking-tight text-center">Welcome to LexiConvert</h1>
                                <p className="text-sm text-muted-foreground text-center pt-2">
                                    A powerful, privacy-focused file conversion tool.
                                </p>
                            </div>
                            <div className="py-6 text-center text-muted-foreground">
                                <p>All conversions run locally in your browser. Your files are never uploaded to any server.</p>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                                <Button className="w-full" size="lg" onClick={handleNext}>Get Started</Button>
                            </div>
                        </motion.div>
                    )}
                    {step === 2 && (
                        <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                             <div className="text-center sm:text-left flex flex-col space-y-1.5">
                                <h1 className="text-2xl font-semibold leading-none tracking-tight text-center">Choose Your Theme</h1>
                                <p className="text-sm text-muted-foreground text-center pt-2">
                                    Select a theme that's easy on your eyes.
                                </p>
                            </div>
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
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                                <Button className="w-full" size="lg" onClick={handleNext}>Next</Button>
                            </div>
                        </motion.div>
                    )}
                    {step === 3 && (
                        <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                            <div className="text-center sm:text-left flex flex-col space-y-1.5">
                                <h1 className="text-2xl font-semibold leading-none tracking-tight text-center">Set a Password (Optional)</h1>
                                <p className="text-sm text-muted-foreground text-center pt-2">
                                    Secure your session. You'll be asked for this password every time you visit.
                                </p>
                            </div>
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
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 flex-col gap-2">
                                <Button className="w-full" size="lg" onClick={handleSetPassword} disabled={tempPassword.length > 0 && tempPassword !== confirmPassword}>Set Password & Continue</Button>
                                <Button className="w-full" variant="ghost" onClick={handleSkipPassword}>Skip</Button>
                            </div>
                        </motion.div>
                    )}
                     {step === 4 && (
                        <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                            <div className="text-center py-6">
                                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                <h1 className="text-2xl text-center font-semibold leading-none tracking-tight">All Set!</h1>
                                <p className="text-sm text-muted-foreground text-center pt-2">
                                    Welcome to LexiConvert.
                                </p>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                                <Button className="w-full" size="lg" onClick={handleFinish}>Start Converting</Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
