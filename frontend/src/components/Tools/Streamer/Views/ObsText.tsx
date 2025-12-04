import { useSearchParams } from 'react-router-dom';

export default function ObsText() {
    const [searchParams] = useSearchParams();
    const text = searchParams.get('text') || 'Text';
    const color = searchParams.get('color') || '#ffffff';
    const border = searchParams.get('border') === 'true';

    return (
        <div className="w-screen h-screen flex items-center justify-center p-4 text-center">
            <h1 style={{ color, fontSize: '60px', fontWeight: 'bold', textShadow: border ? '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000' : 'none' }}>
                {text}
            </h1>
        </div>
    );
}
