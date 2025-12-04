import { useSearchParams } from 'react-router-dom';

export default function ObsTicker() {
    const [searchParams] = useSearchParams();
    const text = searchParams.get('text') || 'Ticker Text';
    const color = searchParams.get('color') || '#ffffff';
    const speed = Number(searchParams.get('speed')) || 20;

    return (
        <div className="w-screen h-screen flex items-center overflow-hidden whitespace-nowrap">
            <div className="inline-block" style={{ animation: `marquee ${speed}s linear infinite`, paddingLeft: '100vw', color, fontSize: '40px', fontWeight: 'bold' }}>
                {text}
            </div>
            <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }`}</style>
        </div>
    );
}
