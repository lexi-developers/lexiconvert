
"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Lock, AlertTriangle } from 'lucide-react';
import { usePasswordManager } from '@/hooks/use-password-manager';

interface LockScreenProps {
    onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
    const [inputPassword, setInputPassword] = useState('');
    const { 
        verifyPassword, 
        resetAllData,
        isPermanentlyDisabled, 
        lockoutUntil, 
        lockoutLevel 
    } = usePasswordManager();
    const [now, setNow] = useState(new Date().getTime());

    useEffect(() => {
        if (lockoutUntil && lockoutUntil > now) {
            const timer = setInterval(() => {
                setNow(new Date().getTime());
                if (new Date().getTime() >= lockoutUntil) {
                    clearInterval(timer);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [lockoutUntil, now]);

    const handleUnlock = () => {
        const isCorrect = verifyPassword(inputPassword);
        if (isCorrect) {
            onUnlock();
        } else {
            toast({ description: "Incorrect password.", variant: "destructive" });
            // The hook handles failed attempts, so we just need to re-render to show new state
            setInputPassword('');
        }
    }
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleUnlock();
        }
    }

    const handleReset = () => {
        resetAllData();
        window.location.reload(); // Reload to restart the onboarding process
    }

    if (isPermanentlyDisabled) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
                <div className="w-full max-w-sm mx-auto p-8 border rounded-lg shadow-lg text-center bg-destructive/10 border-destructive">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 mb-6">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-destructive">您的工具已停用</h1>
                    <p className="text-destructive/80 mb-6">由於多次密碼錯誤，工具已被鎖定。</p>
                    <Button variant="destructive" className="w-full" size="lg" onClick={handleReset}>刪除全部資料並重設</Button>
                </div>
            </div>
        );
    }
    
    const isLocked = lockoutUntil && lockoutUntil > now;
    const timeLeft = isLocked ? Math.ceil((lockoutUntil - now) / 1000) : 0;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-sm mx-auto p-8 border rounded-lg shadow-lg text-center">
                 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-6">
                    <Lock className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Session Locked</h1>
                <p className="text-muted-foreground mb-6">
                    {isLocked 
                        ? `Too many failed attempts. Please try again in ${timeLeft} seconds.`
                        : "Enter your password to continue."
                    }
                </p>
                <div className="space-y-4">
                    <Input
                        type="password"
                        placeholder="Password"
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLocked}
                    />
                    <Button className="w-full" size="lg" onClick={handleUnlock} disabled={isLocked}>
                        {isLocked ? `Try again in ${timeLeft}s` : "Unlock"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
