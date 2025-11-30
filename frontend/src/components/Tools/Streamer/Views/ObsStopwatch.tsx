import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsStopwatch() {
    const [searchParams] = useSearchParams();
    const color = searchParams.get('color') || '#ffffff';
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setSeconds(p => p + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const fmt = (s: number) => {
        const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60).toString().padStart(2,'0'); const sc = (s%60).toString().padStart(2,'0');
        return h > 0 ? `${h}:${m}:${sc}` : `${m}:${sc}`;
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center" style={{ color }}>
            <div className="text-[15vw] font-bold tabular-nums">{fmt(seconds)}</div>
        </div>
    );
}
