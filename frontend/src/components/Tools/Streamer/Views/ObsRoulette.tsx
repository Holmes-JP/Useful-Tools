import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsRoulette() {
    const [searchParams] = useSearchParams();
    
    // URLから設定を取得
    // items=A,B,C... (カンマ区切り)
    const rawItems = searchParams.get('items');
    const items = rawItems ? rawItems.split(',') : ['Win', 'Lose', 'Draw', 'Retry'];
    
    const bgColor = searchParams.get('bg') || 'transparent';
    const font = searchParams.get('font') || 'sans-serif';

    // 色パレット（配信映えする色）
    const colors = [
        '#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#073B4C', 
        '#9D4EDD', '#FF9F1C', '#2EC4B6'
    ];

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);

    // 円盤の描画
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 500; // キャンバスサイズ
        const center = size / 2;
        const radius = size / 2 - 10; // 少し余白
        const step = (2 * Math.PI) / items.length;

        canvas.width = size;
        canvas.height = size;

        ctx.clearRect(0, 0, size, size);
        ctx.font = `bold ${items.length > 10 ? '20px' : '30px'} ${font}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        items.forEach((item, i) => {
            const startAngle = i * step - Math.PI / 2; // -90度(上)から開始
            const endAngle = startAngle + step;
            const color = colors[i % colors.length];

            // 扇形を描画
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngle, endAngle);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.stroke();

            // テキストを描画
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(startAngle + step / 2); // 扇形の中心角度
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            // 半径の85%の位置にテキスト配置
            ctx.fillText(item, radius * 0.85, 0); 
            ctx.restore();
        });

    }, [items, font]);

    // ルーレット回転
    const spin = () => {
        if (isSpinning) return;
        
        setIsSpinning(true);
        setWinner(null);

        // 最低5回転(1800度) + ランダム(0~360度)
        const randomDegree = Math.floor(Math.random() * 360);
        const totalRotation = 1800 + randomDegree;
        
        // 前回の角度に加算することで逆回転を防ぐ
        // ※360で割った余りを考慮して、常に新しい回転を加える
        setRotation(prev => prev + totalRotation);

        // 5秒後に結果判定 (CSSのtransition時間と合わせる)
        setTimeout(() => {
            setIsSpinning(false);
            
            // 当選インデックスの計算
            // 現在の総回転数を正規化
            const actualRotation = (rotation + totalRotation) % 360;
            // 針は上(0度地点)にある。円盤は右回転する。
            // 針の位置に来るセグメントは、360 - 回転角度 の位置にある
            const degreePerItem = 360 / items.length;
            const winningIndex = Math.floor(((360 - actualRotation) % 360) / degreePerItem);
            
            setWinner(items[winningIndex]);
        }, 5000); 
    };

    return (
        <div 
            className="w-screen h-screen flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer"
            style={{ backgroundColor: bgColor }}
            onClick={spin}
        >
            {/* 針 (Pointer) */}
            <div className="absolute z-10 top-[50%] -translate-y-[260px]">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-red-600 drop-shadow-lg" />
            </div>

            {/* 円盤本体 */}
            <div 
                style={{ 
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none' 
                }}
                className="relative"
            >
                <canvas ref={canvasRef} className="max-w-[80vw] max-h-[80vh] drop-shadow-2xl" />
            </div>

            {/* 結果表示 */}
            {winner && !isSpinning && (
                <div className="absolute z-20 bg-black/80 text-white px-8 py-4 rounded-2xl text-4xl font-bold animate-bounce border-2 border-primary-500 backdrop-blur-sm">
                    {winner}
                </div>
            )}
            
            {!isSpinning && !winner && (
                <div className="absolute bottom-10 text-white/50 font-bold bg-black/30 px-4 py-1 rounded">
                    CLICK TO SPIN
                </div>
            )}
        </div>
    );
}