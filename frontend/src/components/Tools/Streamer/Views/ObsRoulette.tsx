import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsRoulette() {
    const [searchParams] = useSearchParams();
    const items = (searchParams.get('items') || 'A,B,C,D').split(',');
    const bg = searchParams.get('bg') || 'transparent';
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const colors = ['#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#073B4C', '#9D4EDD'];

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const size = 500; const center = size / 2; const step = (2 * Math.PI) / items.length;
        canvasRef.current!.width = size; canvasRef.current!.height = size;
        ctx.clearRect(0, 0, size, size);
        ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';

        items.forEach((item, i) => {
            const angle = i * step - Math.PI / 2;
            ctx.beginPath(); ctx.moveTo(center, center); ctx.arc(center, center, center - 10, angle, angle + step);
            ctx.fillStyle = colors[i % colors.length]; ctx.fill(); ctx.stroke();
            ctx.save(); ctx.translate(center, center); ctx.rotate(angle + step / 2);
            ctx.fillStyle = '#FFF'; ctx.fillText(item, center * 0.85, 0); ctx.restore();
        });
    }, [items]);

    const spin = () => {
        if (isSpinning) return;
        setIsSpinning(true); setWinner(null);
        const rot = 1800 + Math.floor(Math.random() * 360);
        setRotation(p => p + rot);
        setTimeout(() => {
            setIsSpinning(false);
            const actual = (rotation + rot) % 360;
            const idx = Math.floor(((360 - actual) % 360) / (360 / items.length));
            setWinner(items[idx]);
        }, 5000);
    };

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center cursor-pointer" style={{ backgroundColor: bg }} onClick={spin}>
            <div className="absolute z-10 top-[50%] -translate-y-[260px] w-0 h-0 border-x-[20px] border-x-transparent border-t-[40px] border-t-red-600" />
            <div style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 5s cubic-bezier(0.2,0.8,0.2,1)' : 'none' }}>
                <canvas ref={canvasRef} className="max-w-[80vw] max-h-[80vh] drop-shadow-xl" />
            </div>
            {winner && !isSpinning && <div className="absolute z-20 bg-black/80 text-white px-8 py-4 rounded-xl text-4xl font-bold animate-bounce">{winner}</div>}
        </div>
    );
}
