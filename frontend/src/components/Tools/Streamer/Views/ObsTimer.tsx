import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsTimer() {
    const [searchParams] = useSearchParams();
    // パラメータ取得
    const minutes = Number(searchParams.get('min')) || 5;
    const color = searchParams.get('color') || '#ffffff';
    const bg = searchParams.get('bg') || 'transparent';
    const font = searchParams.get('font') || 'sans-serif';
    const finishMsg = searchParams.get('end') || "Time's Up!";
    
    // 秒換算
    const initialSeconds = minutes * 60;
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (timeLeft <= 0) {
            setIsFinished(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // フォーマット (MM:SS)
    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div 
            className="w-screen h-screen flex items-center justify-center"
            style={{ backgroundColor: bg, fontFamily: font, color: color }}
        >
            {isFinished ? (
                <div className="text-[10vw] font-bold animate-bounce text-center px-4 leading-tight">
                    {finishMsg}
                </div>
            ) : (
                <div className="text-[15vw] font-bold tabular-nums drop-shadow-md leading-none">
                    {formatTime(timeLeft)}
                </div>
            )}
        </div>
    );
}