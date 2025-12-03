import React from 'react';

export type AudioConfig = {
    format: 'mp3' | 'wav' | 'aac' | 'm4a' | 'ogg' | 'flac';
    bitrate: '128k' | '192k' | '256k' | '320k' | 'custom';
    customBitrate: string;
    sampleRate: number;
    channels: 'original' | '1' | '2';
    volume: number;
};

type Props = {
    config: AudioConfig;
    onChange: (newConfig: AudioConfig) => void;
};

export default function AudioSettings({ config, onChange }: Props) {
    const update = (key: keyof AudioConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="bg-gray-800 text-gray-200 p-6 rounded-xl border border-gray-700 shadow-inner space-y-6">
            <h3 className="text-sm font-bold text-primary-400 border-b border-gray-700 pb-2 mb-4">
                Audio Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Format</label>
                    <select value={config.format} onChange={(e) => update('format', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value="mp3">MP3</option>
                        <option value="wav">WAV</option>
                        <option value="aac">AAC</option>
                        <option value="m4a">M4A</option>
                        <option value="ogg">OGG</option>
                        <option value="flac">FLAC</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Bitrate</label>
                    <select value={config.bitrate} onChange={(e) => update('bitrate', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value="128k">128 kbps</option>
                        <option value="192k">192 kbps</option>
                        <option value="256k">256 kbps</option>
                        <option value="320k">320 kbps</option>
                        <option value="custom">Custom</option>
                    </select>
                    {config.bitrate === 'custom' && (
                        <input type="text" placeholder="e.g. 64k" value={config.customBitrate} onChange={e => update('customBitrate', e.target.value)} className="w-full mt-2 bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                    )}
                </div>
            </div>
        </div>
    );
}
