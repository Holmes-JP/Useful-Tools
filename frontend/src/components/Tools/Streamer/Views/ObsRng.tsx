import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsRng() {
    const [searchParams] = useSearchParams();
    const min = Number(searchParams.get('min')) || 1;
    const max = Number(searchParams.get('max')) || 100;
    const color = searchParams.get('color') || '#ffffff';
    const [current, setCurrent] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState(false);

    const spin = () => {
        if (isRolling) return;
        setIsRolling(true);
        let spins = 0;
        const interval = setInterval(() => {
            setCurrent(Math.floor(Math.random() * (max - min + 1)) + min);
            spins++;
            if (spins >= 20) { clearInterval(interval); setIsRolling(false); }
        }, 80);
    };

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center cursor-pointer select-none" style={{ color: color }} onClick={spin}>
            {!current && !isRolling ? <div className="text-[5vw] opacity-50 border-4 border-dashed border-current px-8 py-4 rounded-xl">CLICK</div> : <div className="text-[20vw] font-bold leading-none drop-shadow-xl">{current}</div>}
        </div>
    );
}
