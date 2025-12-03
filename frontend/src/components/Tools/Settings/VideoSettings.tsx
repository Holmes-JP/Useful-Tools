import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

export type VideoConfig = {
    format: 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv' | 'flv' | 'wmv' | 'ts' | 'gif' | 'mp3' | 'wav' | 'm4a' | 'ogg' | 'flac';
    codecVideo: 'default' | 'libx264' | 'libx265' | 'libvpx' | 'libvpx-vp9' | 'libaom-av1' | 'mpeg2video' | 'prores' | 'copy';
    codecAudio: 'default' | 'aac' | 'libmp3lame' | 'libopus' | 'libvorbis' | 'ac3' | 'flac' | 'pcm_s16le' | 'copy';
    resolution: 'original' | '4k' | '2k' | '1080p' | '720p' | '480p' | '360p' | 'portrait_hd' | 'square_hd' | 'custom';
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
            
            {/* 基本設定 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Output Format</label>
                    <select value={config.format} onChange={(e) => update('format', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm font-bold">
                        <optgroup label="Video">
                            <option value="mp4">MP4 (Standard)</option>
                            <option value="mov">MOV (QuickTime)</option>
                            <option value="webm">WebM (Web)</option>
                            <option value="mkv">MKV (Matroska)</option>
                            <option value="avi">AVI</option>
                            <option value="wmv">WMV (Windows)</option>
                            <option value="flv">FLV (Flash)</option>
                            <option value="ts">MPEG-TS</option>
                            <option value="gif">GIF (Animation)</option>
                        </optgroup>
                        <optgroup label="Audio Only">
                            <option value="mp3">MP3</option>
                            <option value="wav">WAV</option>
                            <option value="m4a">M4A (AAC)</option>
                            <option value="ogg">OGG</option>
                            <option value="flac">FLAC</option>
                        </optgroup>
                    </select>
                </div>

                <div className="flex items-end pb-2">
                     <label className="flex items-center space-x-2 cursor-pointer select-none text-white text-sm">
                        <input type="checkbox" checked={config.mute} onChange={(e) => update('mute', e.target.checked)} className="w-4 h-4 accent-primary-500" />
                        <span>Mute Audio (Remove Sound)</span>
                    </label>
                </div>
            </div>

            {/* 詳細設定トグル */}
            <div className="border-t border-gray-700 pt-2">
                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors w-full py-2"
                >
                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings (Codecs, Resolution, Bitrate)'}
                </button>

                {showAdvanced && (
                    <div className="pt-4 space-y-6 animate-fade-in-down">
                        
                        {/* Codecs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs text-gray-500 mb-1">Video Codec</label>
                                <select value={config.codecVideo} onChange={(e) => update('codecVideo', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                                    <option value="default">Auto (Recommended)</option>
                                    <option value="libx264">H.264 (x264) - Standard</option>
                                    <option value="libx265">H.265 (HEVC) - High Compression</option>
                                    <option value="libvpx">VP8 (WebM)</option>
                                    <option value="libvpx-vp9">VP9 (High Quality WebM)</option>
                                    <option value="libaom-av1">AV1 (Next Gen / Slow)</option>
                                    <option value="mpeg2video">MPEG-2 (Old DVD)</option>
                                    <option value="prores">ProRes (Editing)</option>
                                    <option value="copy">Copy (No Re-encode)</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-xs text-gray-500 mb-1">Audio Codec</label>
                                <select value={config.codecAudio} onChange={(e) => update('codecAudio', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                                    <option value="default">Auto</option>
                                    <option value="aac">AAC (Standard)</option>
                                    <option value="libmp3lame">MP3</option>
                                    <option value="libopus">Opus (High Quality)</option>
                                    <option value="libvorbis">Vorbis</option>
                                    <option value="ac3">AC3 (Dolby)</option>
                                    <option value="flac">FLAC (Lossless)</option>
                                    <option value="pcm_s16le">PCM (WAV)</option>
                                    <option value="copy">Copy (No Re-encode)</option>
                                </select>
                            </div>
                        </div>

                        {/* Resolution */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Resolution</label>
                                <select value={config.resolution} onChange={(e) => update('resolution', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                                    <option value="original">Original Size</option>
                                    <option value="4k">4K UHD (3840x2160)</option>
                                    <option value="2k">2K QHD (2560x1440)</option>
                                    <option value="1080p">Full HD (1920x1080)</option>
                                    <option value="720p">HD (1280x720)</option>
                                    <option value="480p">SD (854x480)</option>
                                    <option value="360p">Low (640x360)</option>
                                    <option value="portrait_hd">Vertical HD (1080x1920) - TikTok</option>
                                    <option value="square_hd">Square (1080x1080) - Instagram</option>
                                    <option value="custom">Custom Size...</option>
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

                        {/* Bitrate */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Video Bitrate (e.g. 5000k, 5M)</label>
                                <input type="text" placeholder="Auto" value={config.bitrateVideo} onChange={(e) => update('bitrateVideo', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Audio Bitrate (e.g. 192k, 320k)</label>
                                <input type="text" placeholder="Auto" value={config.bitrateAudio} onChange={(e) => update('bitrateAudio', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
