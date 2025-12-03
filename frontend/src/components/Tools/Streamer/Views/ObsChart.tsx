import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsChart() {
    const [searchParams] = useSearchParams();
    const title = searchParams.get('title') || 'Vote Result';
    const labels = (searchParams.get('labels') || 'A,B,C').split(',');
    const data = (searchParams.get('data') || '10,20,30').split(',').map(Number);
    const color = searchParams.get('color') || '#00ff00';
    const bg = searchParams.get('bg') || 'transparent';
    
    const maxVal = Math.max(...data, 1);
    const [animatedWidths, setAnimatedWidths] = useState<number[]>(data.map(() => 0));

    useEffect(() => {
        // アニメーション発火
        setTimeout(() => {
            setAnimatedWidths(data);
        }, 100);
    }, []);

    return (
        <div className="w-screen h-screen flex flex-col justify-center p-8 box-border" style={{ backgroundColor: bg }}>
            <h1 className="text-4xl font-bold text-white mb-6 drop-shadow-md" style={{ color }}>{title}</h1>
            <div className="space-y-4 w-full max-w-3xl">
                {labels.map((label, i) => {
                    const val = data[i] || 0;
                    return (
                        <div key={i} className="relative">
                            <div className="flex justify-between text-white font-bold mb-1 drop-shadow-sm">
                                <span>{label}</span>
                                <span>{val}</span>
                            </div>
                            <div className="h-8 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ 
                                        width: `${(animatedWidths[i] / maxVal) * 100}%`,
                                        backgroundColor: color,
                                        opacity: 0.8
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
