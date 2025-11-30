import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsBingo() {
    const [searchParams] = useSearchParams();
    const rawItems = searchParams.get('items');
    const title = searchParams.get('title') || 'BINGO';
    const color = searchParams.get('color') || '#00ff00';
    const bg = searchParams.get('bg') || 'transparent';
    
    // アイテムリスト（足りない場合は数字で埋める）
    const items = useMemo(() => {
        const list = rawItems ? rawItems.split(',') : [];
        // シャッフル (シードなしの完全ランダム)
        const shuffled = list.sort(() => Math.random() - 0.5);
        // 25マス埋める
        return [...Array(25)].map((_, i) => {
            if (i === 12) return 'FREE'; // 中央はFREE
            return shuffled[i] || `${i + 1}`;
        });
    }, [rawItems]);

    return (
        <div 
            className="w-screen h-screen flex flex-col items-center justify-center p-4 box-border"
            style={{ backgroundColor: bg }}
        >
            <h1 
                className="text-[5vw] font-bold mb-4 drop-shadow-md"
                style={{ color: color }}
            >
                {title}
            </h1>
            
            <div className="grid grid-cols-5 gap-2 w-full max-w-[80vh] aspect-square bg-black/50 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                {items.map((item, i) => (
                    <div 
                        key={i}
                        className={`
                            flex items-center justify-center text-center p-1 rounded font-bold text-white shadow-inner
                            ${item === 'FREE' ? 'bg-red-500/80 text-yellow-300' : 'bg-white/10'}
                        `}
                        style={{ fontSize: 'clamp(10px, 2vw, 24px)' }}
                    >
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}