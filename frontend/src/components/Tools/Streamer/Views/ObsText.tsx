import { useSearchParams } from 'react-router-dom';

export default function ObsText() {
    const [searchParams] = useSearchParams();
    const text = searchParams.get('text') || 'Sample Text';
    const color = searchParams.get('color') || '#ffffff';
    const bg = searchParams.get('bg') || 'transparent';
    const size = searchParams.get('size') || '60px';
    const align = searchParams.get('align') || 'center';
    const border = searchParams.get('border') === 'true'; // 縁取り有無

    return (
        <div 
            className="w-screen h-screen flex items-center p-4 break-words"
            style={{ 
                backgroundColor: bg,
                justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
                textAlign: align as any
            }}
        >
            <h1 
                style={{
                    color: color,
                    fontSize: size,
                    fontWeight: 'bold',
                    // 文字の縁取り（白文字が見やすいように）
                    textShadow: border ? 
                        '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' 
                        : '2px 2px 4px rgba(0,0,0,0.5)',
                    lineHeight: 1.2
                }}
            >
                {text}
            </h1>
        </div>
    );
}