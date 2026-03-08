'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type AIState = 'idle' | 'processing' | 'thinking' | 'speaking';

interface AIContextType {
    state: AIState;
    message: string;
    setState: (state: AIState) => void;
    setMessage: (message: string) => void;
    startProcessing: (message: string) => void;
    stopProcessing: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AIState>('idle');
    const [message, setMessage] = useState('');

    const startProcessing = (msg: string) => {
        setState('processing');
        setMessage(msg);
    };

    const stopProcessing = () => {
        setState('idle');
        setMessage('');
    };

    return (
        <AIContext.Provider value={{
            state,
            message,
            setState,
            setMessage,
            startProcessing,
            stopProcessing
        }}>
            {children}
        </AIContext.Provider>
    );
}

export function useAI() {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
}
