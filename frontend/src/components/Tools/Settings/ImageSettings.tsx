import React from 'react';
import { ImageOptions } from '@/hooks/useImageConverter'; // 型をインポート

type Props = {
    config: ImageOptions;
    onChange: (newConfig: ImageOptions) => void;
};

export default function ImageSettings({ config, onChange }: Props) {
    
    const update = (key: keyof ImageOptions, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="bg-gray-800 text-gray-200 p-6 rounded-xl border border-gray-700 shadow-inner">
            <h3 className="text-sm font-bold text-gray-400 mb-4 border-b border-gray-700 pb-2">
                Image Compression Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. 出力フォーマット */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Output Format</label>
                    <select
                        value={config.format}
                        onChange={(e) => update('format', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                        <option value="original">Original (Keep same)</option>
                        <option value="webp">WebP (Best Compression)</option>
                        <option value="jpeg">JPEG (Standard)</option>
                        <option value="png">PNG (Lossless)</option>
                    </select>
                </div>

                {/* 2. リサイズ */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Max Width (px)</label>
                    <select
                        value={config.maxWidth}
                        onChange={(e) => update('maxWidth', Number(e.target.value))}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                        <option value={0}>Original Size</option>
                        <option value={1920}>1920 px (Full HD)</option>
                        <option value={1280}>1280 px</option>
                        <option value={800}>800 px</option>
                    </select>
                </div>
                
                {/* 3. 画質スライダー */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                        Quality: {Math.round(config.quality * 100)}%
                    </label>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="1.0" 
                        step="0.1"
                        value={config.quality}
                        onChange={(e) => update('quality', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Low Size</span>
                        <span>High Quality</span>
                    </div>
                </div>
            </div>
        </div>
    );
}