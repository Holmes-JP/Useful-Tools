import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsBingo() {
    const [searchParams] = useSearchParams();
    const rawItems = searchParams.get('items');
    const title = searchParams.get('title') || 'BINGO';
    const color = searchParams.get('color') || '#00ff00';
    
    const items = useMemo(() => {
        const list = rawItems ? rawItems.split(',') : [];
        const shuffled = list.sort(() => Math.random() - 0.5);
        return [...Array(25)].map((_, i) => i === 12 ? 'FREE' : (shuffled[i] || `${i+1}`));
    }, [rawItems]);

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center p-4">
            <h1 className="text-[5vw] font-bold mb-4 drop-shadow-md" style={{ color }}>{title}</h1>
            <div className="grid grid-cols-5 gap-2 w-full max-w-[80vh] aspect-square bg-black/50 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                {items.map((item, i) => (
                    <div key={i} className={`flex items-center justify-center text-center p-1 rounded font-bold text-white shadow-inner ${item === 'FREE' ? 'bg-red-500/80 text-yellow-300' : 'bg-white/10'}`} style={{ fontSize: 'clamp(10px, 2vw, 24px)' }}>
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}
