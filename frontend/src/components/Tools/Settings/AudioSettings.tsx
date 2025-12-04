

import { useState } from 'react';

export type AudioConfig = {
    format: 'mp3' | 'wav' | 'm4a' | 'aac' | 'ogg' | 'flac' | 'mp4' | 'mov' | 'avi' | 'mkv' | 'webm' | 'flv' | 'wmv' | 'm4v';
    bitrate: string;
    // Audio Options (拡張)
    audioCodec?: 'aac' | 'mp3' | 'libopus' | 'libvorbis' | 'flac' | 'pcm_s16le' | 'pcm_s24le' | 'alac' | 'ac3' | 'eac3' | 'dts' | 'wmav2' | 'copy';
    audioVolume?: string;
    audioSampleRate?: 'original' | '48000' | '44100' | '32000' | '22050' | '16000' | '8000';
    audioChannels?: 'original' | 'stereo' | 'mono' | '5.1' | '7.1';
    audioNormalize?: boolean;
    audioFadeIn?: string;
    audioFadeOut?: string;
    trimStart?: string;
    trimEnd?: string;
    // Video Options (when converting to video)
    resolution?: 'original' | '1080p' | '720p' | '480p';
    videoCodec?: 'libx264' | 'libx265' | 'libvpx-vp9' | 'copy';
    frameRate?: 'original' | '60' | '30' | '24' | '15';
    videoBitrate?: 'original' | '8M' | '4M' | '2M' | '1M';
    aspectRatio?: 'original' | '16:9' | '4:3' | '1:1' | '21:9';
    rotate?: '0' | '90' | '180' | '270';
    brightness?: string;
    contrast?: string;
    saturation?: string;
    deinterlace?: boolean;
    pixelFormat?: 'original' | 'yuv420p' | 'yuv422p' | 'yuv444p';
};

type Props = {
    config: AudioConfig;
    onChange: (newConfig: AudioConfig) => void;
};

export default function AudioSettings({ config, onChange }: Props) {
    // フォーマット判定
    const isVideoFormat = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v'].includes(config.format);
    const [openSections, setOpenSections] = useState({ audio: false, video: false });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="space-y-4 bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-bold text-white">音声ファイル設定</h3>
            
            {/* 出力フォーマット */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <label className="block text-xs text-gray-400 mb-2">出力フォーマット</label>
                <select 
                    value={config.format}
                    onChange={(e) => onChange({ ...config, format: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                >
                    <optgroup label="音声">
                        <option value="mp3">MP3</option>
                        <option value="wav">WAV</option>
                        <option value="m4a">M4A (AAC)</option>
                        <option value="aac">AAC</option>
                        <option value="ogg">OGG</option>
                        <option value="flac">FLAC</option>
                    </optgroup>
                    <optgroup label="動画">
                        <option value="mp4">MP4 (H.264)</option>
                        <option value="mov">MOV (QuickTime)</option>
                        <option value="avi">AVI</option>
                        <option value="mkv">MKV (Matroska)</option>
                        <option value="webm">WebM (VP9)</option>
                        <option value="flv">FLV (Flash)</option>
                        <option value="wmv">WMV (Windows Media)</option>
                        <option value="m4v">M4V (iTunes)</option>
                    </optgroup>
                </select>
            </div>

            {/* Audio Options - トグル可能 */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <button
                    type="button"
                    onClick={() => toggleSection('audio')}
                    className="w-full flex items-center justify-between text-sm font-semibold text-gray-300"
                    aria-expanded={openSections.audio}
                >
                    <span>音声オプション</span>
                    <span className="text-xs text-primary-400">{openSections.audio ? '閉じる' : '表示'}</span>
                </button>
                {openSections.audio && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">オーディオコーデック</label>
                        <select 
                            value={config.audioCodec || 'aac'}
                            onChange={(e) => onChange({ ...config, audioCodec: e.target.value as any })}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                        >
                            <optgroup label="Lossy (Compressed)">
                                <option value="aac">AAC (Advanced Audio Coding)</option>
                                <option value="mp3">MP3 (MPEG Audio Layer 3)</option>
                                <option value="libopus">Opus (Low Latency)</option>
                                <option value="libvorbis">Vorbis (OGG)</option>
                                <option value="ac3">AC-3 (Dolby Digital)</option>
                                <option value="eac3">E-AC-3 (Dolby Digital Plus)</option>
                                <option value="dts">DTS (Digital Theater Systems)</option>
                                <option value="wmav2">WMA v2 (Windows Media Audio)</option>
                            </optgroup>
                            <optgroup label="Lossless (Uncompressed)">
                                <option value="flac">FLAC (Free Lossless Audio Codec)</option>
                                <option value="alac">ALAC (Apple Lossless)</option>
                                <option value="pcm_s16le">PCM 16-bit (WAV)</option>
                                <option value="pcm_s24le">PCM 24-bit (WAV High Quality)</option>
                            </optgroup>
                            <optgroup label="Other">
                                <option value="copy">Copy (No Re-encode)</option>
                            </optgroup>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">ビットレート</label>
                        <select 
                            value={config.bitrate}
                            onChange={(e) => onChange({ ...config, bitrate: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                        >
                            <option value="320k">320 kbps (Highest)</option>
                            <option value="192k">192 kbps (High)</option>
                            <option value="128k">128 kbps (Standard)</option>
                            <option value="96k">96 kbps (Low)</option>
                            <option value="64k">64 kbps (Voice)</option>
                            <option value="48k">48 kbps (Podcast)</option>
                            <option value="32k">32 kbps (Minimal)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">サンプルレート (Hz)</label>
                        <select 
                            value={config.audioSampleRate || 'original'}
                            onChange={(e) => onChange({ ...config, audioSampleRate: e.target.value as any })}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                        >
                            <option value="original">Original</option>
                            <option value="48000">48 kHz (Professional)</option>
                            <option value="44100">44.1 kHz (CD Quality)</option>
                            <option value="32000">32 kHz</option>
                            <option value="22050">22.05 kHz</option>
                            <option value="16000">16 kHz (Voice)</option>
                            <option value="8000">8 kHz (Telephone)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">チャンネル</label>
                        <select 
                            value={config.audioChannels || 'original'}
                            onChange={(e) => onChange({ ...config, audioChannels: e.target.value as any })}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                        >
                            <option value="original">Original</option>
                            <option value="stereo">Stereo (2ch)</option>
                            <option value="mono">Mono (1ch)</option>
                            <option value="5.1">5.1 Surround</option>
                            <option value="7.1">7.1 Surround</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">音量調整</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="range"
                                min="0"
                                max="3"
                                step="0.05"
                                value={config.audioVolume || '1.0'}
                                onChange={(e) => onChange({ ...config, audioVolume: e.target.value })}
                                className="w-full accent-primary-500"
                            />
                            <span className="text-xs text-gray-300 w-12 text-right">
                                {(() => {
                                    const num = parseFloat(config.audioVolume || '1.0');
                                    return Number.isFinite(num) ? `${Math.round(num * 100)}%` : '--';
                                })()}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">1.0 = 100%、2.0 = 200%、0.5 = 50%</p>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">フェードイン (seconds)</label>
                        <input 
                            type="text"
                            value={config.audioFadeIn || ''}
                            onChange={(e) => onChange({ ...config, audioFadeIn: e.target.value })}
                            placeholder="0"
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">フェードアウト (seconds)</label>
                        <input 
                            type="text"
                            value={config.audioFadeOut || ''}
                            onChange={(e) => onChange({ ...config, audioFadeOut: e.target.value })}
                            placeholder="0"
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">トリムスタート (seconds)</label>
                        <input 
                            type="text"
                            value={config.trimStart || '0'}
                            onChange={(e) => onChange({ ...config, trimStart: e.target.value })}
                            placeholder="0"
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">トリムエンド (seconds)</label>
                        <input 
                            type="text"
                            value={config.trimEnd || ''}
                            onChange={(e) => onChange({ ...config, trimEnd: e.target.value })}
                            placeholder="空白で最後まで"
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div className="flex items-center md:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={config.audioNormalize || false}
                                onChange={(e) => onChange({ ...config, audioNormalize: e.target.checked })}
                                className="rounded bg-gray-700 border-gray-500 text-primary-500"
                            />
                            <span className="text-sm text-gray-300">音量正規化 (Normalize)</span>
                        </label>
                    </div>
                    </div>
                )}
            </div>

            {/* Video Options - ビデオフォーマットの場合のみ表示 */}
            {isVideoFormat && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <button
                        type="button"
                        onClick={() => toggleSection('video')}
                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-300"
                        aria-expanded={openSections.video}
                    >
                        <span>動画オプション</span>
                        <span className="text-xs text-primary-400">{openSections.video ? '閉じる' : '表示'}</span>
                    </button>
                    {openSections.video && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Video Codec</label>
                            <select 
                                value={config.videoCodec || 'libx264'}
                                onChange={(e) => onChange({ ...config, videoCodec: e.target.value as any })}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                            >
                                <option value="libx264">H.264 (libx264)</option>
                                <option value="libx265">H.265/HEVC (libx265)</option>
                                <option value="libvpx-vp9">VP9 (libvpx-vp9)</option>
                                <option value="copy">Copy (No Re-encode)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Resolution</label>
                            <select 
                                value={config.resolution || 'original'}
                                onChange={(e) => onChange({ ...config, resolution: e.target.value as any })}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                            >
                                <option value="original">Original</option>
                                <option value="1080p">1080p (FHD)</option>
                                <option value="720p">720p (HD)</option>
                                <option value="480p">480p (SD)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Frame Rate</label>
                            <select 
                                value={config.frameRate || 'original'}
                                onChange={(e) => onChange({ ...config, frameRate: e.target.value as any })}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                            >
                                <option value="original">Original</option>
                                <option value="60">60 fps</option>
                                <option value="30">30 fps</option>
                                <option value="24">24 fps (Cinema)</option>
                                <option value="15">15 fps</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Video Bitrate</label>
                            <select 
                                value={config.videoBitrate || 'original'}
                                onChange={(e) => onChange({ ...config, videoBitrate: e.target.value as any })}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                            >
                                <option value="original">Original</option>
                                <option value="8M">8 Mbps (High)</option>
                                <option value="4M">4 Mbps (Medium)</option>
                                <option value="2M">2 Mbps (Low)</option>
                                <option value="1M">1 Mbps (Very Low)</option>
                            </select>
                        </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
