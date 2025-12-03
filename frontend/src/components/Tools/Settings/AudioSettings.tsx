import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings2, Music, Video } from 'lucide-react';
import clsx from 'clsx';

export type AudioConfig = {
    format: 'mp3' | 'wav' | 'aac' | 'm4a' | 'ogg' | 'flac' | 'mp4' | 'mov'; // Video formats added
    
    // Audio Options
    bitrate: '128k' | '192k' | '256k' | '320k' | 'custom';
    customBitrate: string;
    sampleRate: number;
    channels: 'original' | '1' | '2';
    volume: number;

    // Video Options (when converting to video)
    videoVisual: 'black' | 'waveform' | 'spectrum';
    
    // Trim
    trimStart: number;
    trimEnd: number;
};

type Props = {
    config: AudioConfig;
    onChange: (newConfig: AudioConfig) => void;
};

export default function AudioSettings({ config, onChange }: Props) {
    const [showAdvanced, setShowAdvanced] = useState(true);
    const update = (key: keyof AudioConfig, value: any) => { onChange({ ...config, [key]: value }); };

    const isVideoOut = ['mp4', 'mov'].includes(config.format);

    return (
        <div className="bg-gray-800 text-gray-200 p-6 rounded-xl border border-gray-700 shadow-inner space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <h3 className="text-sm font-bold text-primary-400 flex items-center gap-2">
                    <Music size={18} /> Audio File Settings
                </h3>
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-gray-400 hover:text-white">
                    {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>
            
            {/* Output Format */}
            <div>
                <label className="block text-xs text-gray-500 mb-1 font-bold">Output Format</label>
                <select value={config.format} onChange={(e) => update('format', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm font-bold">
                    <optgroup label="Audio">
                        <option value="mp3">MP3</option>
                        <option value="wav">WAV</option>
                        <option value="aac">AAC</option>
                        <option value="m4a">M4A</option>
                        <option value="flac">FLAC</option>
                    </optgroup>
                    <optgroup label="Video">
                        <option value="mp4">MP4 (Video)</option>
                        <option value="mov">MOV (Video)</option>
                    </optgroup>
                </select>
            </div>

            {showAdvanced && (
                <div className="space-y-6 pt-2 border-t border-gray-700/50">
                    {/* Video Option */}
                    {isVideoOut && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 flex items-center gap-1"><Video size={12}/> Video Visualization</h4>
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1">Background Style</label>
                                <select value={config.videoVisual} onChange={e => update('videoVisual', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs">
                                    <option value="black">Black Screen</option>
                                    <option value="waveform">Waveform</option>
                                    <option value="spectrum">Spectrum</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Audio Option */}
                    <div className="space-y-3">
                         <h4 className="text-xs font-bold text-gray-400 flex items-center gap-1"><Music size={12}/> Audio Options</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-[10px] text-gray-500 mb-1">Bitrate</label>
                                <select value={config.bitrate} onChange={e => update('bitrate', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs">
                                    <option value="128k">128k</option>
                                    <option value="192k">192k</option>
                                    <option value="320k">320k</option>
                                    <option value="custom">Custom</option>
                                </select>
                                {config.bitrate === 'custom' && <input type="text" value={config.customBitrate} onChange={e => update('customBitrate', e.target.value)} placeholder="e.g. 256k" className="w-full mt-1 bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs"/>}
                            </div>
                             <div>
                                <label className="block text-[10px] text-gray-500 mb-1">Volume</label>
                                <input type="range" min="0" max="2" step="0.1" value={config.volume} onChange={e => update('volume', Number(e.target.value))} className="w-full accent-primary-500" />
                            </div>
                        </div>
                    </div>

                     {/* Trim */}
                     <div className="space-y-3 border-t border-gray-700 pt-3">
                        <h4 className="text-xs font-bold text-gray-400">Trim</h4>
                        <div className="flex gap-4">
                            <div className="flex-1"><label className="block text-[10px] text-gray-500 mb-1">Start (s)</label><input type="number" min="0" value={config.trimStart} onChange={e => update('trimStart', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs"/></div>
                            <div className="flex-1"><label className="block text-[10px] text-gray-500 mb-1">End (s)</label><input type="number" min="0" value={config.trimEnd} onChange={e => update('trimEnd', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs"/></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
