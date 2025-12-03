import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsSlideshow() {
    const [searchParams] = useSearchParams();
    const rawUrls = searchParams.get('urls');
    const urls = rawUrls ? rawUrls.split(',') : ['https://placehold.co/600x400/000/fff?text=No+Image'];
    const interval = Number(searchParams.get('interval')) || 5;
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setIdx(p => (p + 1) % urls.length), interval * 1000);
        return () => clearInterval(t);
    }, [urls.length, interval]);

    return (
        <div className="w-screen h-screen overflow-hidden bg-transparent flex items-center justify-center relative">
            {urls.map((u, i) => (
                <img key={i} src={u} className="absolute w-full h-full object-contain transition-opacity duration-1000" style={{ opacity: i === idx ? 1 : 0 }} />
            ))}
        </div>
    );
}
