import React, { useState } from 'react';
import { useCalculator } from '@/hooks/useCalculator';
// 【修正1】Copy を追加
import { Calculator, Binary, Ruler, History, Trash2, Delete, Copy } from 'lucide-react';
import clsx from 'clsx';

// --- ボタンコンポーネント ---
const Btn = ({ label, onClick, className, color = "bg-gray-700" }: any) => (
    <button
        onClick={onClick}
        className={clsx(
            "h-14 rounded-lg font-bold text-lg transition shadow-md active:scale-95 flex items-center justify-center",
            color,
            className
        )}
    >
        {label}
    </button>
);

export default function CalculatorTools() {
    // 【修正2】setInput を追加
    const { input, result, history, error, setInput, append, clear, backspace, calculate, setHistory } = useCalculator();
    const [mode, setMode] = useState<'standard' | 'scientific' | 'programmer'>('standard');

    // キーパッド定義
    const standardKeys = [
        ['C', '(', ')', '/'],
        ['7', '8', '9', '*'],
        ['4', '5', '6', '-'],
        ['1', '2', '3', '+'],
        ['0', '.', '<', '=']
    ];

    const sciKeys = [
        ['sin', 'cos', 'tan', 'deg'],
        ['asin', 'acos', 'atan', 'rad'],
        ['sqrt', 'log', 'ln', '^'],
        ['pi', 'e', '!', '%']
    ];

    const handleKey = (key: string) => {
        if (key === '=') calculate();
        else if (key === 'C') clear();
        else if (key === '<') backspace();
        else append(key);
    };

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 左側: 計算機本体 */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* モード切替タブ */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {[
                        { id: 'standard', label: 'Standard', icon: Calculator },
                        { id: 'scientific', label: 'Scientific', icon: Ruler },
                        { id: 'programmer', label: 'Programmer', icon: Binary },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setMode(tab.id as any)}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition whitespace-nowrap",
                                mode === tab.id 
                                    ? "bg-primary-500 text-black shadow-lg" 
                                    : "bg-surface text-gray-400 hover:bg-gray-800"
                            )}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* ディスプレイ */}
                <div className="bg-surface border border-gray-700 p-6 rounded-2xl shadow-inner text-right">
                    <div className="h-8 text-gray-400 font-mono text-sm overflow-hidden">
                        {error ? <span className="text-red-500">{error}</span> : "Ready"}
                    </div>
                    <div className="h-16 text-4xl text-white font-mono font-bold overflow-x-auto whitespace-nowrap scrollbar-hide">
                        {input || '0'}
                    </div>
                    <div className="h-12 text-2xl text-primary-500 font-mono font-bold mt-2">
                        {result ? `= ${result}` : ''}
                    </div>
                </div>

                {/* キーパッドエリア */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* 科学計算キー (Scientificモードのみ表示) */}
                    {mode === 'scientific' && (
                        <div className="grid grid-cols-4 gap-3">
                            {sciKeys.flat().map(k => (
                                <Btn 
                                    key={k} 
                                    label={k} 
                                    onClick={() => append(k === 'pi' ? 'pi' : k + '(')} 
                                    color="bg-gray-800 text-primary-400 text-sm" 
                                />
                            ))}
                        </div>
                    )}

                    {/* プログラマーキー (簡易実装: 2進/16進変換ボタン) */}
                    {mode === 'programmer' && (
                        <div className="col-span-2 bg-gray-900 p-4 rounded-xl border border-gray-800 mb-4">
                            <p className="text-xs text-gray-500 mb-2">Base Conversion (Current Result)</p>
                            {result && !isNaN(Number(result)) ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-sm">
                                    <div>
                                        <span className="text-gray-500 block">HEX</span>
                                        <span className="text-white">{Number(result).toString(16).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">DEC</span>
                                        <span className="text-white">{result}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">BIN</span>
                                        <span className="text-white">{Number(result).toString(2)}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-600">Calculate a number to see conversions</p>
                            )}
                        </div>
                    )}

                    {/* 標準キーパッド (常に表示) */}
                    <div className={clsx("grid grid-cols-4 gap-3", mode === 'scientific' ? "" : "col-span-2")}>
                        {standardKeys.map((row, i) => (
                            <React.Fragment key={i}>
                                {row.map(key => {
                                    let color = "bg-gray-700 text-white hover:bg-gray-600";
                                    let content: React.ReactNode = key;
                                    
                                    if (['/', '*', '-', '+'].includes(key)) color = "bg-primary-500/20 text-primary-400 hover:bg-primary-500/30";
                                    if (key === '=') color = "bg-primary-500 text-black hover:bg-primary-400";
                                    if (key === 'C') color = "bg-red-500/20 text-red-400 hover:bg-red-500/30";
                                    if (key === '<') content = <Delete size={20} />;

                                    return (
                                        <Btn 
                                            key={key} 
                                            label={content} 
                                            onClick={() => handleKey(key)} 
                                            color={color} 
                                        />
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* 右側: 履歴 */}
            <div className="bg-surface border border-gray-700 rounded-2xl p-4 flex flex-col h-[500px] lg:h-auto">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
                    <h3 className="font-bold text-gray-300 flex items-center gap-2">
                        <History size={18} /> History
                    </h3>
                    <button onClick={() => setHistory([])} className="text-gray-500 hover:text-red-400 transition">
                        <Trash2 size={18} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {history.length === 0 ? (
                        <p className="text-center text-gray-600 text-sm mt-10">No history yet</p>
                    ) : (
                        history.map((item, i) => (
                            <div 
                                key={i} 
                                onClick={() => { setInput(item.result); }}
                                className="p-3 rounded-lg bg-gray-900/50 hover:bg-gray-800 cursor-pointer transition border border-transparent hover:border-gray-700 group"
                            >
                                <p className="text-xs text-gray-500 font-mono mb-1">{item.expression} =</p>
                                <div className="flex justify-between items-center">
                                    <p className="text-lg text-primary-400 font-bold font-mono">{item.result}</p>
                                    <Copy size={14} className="text-gray-600 opacity-0 group-hover:opacity-100 transition" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}