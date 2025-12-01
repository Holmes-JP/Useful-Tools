import React from 'react';

export type AudioConfig = {
    format: 'mp3' | 'wav' | 'aac' | 'm4a' | 'ogg' | 'flac';
    bitrate: '128k' | '192k' | '256k' | '320k';
    sampleRate: number; // 44100, 48000 etc
    channels: 'original' | '1' | '2'; // 1=Mono, 2=Stereo
    volume: number; // 1.0 = 100%
    metadataTitle: string;
    metadataArtist: string;
    metadataDate: string;
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
                Advanced Audio Settings
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
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Sample Rate (Hz)</label>
                    <select value={config.sampleRate} onChange={(e) => update('sampleRate', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value={0}>Original</option>
                        <option value={44100}>44100 Hz</option>
                        <option value={48000}>48000 Hz</option>
                        <option value={96000}>96000 Hz</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Channels</label>
                    <select value={config.channels} onChange={(e) => update('channels', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value="original">Original</option>
                        <option value="2">Stereo (2)</option>
                        <option value="1">Mono (1)</option>
                    </select>
                </div>
            </div>
            
            <div>
                 <label className="text-xs text-gray-500 block mb-1 flex justify-between">
                    <span>Volume Gain</span>
                    <span>{Math.round(config.volume * 100)}%</span>
                </label>
                <input type="range" min="0" max="2" step="0.1" value={config.volume} onChange={e => update('volume', Number(e.target.value))} className="w-full accent-primary-500" />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Title</label>
                    <input type="text" value={config.metadataTitle} onChange={(e) => update('metadataTitle', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Artist</label>
                    <input type="text" value={config.metadataArtist} onChange={(e) => update('metadataArtist', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <input type="date" value={config.metadataDate} onChange={(e) => update('metadataDate', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                </div>
            </div>
        </div>
    );
}
