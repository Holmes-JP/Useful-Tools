import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';

export type ImageConfig = {
    format: 'original' | 'png' | 'jpeg' | 'webp' | 'bmp' | 'ico' | 'pdf';
    quality: number;
    transparentColor: string; // #FFFFFF etc
    rotate: number; // 0, 90, 180, 270
};

type Props = {
    config: ImageConfig;
    onChange: (newConfig: ImageConfig) => void;
};

export default function ImageSettings({ config, onChange }: Props) {
    const [showAdvanced, setShowAdvanced] = useState(true);
    const update = (key: keyof ImageConfig, value: any) => { onChange({ ...config, [key]: value }); };

    return (
        <div className="bg-gray-800 text-gray-200 p-6 rounded-xl border border-gray-700 shadow-inner space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <h3 className="text-sm font-bold text-primary-400 flex items-center gap-2">
                    <ImageIcon size={18} /> Image File Settings
                </h3>
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-gray-400 hover:text-white">
                    {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>
            
            <div>
                <label className="block text-xs text-gray-500 mb-1 font-bold">Output Format</label>
                <select value={config.format} onChange={(e) => update('format', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm font-bold">
                    <option value="original">Original</option>
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                    <option value="webp">WebP</option>
                    <option value="ico">ICO</option>
                    <option value="pdf">PDF (Document)</option>
                </select>
            </div>

            {showAdvanced && (
                <div className="space-y-6 pt-2 border-t border-gray-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Quality {Math.round(config.quality * 100)}%</label>
                            <input type="range" min="0.1" max="1.0" step="0.05" value={config.quality} onChange={e => update('quality', parseFloat(e.target.value))} className="w-full accent-primary-500"/>
                        </div>
                         <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Rotate</label>
                            <select value={config.rotate} onChange={e => update('rotate', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs">
                                <option value={0}>0°</option>
                                <option value={90}>90° CW</option>
                                <option value={180}>180°</option>
                                <option value={270}>270° CW</option>
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Transparent Replacement Color</label>
                        <div className="flex gap-2">
                            <input type="color" value={config.transparentColor} onChange={e => update('transparentColor', e.target.value)} className="h-8 w-8 cursor-pointer bg-transparent"/>
                            <input type="text" value={config.transparentColor} onChange={e => update('transparentColor', e.target.value)} className="flex-1 bg-gray-900 border border-gray-600 rounded p-1 text-white text-xs"/>
                        </div>
                        <p className="text-[10px] text-gray-500">Replaces transparent areas with this color (for JPG etc.)</p>
                    </div>
                </div>
            )}
        </div>
    );
}
