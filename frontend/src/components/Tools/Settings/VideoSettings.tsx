import React from 'react';

export type VideoConfig = {
    format: 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv' | 'flv' | 'gif' | 'mp3' | 'wav';
    codecVideo: 'default' | 'libx264' | 'libvpx' | 'libvpx-vp9' | 'copy';
    codecAudio: 'default' | 'aac' | 'libmp3lame' | 'opus' | 'copy';
    resolution: 'original' | '1080p' | '720p' | '480p' | 'custom';
    customWidth: number;
    customHeight: number;
    mute: boolean;
    frameRate: number; // 0 = original
    metadataTitle: string;
    metadataDate: string; // creation_time
};

type Props = {
    config: VideoConfig;
    onChange: (newConfig: VideoConfig) => void;
};

export default function VideoSettings({ config, onChange }: Props) {
    const update = (key: keyof VideoConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="bg-gray-800 text-gray-200 p-6 rounded-xl border border-gray-700 shadow-inner space-y-6">
            <h3 className="text-sm font-bold text-primary-400 border-b border-gray-700 pb-2 mb-4">
                Advanced Video Settings
            </h3>
            
            {/* Format & Codecs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Format</label>
                    <select value={config.format} onChange={(e) => update('format', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value="mp4">MP4 (Standard)</option>
                        <option value="webm">WebM</option>
                        <option value="mov">MOV (QuickTime)</option>
                        <option value="avi">AVI</option>
                        <option value="mkv">MKV</option>
                        <option value="gif">GIF (Animation)</option>
                        <option value="mp3">Extract Audio (MP3)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Video Codec</label>
                    <select value={config.codecVideo} onChange={(e) => update('codecVideo', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value="default">Default</option>
                        <option value="libx264">H.264 (x264)</option>
                        <option value="libvpx">VP8</option>
                        <option value="libvpx-vp9">VP9</option>
                        <option value="copy">Copy (No Re-encode)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Audio Codec</label>
                    <select value={config.codecAudio} onChange={(e) => update('codecAudio', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value="default">Default</option>
                        <option value="aac">AAC</option>
                        <option value="libmp3lame">MP3</option>
                        <option value="opus">Opus</option>
                    </select>
                </div>
            </div>

            {/* Resolution & FPS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Resolution</label>
                    <select value={config.resolution} onChange={(e) => update('resolution', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                        <option value="original">Original</option>
                        <option value="1080p">1080p (FHD)</option>
                        <option value="720p">720p (HD)</option>
                        <option value="480p">480p (SD)</option>
                        <option value="custom">Custom Size</option>
                    </select>
                </div>
                {config.resolution === 'custom' && (
                    <>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                            <input type="number" value={config.customWidth} onChange={(e) => update('customWidth', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                            <input type="number" value={config.customHeight} onChange={(e) => update('customHeight', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                        </div>
                    </>
                )}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Frame Rate (FPS)</label>
                    <input type="number" placeholder="Original" value={config.frameRate || ''} onChange={(e) => update('frameRate', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                </div>
            </div>

            {/* Metadata & Audio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Metadata: Title</label>
                    <input type="text" value={config.metadataTitle} onChange={(e) => update('metadataTitle', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" placeholder="My Video" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Metadata: Date</label>
                    <input type="datetime-local" value={config.metadataDate} onChange={(e) => update('metadataDate', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                </div>
            </div>
            
            <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer select-none text-white text-sm">
                    <input type="checkbox" checked={config.mute} onChange={(e) => update('mute', e.target.checked)} className="w-4 h-4 accent-primary-500" />
                    <span>Mute Audio</span>
                </label>
            </div>
        </div>
    );
}
