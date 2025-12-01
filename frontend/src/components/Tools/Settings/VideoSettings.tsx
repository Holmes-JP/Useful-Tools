import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

export type VideoConfig = {
    format: 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv' | 'flv' | 'wmv' | '3gp' | 'gif' | 'mp3' | 'wav';
    codecVideo: 'default' | 'libx264' | 'libvpx' | 'libvpx-vp9' | 'mpeg4' | 'copy';
    codecAudio: 'default' | 'aac' | 'libmp3lame' | 'libvorbis' | 'opus' | 'copy';
    resolution: 'original' | '4k' | '1080p' | '720p' | '480p' | 'custom';
    customWidth: number;
    customHeight: number;
    bitrateVideo: string;
    bitrateAudio: string;
    mute: boolean;
    frameRate: number;
};

type Props = {
    config: VideoConfig;
    onChange: (newConfig: VideoConfig) => void;
};

export default function VideoSettings({ config, onChange }: Props) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const update = (key: keyof VideoConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="bg-gray-800 text-gray-200 p-6 rounded-xl border border-gray-700 shadow-inner space-y-6">
            <h3 className="text-sm font-bold text-primary-400 border-b border-gray-700 pb-2 mb-4">
                Video Conversion Settings
            </h3>
            
            {/* 基本設定 (常に表示) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Format</label>
                    <select value={config.format} onChange={(e) => update('format', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value="mp4">MP4 (Standard)</option>
                        <option value="webm">WebM</option>
                        <option value="mov">MOV</option>
                        <option value="avi">AVI</option>
                        <option value="mkv">MKV</option>
                        <option value="flv">FLV</option>
                        <option value="wmv">WMV</option>
                        <option value="3gp">3GP</option>
                        <option value="gif">GIF (Animation)</option>
                        <option value="mp3">Extract Audio (MP3)</option>
                        <option value="wav">Extract Audio (WAV)</option>
                    </select>
                </div>

                <div className="flex items-end pb-2">
                     <label className="flex items-center space-x-2 cursor-pointer select-none text-white text-sm">
                        <input type="checkbox" checked={config.mute} onChange={(e) => update('mute', e.target.checked)} className="w-4 h-4 accent-primary-500" />
                        <span>Mute Audio</span>
                    </label>
                </div>

                <div>
                    <label className="block text-xs text-gray-500 mb-1">Video Codec</label>
                    <select value={config.codecVideo} onChange={(e) => update('codecVideo', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value="default">Default (Recommended)</option>
                        <option value="libx264">H.264 (x264)</option>
                        <option value="libvpx">VP8</option>
                        <option value="libvpx-vp9">VP9</option>
                        <option value="mpeg4">MPEG-4</option>
                        <option value="copy">Copy (No Re-encode)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Audio Codec</label>
                    <select value={config.codecAudio} onChange={(e) => update('codecAudio', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value="default">Default</option>
                        <option value="aac">AAC</option>
                        <option value="libmp3lame">MP3</option>
                        <option value="libvorbis">Vorbis</option>
                        <option value="opus">Opus</option>
                        <option value="copy">Copy (No Re-encode)</option>
                    </select>
                </div>
            </div>

            {/* 詳細設定 (折りたたみ) */}
            <div className="border-t border-gray-700 pt-2">
                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors w-full py-2"
                >
                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings (Resolution, Bitrate, FPS)'}
                </button>

                {showAdvanced && (
                    <div className="pt-4 space-y-4 animate-fade-in-down">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Resolution</label>
                                <select value={config.resolution} onChange={(e) => update('resolution', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                                    <option value="original">Original</option>
                                    <option value="4k">4K (2160p)</option>
                                    <option value="1080p">FHD (1080p)</option>
                                    <option value="720p">HD (720p)</option>
                                    <option value="480p">SD (480p)</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            {config.resolution === 'custom' && (
                                <>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">W (px)</label>
                                        <input type="number" value={config.customWidth} onChange={(e) => update('customWidth', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">H (px)</label>
                                        <input type="number" value={config.customHeight} onChange={(e) => update('customHeight', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Frame Rate (FPS)</label>
                                <input type="number" placeholder="Original" value={config.frameRate || ''} onChange={(e) => update('frameRate', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Video Bitrate (e.g. 6000k)</label>
                                <input type="text" placeholder="Auto" value={config.bitrateVideo} onChange={(e) => update('bitrateVideo', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Audio Bitrate (e.g. 192k)</label>
                                <input type="text" placeholder="Auto" value={config.bitrateAudio} onChange={(e) => update('bitrateAudio', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
