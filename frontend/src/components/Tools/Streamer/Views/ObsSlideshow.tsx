import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsSlideshow() {
    const [searchParams] = useSearchParams();
    const rawUrls = searchParams.get('urls');
    // デモ用画像（URLがない場合）
    const urls = rawUrls ? rawUrls.split(',') : [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80', // Retro Tech
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80', // Gaming
        'https://images.unsplash.com/photo-1614726365723-49fa7d92c43c?w=800&q=80'  // Neon
    ];
    
    const intervalTime = Number(searchParams.get('interval')) || 5; // 秒
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % urls.length);
        }, intervalTime * 1000);
        return () => clearInterval(timer);
    }, [urls.length, intervalTime]);

    return (
        <div className="w-screen h-screen overflow-hidden bg-transparent flex items-center justify-center">
            {urls.map((url, index) => (
                <img
                    key={index}
                    src={url}
                    alt={`Slide ${index}`}
                    className="absolute w-full h-full object-contain transition-opacity duration-1000"
                    style={{ 
                        opacity: index === currentIndex ? 1 : 0,
                    }}
                />
            ))}
        </div>
    );
}