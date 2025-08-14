
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

interface LockScreenProps {
    onUnlock: () => void;
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

export function LockScreen({ onUnlock }: LockScreenProps) {
    const [password] = useLocalStorage<string | null>('app-password', null);
    const [inputPassword, setInputPassword] = useState('');

    const handleUnlock = () => {
        if (simpleHash(inputPassword) === password) {
            onUnlock();
        } else {
            toast({ title: "Error", description: "Incorrect password.", variant: "destructive" });
        }
    }
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleUnlock();
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-sm mx-auto p-8 border rounded-lg shadow-lg text-center">
                 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-6">
                    <Lock className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Session Locked</h1>
                <p className="text-muted-foreground mb-6">Enter your password to continue.</p>
                <div className="space-y-4">
                    <Input
                        type="password"
                        placeholder="Password"
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <Button className="w-full" size="lg" onClick={handleUnlock}>Unlock</Button>
                </div>
            </div>
        </div>
    );
}
