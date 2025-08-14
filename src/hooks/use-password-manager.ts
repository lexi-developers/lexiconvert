
"use client";

import { useLocalStorage } from './use-local-storage';
import { clearAllConversions } from '@/lib/db';

const PW_KEY = 'app-password';
const FAILED_ATTEMPTS_KEY = 'security-failed-attempts';
const LOCKOUT_UNTIL_KEY = 'security-lockout-until';
const LOCKOUT_LEVEL_KEY = 'security-lockout-level';
const DISABLED_KEY = 'security-disabled';

type LockoutLevel = 'none' | 'level1' | 'level2' | 'disabled';

const simpleHash = (str: string): string => {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return hash.toString();
}

export function usePasswordManager() {
    const [password, setPassword] = useLocalStorage<string | null>(PW_KEY, null);
    const [failedAttempts, setFailedAttempts] = useLocalStorage<number>(FAILED_ATTEMPTS_KEY, 0);
    const [lockoutUntil, setLockoutUntil] = useLocalStorage<number | null>(LOCKOUT_UNTIL_KEY, null);
    const [lockoutLevel, setLockoutLevel] = useLocalStorage<LockoutLevel>(LOCKOUT_LEVEL_KEY, 'none');
    const [isPermanentlyDisabled, setIsPermanentlyDisabled] = useLocalStorage<boolean>(DISABLED_KEY, false);

    const checkLockout = () => {
        if (lockoutUntil && new Date().getTime() < lockoutUntil) {
            return true; // Still locked
        }
        // If lockout has expired, reset attempts for that level
        if (lockoutUntil && new Date().getTime() >= lockoutUntil) {
            setLockoutUntil(null);
            setFailedAttempts(0); 
        }
        return false;
    }

    const handleFailedAttempt = () => {
        if (isPermanentlyDisabled) return;

        const newAttemptCount = failedAttempts + 1;
        setFailedAttempts(newAttemptCount);
        const now = new Date().getTime();

        if (lockoutLevel === 'none' && newAttemptCount >= 10) {
            setLockoutUntil(now + 60 * 1000); // 1 minute
            setLockoutLevel('level1');
        } else if (lockoutLevel === 'level1' && newAttemptCount >= 2) {
            setLockoutUntil(now + 60 * 60 * 1000); // 1 hour
            setLockoutLevel('level2');
        } else if (lockoutLevel === 'level2' && newAttemptCount >= 2) {
            setIsPermanentlyDisabled(true);
            setLockoutLevel('disabled');
        }
    };

    const verifyPassword = (input: string): boolean => {
        if (isPermanentlyDisabled || checkLockout()) {
            return false;
        }

        if (simpleHash(input) === password) {
            setFailedAttempts(0); // Reset on success
            return true;
        } else {
            handleFailedAttempt();
            return false;
        }
    };

    const setNewPassword = (newPass: string) => {
        setPassword(simpleHash(newPass));
        // Reset all security state when a new password is set
        setFailedAttempts(0);
        setLockoutUntil(null);
        setLockoutLevel('none');
        setIsPermanentlyDisabled(false);
    };

    const removePassword = () => {
        setPassword(null);
        setFailedAttempts(0);
        setLockoutUntil(null);
        setLockoutLevel('none');
        setIsPermanentlyDisabled(false);
    }
    
    const resetAllData = async () => {
        // Clear security state from localStorage
        removePassword();
        localStorage.removeItem(PW_KEY);
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
        localStorage.removeItem(LOCKOUT_UNTIL_KEY);
        localStorage.removeItem(LOCKOUT_LEVEL_KEY);
        localStorage.removeItem(DISABLED_KEY);
        localStorage.removeItem('hasOnboarded');

        // Clear conversion history from IndexedDB
        await clearAllConversions();
    }


    return {
        passwordExists: password !== null,
        isPermanentlyDisabled,
        lockoutUntil,
        lockoutLevel,
        verifyPassword,
        setPassword: setNewPassword,
        removePassword,
        resetAllData
    };
}
