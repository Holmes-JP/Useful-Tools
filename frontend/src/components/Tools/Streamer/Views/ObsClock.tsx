import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

export default function ObsClock() {
    const [searchParams] = useSearchParams();
    const [now, setNow] = useState(new Date());
    const color = searchParams.get('color') || '#ffffff';
    const bg = searchParams.get('bg') || 'transparent';
    const font = searchParams.get('font') || 'sans-serif';
    const showSeconds = searchParams.get('sec') === 'true';

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={{ backgroundColor: bg, fontFamily: font, color: color }} className="w-screen h-screen flex items-center justify-center overflow-hidden">
            <div className="text-[15vw] leading-none font-bold tabular-nums drop-shadow-md">
                {format(now, showSeconds ? 'HH:mm:ss' : 'HH:mm')}
            </div>
        </div>
    );
}
