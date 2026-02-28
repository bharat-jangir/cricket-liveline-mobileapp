import React, { createContext, useContext, useState, ReactNode } from 'react';

export type StatMode = 'Batting' | 'Bowling';

interface PlayerContextType {
    statMode: StatMode;
    toggleStatMode: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [statMode, setStatMode] = useState<StatMode>('Batting');

    const toggleStatMode = () => {
        setStatMode(prev => prev === 'Batting' ? 'Bowling' : 'Batting');
    };

    return (
        <PlayerContext.Provider value={{ statMode, toggleStatMode }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayerContext = () => {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayerContext must be used within a PlayerProvider');
    }
    return context;
};
