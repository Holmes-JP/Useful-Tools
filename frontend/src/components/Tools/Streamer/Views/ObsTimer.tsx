import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsTimer() {
    const [searchParams] = useSearchParams();
    const min = Number(searchParams.get('min')) || 5;
    const color = searchParams.get('color') || '#ffffff';
    const endMsg = searchParams.get('end') || "Time's Up!";
    const [timeLeft, setTimeLeft] = useState(min * 60);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (timeLeft <= 0) { setIsFinished(true); return; }
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [timeLeft]);

    const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

    return (
        <div className="w-screen h-screen flex items-center justify-center" style={{ color }}>
            {isFinished ? <div className="text-[10vw] font-bold animate-bounce">{endMsg}</div> : <div className="text-[15vw] font-bold tabular-nums">{fmt(timeLeft)}</div>}
        </div>
    );
}
