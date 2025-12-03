import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings2, Video, Music, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';

export type VideoConfig = {
    // Output Format
    format: 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv' | 'flv' | 'wmv' | 'gif' | 'mp3' | 'wav' | 'm4a' | 'ogg' | 'flac';
    
    // Video Options
    codecVideo: 'default' | 'libx264' | 'libx265' | 'libvpx' | 'libvpx-vp9' | 'copy';
    resolution: 'original' | '1080p' | '720p' | '480p' | 'custom';
    customWidth: number;
    customHeight: number;
    bitrateVideo: string;
    frameRate: number;
    
    // Audio Options
    codecAudio: 'default' | 'aac' | 'libmp3lame' | 'libopus' | 'copy';
    bitrateAudio: string;
    mute: boolean;
    volume: number;

    // Trim
    trimStart: number;
    trimEnd: number;

    // Image (GIF) Options
    loop: number; // 0 = infinite
    transparentColor: string; // hex e.g. #00FF00
    transparencyThreshold: number; // 0.0 - 1.0
};

type Props = {
    config: VideoConfig;
    onChange: (newConfig: VideoConfig) => void;
};

export default function VideoSettings({ config, onChange }: Props) {
    const [showAdvanced, setShowAdvanced] = useState(true);

    const update = (key: keyof VideoConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    // 形式判定
    const isAudioOut = ['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(config.format);
    const isGifOut = config.format === 'gif';
    const isVideoOut = !isAudioOut && !isGifOut;

    return (
        <div className="bg-gray-800 text-gray-200 p-6 rounded-xl border border-gray-700 shadow-inner space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <h3 className="text-sm font-bold text-primary-400 flex items-center gap-2">
                    <Video size={18} /> Video File Settings
                </h3>
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-gray-400 hover:text-white">
                    {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>
            
            {/* Output Format */}
            <div>
                <label className="block text-xs text-gray-500 mb-1 font-bold">Output Format</label>
                <select value={config.format} onChange={(e) => update('format', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm font-bold">
                    <optgroup label="Video">
                        <option value="mp4">MP4 (Standard)</option>
                        <option value="webm">WebM</option>
                        <option value="mov">MOV</option>
                        <option value="mkv">MKV</option>
                    </optgroup>
                    <optgroup label="Image">
                        <option value="gif">GIF (Animation)</option>
                    </optgroup>
                    <optgroup label="Audio">
                        <option value="mp3">MP3</option>
                        <option value="wav">WAV</option>
                        <option value="m4a">M4A</option>
                        <option value="flac">FLAC</option>
                    </optgroup>
                </select>
            </div>

            {showAdvanced && (
                <div className="space-y-6 pt-2 border-t border-gray-700/50">
                    
                    {/* --- Image Option (GIF) --- */}
                    {isGifOut && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 flex items-center gap-1"><ImageIcon size={12}/> Image Options (GIF)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Loop Count (0=Infinite)</label>
                                    <input type="number" min="0" value={config.loop} onChange={e => update('loop', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">FPS</label>
                                    <input type="number" value={config.frameRate} placeholder="Original" onChange={e => update('frameRate', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Width (px)</label>
                                    <input type="number" value={config.customWidth} onChange={e => update('customWidth', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Transparent Color (Key)</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={config.transparentColor} onChange={e => update('transparentColor', e.target.value)} className="h-8 w-8 cursor-pointer bg-transparent"/>
                                        <input type="text" value={config.transparentColor} onChange={e => update('transparentColor', e.target.value)} className="flex-1 bg-gray-900 border border-gray-600 rounded p-1 text-white text-xs"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Transparency Threshold</label>
                                    <input type="range" min="0" max="1" step="0.05" value={config.transparencyThreshold} onChange={e => update('transparencyThreshold', parseFloat(e.target.value))} className="w-full accent-primary-500"/>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Video Option --- */}
                    {isVideoOut && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 flex items-center gap-1"><Video size={12}/> Video Options</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Video Codec</label>
                                    <select value={config.codecVideo} onChange={e => update('codecVideo', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs">
                                        <option value="default">Auto</option>
                                        <option value="libx264">H.264</option>
                                        <option value="libx265">H.265</option>
                                        <option value="libvpx-vp9">VP9</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Resolution</label>
                                    <select value={config.resolution} onChange={e => update('resolution', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs">
                                        <option value="original">Original</option>
                                        <option value="1080p">1080p</option>
                                        <option value="720p">720p</option>
                                        <option value="480p">480p</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Bitrate (e.g. 2M)</label>
                                    <input type="text" value={config.bitrateVideo} onChange={e => update('bitrateVideo', e.target.value)} placeholder="Auto" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs"/>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Audio Option --- */}
                    {(isAudioOut || isVideoOut) && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 flex items-center gap-1"><Music size={12}/> Audio Options</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Audio Codec</label>
                                    <select value={config.codecAudio} onChange={e => update('codecAudio', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs">
                                        <option value="default">Auto</option>
                                        <option value="aac">AAC</option>
                                        <option value="libmp3lame">MP3</option>
                                        <option value="copy">Copy</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Bitrate (e.g. 192k)</label>
                                    <input type="text" value={config.bitrateAudio} onChange={e => update('bitrateAudio', e.target.value)} placeholder="Auto" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Volume (0-2.0)</label>
                                    <input type="number" step="0.1" value={config.volume} onChange={e => update('volume', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs"/>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input type="checkbox" checked={config.mute} onChange={e => update('mute', e.target.checked)} className="accent-primary-500"/>
                                <span className="text-xs text-gray-400">Mute Audio</span>
                            </div>
                        </div>
                    )}

                    {/* --- Trim Options (Common) --- */}
                    <div className="space-y-3 border-t border-gray-700 pt-3">
                        <h4 className="text-xs font-bold text-gray-400">Trim (Cut)</h4>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-[10px] text-gray-500 mb-1">Start Time (s)</label>
                                <input type="number" min="0" value={config.trimStart} onChange={e => update('trimStart', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs"/>
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] text-gray-500 mb-1">End Time (s, 0=End)</label>
                                <input type="number" min="0" value={config.trimEnd} onChange={e => update('trimEnd', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-xs"/>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
