import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, Download, Eraser, Undo } from 'lucide-react';
import clsx from 'clsx';

export default function SignaturePad() {
    const sigPad = useRef<any>({});
    const [penColor, setPenColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('transparent'); // 保存時は透明にするか選択可だが、表示上は白ベースが見やすい

    const clear = () => sigPad.current?.clear();
    
    const download = () => {
        if (sigPad.current?.isEmpty()) return;
        const url = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'signature.png';
        a.click();
    };

    return (
        <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border-4 border-gray-700 overflow-hidden shadow-xl relative group">
                {/* 署名エリア (react-signature-canvasは白背景前提が多いので、親divで制御) */}
                <SignatureCanvas 
                    ref={sigPad}
                    penColor={penColor}
                    backgroundColor={bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor}
                    canvasProps={{ className: 'w-full h-64 cursor-crosshair' }}
                />
                
                {/* 背景が透明だとダークモードで見えないため、編集時は薄いグリッドを表示 */}
                <div className="absolute inset-0 -z-10 bg-[url('https://placehold.co/20x20/e5e5e5/ffffff.png')] opacity-50 pointer-events-none" />
            </div>

            <div className="bg-surface border border-gray-700 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <PenTool size={18} className="text-gray-400" />
                        <input type="color" value={penColor} onChange={e => setPenColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent" title="Pen Color" />
                    </div>
                    <button onClick={clear} className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition">
                        <Eraser size={18} /> Clear
                    </button>
                </div>

                <button 
                    onClick={download}
                    className="bg-primary-500 text-black font-bold px-6 py-2 rounded-full hover:bg-primary-400 transition flex items-center gap-2 shadow-lg"
                >
                    <Download size={18} /> Download PNG
                </button>
            </div>
            
            <p className="text-center text-xs text-gray-500">
                ※透明背景のPNG画像として保存されます。
            </p>
        </div>
    );
}
