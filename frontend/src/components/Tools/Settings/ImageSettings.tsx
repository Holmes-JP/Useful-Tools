import React from 'react';

export type ImageConfig = {
    format: 'original' | 'jpeg' | 'png' | 'webp';
    quality: number;
    maxWidth: number;
};

type Props = {
    config: ImageConfig;
    onChange: (config: ImageConfig) => void;
};

export default function ImageSettings({ config, onChange }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div>
                <label className="block text-xs text-gray-400 mb-1">Format</label>
                <select 
                    value={config.format}
                    onChange={(e) => onChange({ ...config, format: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                >
                    <option value="original">Keep Original</option>
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                </select>
            </div>
            <div>
                <label className="block text-xs text-gray-400 mb-1">Quality ({Math.round(config.quality * 100)}%)</label>
                <input 
                    type="range" min="0.1" max="1.0" step="0.1"
                    value={config.quality}
                    onChange={(e) => onChange({ ...config, quality: Number(e.target.value) })}
                    className="w-full accent-primary-500"
                />
            </div>
            <div>
                <label className="block text-xs text-gray-400 mb-1">Max Width (px)</label>
                <input 
                    type="number"
                    value={config.maxWidth || ''}
                    placeholder="Original"
                    onChange={(e) => onChange({ ...config, maxWidth: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                />
            </div>
        </div>
    );
}
