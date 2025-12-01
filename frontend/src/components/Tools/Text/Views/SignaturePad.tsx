import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, Download, Eraser } from 'lucide-react';

export default function SignaturePad() {
    const sigPad = useRef<any>({});
    const [penColor, setPenColor] = useState('#000000');
    // 背景色のstateは維持するが、透明時のグリッド表示はCSSで制御
    const [bgColor] = useState('transparent'); 

    const clear = () => sigPad.current?.clear();
    
    const download = () => {
        if (sigPad.current?.isEmpty()) return;
        
        // 修正: getTrimmedCanvas() はVite環境でクラッシュするため、
        // 標準の getCanvas() を使用してそのまま保存する実装に変更。
        const canvas = sigPad.current.getCanvas();
        const url = canvas.toDataURL('image/png');
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'signature.png';
        a.click();
    };

    return (
        <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border-4 border-gray-700 overflow-hidden shadow-xl relative group">
                <SignatureCanvas 
                    ref={sigPad}
                    penColor={penColor}
                    backgroundColor={bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor}
                    canvasProps={{ className: 'w-full h-64 cursor-crosshair relative z-10' }}
                />
                
                {/* 修正: 外部画像を使わず、CSSグラデーションでドット柄を描画 (COEPエラー回避) */}
                <div 
                    className="absolute inset-0 -z-0 opacity-30 pointer-events-none" 
                    style={{
                        backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />
            </div>

            <div className="bg-surface border border-gray-700 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <PenTool size={18} className="text-gray-400" />
                        <input 
                            type="color" 
                            value={penColor} 
                            onChange={e => setPenColor(e.target.value)} 
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-600" 
                            title="Pen Color" 
                        />
                    </div>
                    <button onClick={clear} className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition text-sm font-bold">
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
