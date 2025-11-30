import { useState } from 'react';
import { evaluate, format } from 'mathjs';

export type HistoryItem = {
    expression: string;
    result: string;
    timestamp: number;
};

export const useCalculator = () => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    // 数式の評価
    const calculate = () => {
        try {
            if (!input) return;
            
            // mathjsで計算 (14桁で丸めるなど調整)
            const calculated = evaluate(input);
            const formatted = format(calculated, { precision: 14 });
            
            setResult(formatted);
            setError(null);

            // 履歴に追加
            setHistory(prev => [{
                expression: input,
                result: formatted,
                timestamp: Date.now()
            }, ...prev].slice(0, 50)); // 最大50件

        } catch (err) {
            setError("Invalid Expression");
        }
    };

    // ボタン入力処理
    const append = (val: string) => {
        setInput(prev => prev + val);
        setError(null);
    };

    const clear = () => {
        setInput('');
        setResult('');
        setError(null);
    };

    const backspace = () => {
        setInput(prev => prev.slice(0, -1));
    };

    return {
        input,
        result,
        history,
        error,
        setInput,
        append,
        clear,
        backspace,
        calculate,
        setHistory // 履歴クリア用
    };
};