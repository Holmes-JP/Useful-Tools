import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsCounter() {
    const [searchParams] = useSearchParams();
    const color = searchParams.get('color') || '#00ff00';
    
    const [win, setWin] = useState(0);
    const [loss, setLoss] = useState(0);

    // キーボードショートカット
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'w') setWin(prev => prev + 1);
            if (e.key.toLowerCase() === 'l') setLoss(prev => prev + 1);
            if (e.key.toLowerCase() === 'r') { setWin(0); setLoss(0); } // Reset
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 右クリック防止（コンテキストメニューを出さずに減算に使う）
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    return (
        <div 
            className="w-screen h-screen flex items-center justify-center bg-transparent select-none"
            style={{ color: color }}
        >
            <div className="flex gap-8 text-[8vw] font-bold drop-shadow-lg bg-black/50 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                {/* WIN */}
                <div 
                    className="flex flex-col items-center cursor-pointer active:scale-95 transition"
                    onClick={() => setWin(w => w + 1)}
                    onContextMenu={(e) => { e.preventDefault(); setWin(w => Math.max(0, w - 1)); }}
                >
                    <span className="text-[3vw] opacity-70">WIN</span>
                    <span className="tabular-nums">{win}</span>
                </div>

                <div className="flex items-center opacity-50">-</div>

                {/* LOSS */}
                <div 
                    className="flex flex-col items-center cursor-pointer active:scale-95 transition text-red-400"
                    onClick={() => setLoss(l => l + 1)}
                    onContextMenu={(e) => { e.preventDefault(); setLoss(l => Math.max(0, l - 1)); }}
                >
                    <span className="text-[3vw] opacity-70">LOSE</span>
                    <span className="tabular-nums">{loss}</span>
                </div>
            </div>
        </div>
    );
}