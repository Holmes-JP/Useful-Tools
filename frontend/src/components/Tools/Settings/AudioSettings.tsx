import React from 'react';

export type AudioConfig = {
    format: 'mp3' | 'wav' | 'aac' | 'm4a' | 'ogg' | 'flac' | 'wma' | 'aiff' | 'opus';
    bitrate: '128k' | '192k' | '256k' | '320k' | 'custom';
    customBitrate: string;
    sampleRate: number;
    channels: 'original' | '1' | '2';
    volume: number;
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
                        <option value="opus">Opus</option>
                        <option value="wma">WMA</option>
                        <option value="aiff">AIFF</option>
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
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Sample Rate (Hz)</label>
                    <select value={config.sampleRate} onChange={(e) => update('sampleRate', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value={0}>Original</option>
                        <option value={44100}>44100 Hz (CD)</option>
                        <option value={48000}>48000 Hz (Video)</option>
                        <option value={96000}>96000 Hz (Hi-Res)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Channels</label>
                    <select value={config.channels} onChange={(e) => update('channels', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value="original">Original</option>
                        <option value="2">Stereo (2ch)</option>
                        <option value="1">Mono (1ch)</option>
                    </select>
                </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
                <label className="block text-xs text-gray-500 mb-1">Metadata</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input type="text" placeholder="Title" value={config.metadataTitle} onChange={(e) => update('metadataTitle', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                    <input type="text" placeholder="Artist" value={config.metadataArtist} onChange={(e) => update('metadataArtist', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                    <input type="date" value={config.metadataDate} onChange={(e) => update('metadataDate', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                </div>
            </div>
        </div>
    );
}
