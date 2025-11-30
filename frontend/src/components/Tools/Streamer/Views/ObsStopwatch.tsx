import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsStopwatch() {
    const [searchParams] = useSearchParams();
    const color = searchParams.get('color') || '#ffffff';
    const bg = searchParams.get('bg') || 'transparent';
    const font = searchParams.get('font') || 'sans-serif';

    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // フォーマット (HH:MM:SS)
    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
    };

    return (
        <div 
            className="w-screen h-screen flex items-center justify-center"
            style={{ backgroundColor: bg, fontFamily: font, color: color }}
        >
            <div className="text-[15vw] font-bold tabular-nums drop-shadow-md leading-none">
                {formatTime(seconds)}
            </div>
        </div>
    );
}