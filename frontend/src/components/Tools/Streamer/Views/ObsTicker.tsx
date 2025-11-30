import { useSearchParams } from 'react-router-dom';

export default function ObsTicker() {
    const [searchParams] = useSearchParams();
    const text = searchParams.get('text') || 'Welcome to the stream!';
    const color = searchParams.get('color') || '#ffffff';
    const bg = searchParams.get('bg') || 'transparent';
    const size = searchParams.get('size') || '40px';
    const speed = Number(searchParams.get('speed')) || 20; // 秒数(小さいほど速い)

    return (
        <div 
            className="w-screen h-screen flex items-center overflow-hidden whitespace-nowrap"
            style={{ backgroundColor: bg }}
        >
            {/* 画面外から画面外へ流れるアニメーション */}
            <div 
                className="inline-block"
                style={{
                    animation: `marquee ${speed}s linear infinite`,
                    paddingLeft: '100vw', // 開始位置を画面右端に
                    color: color,
                    fontSize: size,
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}
            >
                {text}
            </div>
            
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>
        </div>
    );
}