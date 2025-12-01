import React from 'react';

export type ImageConfig = {
    format: 'original' | 'png' | 'jpeg' | 'webp' | 'bmp' | 'ico' | 'pdf';
    quality: number; // 0.1 - 1.0
};

type Props = {
    config: ImageConfig;
    onChange: (newConfig: ImageConfig) => void;
};

export default function ImageSettings({ config, onChange }: Props) {
    const update = (key: keyof ImageConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="bg-gray-800 text-gray-200 p-6 rounded-xl border border-gray-700 shadow-inner space-y-6">
            <h3 className="text-sm font-bold text-primary-400 border-b border-gray-700 pb-2 mb-4">
                Image Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Output Format</label>
                    <select value={config.format} onChange={(e) => update('format', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value="original">Original</option>
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="webp">WebP</option>
                        <option value="bmp">BMP</option>
                        <option value="ico">ICO</option>
                        <option value="pdf">PDF (Document)</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-xs text-gray-500 mb-1">
                        Quality (JPEG/WebP): {Math.round(config.quality * 100)}%
                    </label>
                    <input type="range" min="0.1" max="1.0" step="0.05" value={config.quality} onChange={(e) => update('quality', parseFloat(e.target.value))} className="w-full accent-primary-500" />
                </div>
            </div>
        </div>
    );
}
