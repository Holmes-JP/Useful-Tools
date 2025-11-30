import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';

export default function ObsDice() {
    const [searchParams] = useSearchParams();
    const color = searchParams.get('color') || '#ffffff'; // サイコロの色
    const dotColor = searchParams.get('dot') || '#000000'; // 点の色
    const count = Math.min(Math.max(Number(searchParams.get('n')) || 1, 1), 4); // 1~4個

    const [dice, setDice] = useState<number[]>(new Array(count).fill(1));
    const [isRolling, setIsRolling] = useState(false);

    const roll = () => {
        if (isRolling) return;
        setIsRolling(true);

        // アニメーション演出
        let rolls = 0;
        const maxRolls = 20;
        const interval = setInterval(() => {
            setDice(prev => prev.map(() => Math.ceil(Math.random() * 6)));
            rolls++;
            if (rolls >= maxRolls) {
                clearInterval(interval);
                setIsRolling(false);
            }
        }, 100);
    };

    // サイコロの目を描画するヘルパー
    const Die = ({ value }: { value: number }) => {
        // ドットの位置パターン
        const dotPosition = [
            [], // 0 (dummy)
            [4], // 1
            [0, 8], // 2
            [0, 4, 8], // 3
            [0, 2, 6, 8], // 4
            [0, 2, 4, 6, 8], // 5
            [0, 2, 3, 5, 6, 8] // 6
        ];

        return (
            <div 
                className="w-24 h-24 rounded-xl shadow-xl flex flex-wrap p-2 transition-transform duration-100"
                style={{ backgroundColor: color }}
            >
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-1/3 h-1/3 flex items-center justify-center">
                        {dotPosition[value].includes(i) && (
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: dotColor }} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div 
            className="w-screen h-screen flex items-center justify-center gap-6 cursor-pointer select-none"
            onClick={roll}
        >
            {dice.map((val, i) => (
                <div key={i} className={clsx(isRolling && "animate-bounce")}>
                    <Die value={val} />
                </div>
            ))}
        </div>
    );
}