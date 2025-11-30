import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsRng() {
    const [searchParams] = useSearchParams();
    const min = Number(searchParams.get('min')) || 1;
    const max = Number(searchParams.get('max')) || 100;
    const color = searchParams.get('color') || '#ffffff';
    const font = searchParams.get('font') || 'sans-serif';

    const [current, setCurrent] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState(false);

    const spin = () => {
        if (isRolling) return;
        setIsRolling(true);

        let spins = 0;
        const maxSpins = 20; // 演出回数
        
        const interval = setInterval(() => {
            // ランダム表示
            const rnd = Math.floor(Math.random() * (max - min + 1)) + min;
            setCurrent(rnd);
            spins++;

            if (spins >= maxSpins) {
                clearInterval(interval);
                setIsRolling(false);
            }
        }, 80);
    };

    return (
        <div 
            className="w-screen h-screen flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
            style={{ fontFamily: font, color: color }}
            onClick={spin}
        >
            {!current && !isRolling ? (
                <div className="text-[5vw] opacity-50 font-bold border-4 border-dashed border-current px-8 py-4 rounded-xl">
                    CLICK TO START
                </div>
            ) : (
                <div className="text-[20vw] font-bold leading-none drop-shadow-xl tabular-nums">
                    {current}
                </div>
            )}
            
            <div className="absolute bottom-10 text-[3vw] opacity-50 font-mono bg-black/50 px-4 py-1 rounded">
                Range: {min} - {max}
            </div>
        </div>
    );
}