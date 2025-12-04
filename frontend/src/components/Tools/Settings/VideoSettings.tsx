<<<<<<< HEAD
import { useState } from 'react';

export type VideoConfig = {
    format: 'mp4' | 'mov' | 'avi' | 'mkv' | 'webm' | 'flv' | 'wmv' | 'm4v' | 'gif' | 'mp3' | 'aac' | 'wav' | 'ogg';
    resolution: 'original' | '2160p' | '1440p' | '1080p' | '720p' | '480p' | '360p' | '240p';
    mute: boolean;
    // Video Options
    videoCodec: 'libx264' | 'libx265' | 'libvpx-vp9' | 'libaom-av1' | 'mpeg4' | 'copy';
    trimStart: string;
    trimEnd: string;
    frameRate: 'original' | '120' | '90' | '60' | '50' | '30' | '29.97' | '25' | '24' | '23.976' | '15';
    videoBitrate: 'original' | '20M' | '15M' | '12M' | '10M' | '8M' | '6M' | '4M' | '3M' | '2M' | '1M' | '800k' | '500k';
    aspectRatio: 'original' | '16:9' | '9:16' | '4:3' | '3:2' | '1:1' | '21:9';
    rotate: '0' | '90' | '180' | '270';
    brightness: string;
    contrast: string;
    saturation: string;
    deinterlace: boolean;
    pixelFormat: 'original' | 'yuv420p' | 'yuv422p' | 'yuv444p';
    // Audio Options
    audioCodec: 'aac' | 'mp3' | 'libopus' | 'libvorbis' | 'flac' | 'pcm_s16le' | 'pcm_s24le' | 'alac' | 'ac3' | 'eac3' | 'dts' | 'wmav2' | 'copy';
    audioBitrate: '320k' | '192k' | '128k' | '96k' | '64k' | '48k' | '32k';
    audioVolume: string;
    audioSampleRate: 'original' | '48000' | '44100' | '32000' | '22050' | '16000' | '8000';
    audioChannels: 'original' | 'stereo' | 'mono' | '5.1' | '7.1';
    audioNormalize: boolean;
    audioFadeIn: string;
    audioFadeOut: string;
    // GIF Image Options
    gifWidth: string;
    gifLoop: string;
    gifFps: string;
    gifCompression: '0' | '1' | '2' | '3';
    gifTransparent: boolean;
=======
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
>>>>>>> 8a92cacec6b709993ac994f025af737c1c0a3fcf
};

type Props = {
    config: VideoConfig;
    onChange: (newConfig: VideoConfig) => void;
};

const resolutionOptions: { value: VideoConfig['resolution']; label: string }[] = [
    { value: 'original', label: 'Original' },
    { value: '2160p', label: '2160p (4K UHD)' },
    { value: '1440p', label: '1440p (QHD)' },
    { value: '1080p', label: '1080p (FHD)' },
    { value: '720p', label: '720p (HD)' },
    { value: '480p', label: '480p (SD)' },
    { value: '360p', label: '360p (Web SD)' },
    { value: '240p', label: '240p (Low)' },
];

const videoCodecOptions: { value: VideoConfig['videoCodec']; label: string }[] = [
    { value: 'libx264', label: 'H.264 (libx264)' },
    { value: 'libx265', label: 'H.265/HEVC (libx265)' },
    { value: 'libvpx-vp9', label: 'VP9 (libvpx-vp9)' },
    { value: 'libaom-av1', label: 'AV1 (libaom-av1)' },
    { value: 'mpeg4', label: 'MPEG-4' },
    { value: 'copy', label: 'Copy (No Re-encode)' },
];

const frameRateOptions: { value: VideoConfig['frameRate']; label: string }[] = [
    { value: 'original', label: 'Original' },
    { value: '120', label: '120 fps (High Frame Rate)' },
    { value: '90', label: '90 fps' },
    { value: '60', label: '60 fps' },
    { value: '50', label: '50 fps' },
    { value: '30', label: '30 fps' },
    { value: '29.97', label: '29.97 fps (NTSC)' },
    { value: '25', label: '25 fps (PAL)' },
    { value: '24', label: '24 fps (Cinema)' },
    { value: '23.976', label: '23.976 fps' },
    { value: '15', label: '15 fps' },
];

const videoBitrateOptions: { value: VideoConfig['videoBitrate']; label: string }[] = [
    { value: 'original', label: 'Original' },
    { value: '20M', label: '20 Mbps (4K High)' },
    { value: '15M', label: '15 Mbps (High)' },
    { value: '12M', label: '12 Mbps (QHD)' },
    { value: '10M', label: '10 Mbps (1080p High)' },
    { value: '8M', label: '8 Mbps (1080p Standard)' },
    { value: '6M', label: '6 Mbps (720p High)' },
    { value: '4M', label: '4 Mbps (720p Standard)' },
    { value: '3M', label: '3 Mbps (SD High)' },
    { value: '2M', label: '2 Mbps (SD Standard)' },
    { value: '1M', label: '1 Mbps (Low)' },
    { value: '800k', label: '800 kbps (Web Low)' },
    { value: '500k', label: '500 kbps (Minimum)' },
];

const aspectRatioOptions: { value: VideoConfig['aspectRatio']; label: string }[] = [
    { value: 'original', label: 'Original' },
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '9:16', label: '9:16 (Vertical)' },
    { value: '4:3', label: '4:3 (Standard)' },
    { value: '3:2', label: '3:2 (Photography)' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '21:9', label: '21:9 (Ultrawide)' },
];

export default function VideoSettings({ config, onChange }: Props) {
<<<<<<< HEAD
    const isVideoFormat = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v'].includes(config.format);
    const isGifFormat = config.format === 'gif';
    const isAudioFormat = ['mp3', 'aac', 'wav', 'ogg'].includes(config.format);
    const [openSections, setOpenSections] = useState({
        video: false,
        audioForVideo: false,
        gif: false,
        audioOnly: false,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">動画ファイル設定</h3>

                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <label className="block text-xs text-gray-400 mb-2">出力フォーマット</label>
                <select 
                    value={config.format}
                    onChange={(e) => onChange({ ...config, format: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                >
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
                    <optgroup label="画像">
                        <option value="gif">GIF（アニメーション）</option>
                    </optgroup>
                    <optgroup label="音声">
                        <option value="mp3">MP3（音声のみ）</option>
                        <option value="aac">AAC（音声のみ）</option>
                        <option value="wav">WAV（音声のみ）</option>
                        <option value="ogg">OGG（音声のみ）</option>
=======
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
>>>>>>> 8a92cacec6b709993ac994f025af737c1c0a3fcf
                    </optgroup>
                </select>
            </div>

<<<<<<< HEAD
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
                                <label className="block text-xs text-gray-400 mb-1">ビデオコーデック</label>
                                <select 
                                    value={config.videoCodec}
                                    onChange={(e) => onChange({ ...config, videoCodec: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    {videoCodecOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">解像度</label>
                                <select 
                                    value={config.resolution}
                                    onChange={(e) => onChange({ ...config, resolution: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    {resolutionOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">トリム開始（秒）</label>
                                <input 
                                    type="text"
                                    value={config.trimStart}
                                    onChange={(e) => onChange({ ...config, trimStart: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">トリム終了（秒）</label>
                                <input 
                                    type="text"
                                    value={config.trimEnd}
                                    onChange={(e) => onChange({ ...config, trimEnd: e.target.value })}
                                    placeholder="Leave empty for full length"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">フレームレート</label>
                                <select 
                                    value={config.frameRate}
                                    onChange={(e) => onChange({ ...config, frameRate: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    {frameRateOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">ビデオビットレート</label>
                                <select 
                                    value={config.videoBitrate}
                                    onChange={(e) => onChange({ ...config, videoBitrate: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    {videoBitrateOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">アスペクト比</label>
                                <select 
                                    value={config.aspectRatio}
                                    onChange={(e) => onChange({ ...config, aspectRatio: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    {aspectRatioOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">回転</label>
                                <select 
                                    value={config.rotate}
                                    onChange={(e) => onChange({ ...config, rotate: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    <option value="0">0°（回転なし）</option>
                                    <option value="90">90°（時計回り）</option>
                                    <option value="180">180°（上下反転）</option>
                                    <option value="270">270°（反時計回り）</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">明るさ</label>
                                <input 
                                    type="text"
                                    value={config.brightness}
                                    onChange={(e) => onChange({ ...config, brightness: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">-1.0 (暗い) to 1.0 (明るい), 0 = Original</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">コントラスト</label>
                                <input 
                                    type="text"
                                    value={config.contrast}
                                    onChange={(e) => onChange({ ...config, contrast: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">-1.0 (低い) to 1.0 (高い), 0 = Original</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">彩度</label>
                                <input 
                                    type="text"
                                    value={config.saturation}
                                    onChange={(e) => onChange({ ...config, saturation: e.target.value })}
                                    placeholder="1"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">0 (モノクロ) to 3 (鮮やか), 1 = Original</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">ピクセルフォーマット</label>
                                <select 
                                    value={config.pixelFormat}
                                    onChange={(e) => onChange({ ...config, pixelFormat: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    <option value="original">Original</option>
                                    <option value="yuv420p">YUV420p (Standard)</option>
                                    <option value="yuv422p">YUV422p (High Quality)</option>
                                    <option value="yuv444p">YUV444p (Highest Quality)</option>
                                </select>
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={config.deinterlace}
                                        onChange={(e) => onChange({ ...config, deinterlace: e.target.checked })}
                                        className="rounded bg-gray-700 border-gray-500 text-primary-500"
                                    />
                                    <span className="text-sm text-gray-300">デインターレース (Deinterlace)</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isGifFormat && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <button
                        type="button"
                        onClick={() => toggleSection('gif')}
                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-300"
                        aria-expanded={openSections.gif}
                    >
                        <span>GIF オプション</span>
                        <span className="text-xs text-primary-400">{openSections.gif ? '閉じる' : '表示'}</span>
                    </button>
                    {openSections.gif && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">トリム開始（秒）</label>
                                <input 
                                    type="text"
                                    value={config.trimStart}
                                    onChange={(e) => onChange({ ...config, trimStart: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">トリム終了（秒）</label>
                                <input 
                                    type="text"
                                    value={config.trimEnd}
                                    onChange={(e) => onChange({ ...config, trimEnd: e.target.value })}
                                    placeholder="空白で最後まで"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">幅（ピクセル）</label>
                                <input 
                                    type="text"
                                    value={config.gifWidth}
                                    onChange={(e) => onChange({ ...config, gifWidth: e.target.value })}
                                    placeholder="空白で元サイズ"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">ループ回数（0 = 無限）</label>
                                <input 
                                    type="text"
                                    value={config.gifLoop}
                                    onChange={(e) => onChange({ ...config, gifLoop: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">0〜10000 (0=無限ループ)</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">フレームレート（FPS）</label>
                                <input 
                                    type="text"
                                    value={config.gifFps}
                                    onChange={(e) => onChange({ ...config, gifFps: e.target.value })}
                                    placeholder="10"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                                    <p className="text-xs text-gray-500 mt-1">推奨: 10–15</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">圧縮率</label>
                                <select 
                                    value={config.gifCompression}
                                    onChange={(e) => onChange({ ...config, gifCompression: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    <option value="0">最高品質 (大きいサイズ)</option>
                                    <option value="1">高品質</option>
                                    <option value="2">標準圧縮</option>
                                    <option value="3">最高圧縮 (小さいサイズ)</option>
                                </select>
                            </div>
                            <div className="flex items-center md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={config.gifTransparent}
                                        onChange={(e) => onChange({ ...config, gifTransparent: e.target.checked })}
                                        className="rounded bg-gray-700 border-gray-500 text-primary-500"
                                    />
                                    <span className="text-sm text-gray-300">透明背景を有効にする</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isVideoFormat && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <button
                        type="button"
                        onClick={() => toggleSection('audioForVideo')}
                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-300"
                        aria-expanded={openSections.audioForVideo}
                    >
                        <span>音声オプション</span>
                        <span className="text-xs text-primary-400">{openSections.audioForVideo ? '閉じる' : '表示'}</span>
                    </button>
                    {openSections.audioForVideo && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">オーディオコーデック</label>
                                <select 
                                    value={config.audioCodec}
                                    onChange={(e) => onChange({ ...config, audioCodec: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                    disabled={config.mute}
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
                                <label className="block text-xs text-gray-400 mb-1">オーディオビットレート</label>
                                <select 
                                    value={config.audioBitrate}
                                    onChange={(e) => onChange({ ...config, audioBitrate: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                    disabled={config.mute}
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
                                <label className="block text-xs text-gray-400 mb-1">サンプルレート（Hz）</label>
                                <select 
                                    value={config.audioSampleRate}
                                    onChange={(e) => onChange({ ...config, audioSampleRate: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                    disabled={config.mute}
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
                                    value={config.audioChannels}
                                    onChange={(e) => onChange({ ...config, audioChannels: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                    disabled={config.mute}
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
                                        value={config.audioVolume}
                                        onChange={(e) => onChange({ ...config, audioVolume: e.target.value })}
                                        className="w-full accent-primary-500"
                                        disabled={config.mute}
                                    />
                                    <span className="text-xs text-gray-300 w-12 text-right">
                                        {(() => {
                                            const num = parseFloat(config.audioVolume);
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
                                    value={config.audioFadeIn}
                                    onChange={(e) => onChange({ ...config, audioFadeIn: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                    disabled={config.mute}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">フェードアウト (seconds)</label>
                                <input 
                                    type="text"
                                    value={config.audioFadeOut}
                                    onChange={(e) => onChange({ ...config, audioFadeOut: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                    disabled={config.mute}
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={config.audioNormalize}
                                        onChange={(e) => onChange({ ...config, audioNormalize: e.target.checked })}
                                        className="rounded bg-gray-700 border-gray-500 text-primary-500"
                                        disabled={config.mute}
                                    />
                                    <span className="text-sm text-gray-300">音量正規化</span>
                                </label>
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={config.mute}
                                        onChange={(e) => onChange({ ...config, mute: e.target.checked })}
                                        className="rounded bg-gray-700 border-gray-500 text-primary-500"
                                    />
                                    <span className="text-sm text-gray-300">音声をミュート（音声トラックを削除）</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isAudioFormat && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <button
                        type="button"
                        onClick={() => toggleSection('audioOnly')}
                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-300"
                        aria-expanded={openSections.audioOnly}
                    >
                        <span>音声オプション</span>
                        <span className="text-xs text-primary-400">{openSections.audioOnly ? '閉じる' : '表示'}</span>
                    </button>
                    {openSections.audioOnly && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Audio Codec</label>
                                <select 
                                    value={config.audioCodec}
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
                                <label className="block text-xs text-gray-400 mb-1">Audio Bitrate</label>
                                <select 
                                    value={config.audioBitrate}
                                    onChange={(e) => onChange({ ...config, audioBitrate: e.target.value as any })}
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
                                    value={config.audioSampleRate}
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
                                    value={config.audioChannels}
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
                                        value={config.audioVolume}
                                        onChange={(e) => onChange({ ...config, audioVolume: e.target.value })}
                                        className="w-full accent-primary-500"
                                    />
                                    <span className="text-xs text-gray-300 w-12 text-right">
                                        {(() => {
                                            const num = parseFloat(config.audioVolume);
                                            return Number.isFinite(num) ? `${Math.round(num * 100)}%` : '--';
                                        })()}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">1.0 = 100%, 2.0 = 200%, 0.5 = 50%</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">フェードイン (seconds)</label>
                                <input 
                                    type="text"
                                    value={config.audioFadeIn}
                                    onChange={(e) => onChange({ ...config, audioFadeIn: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">フェードアウト (seconds)</label>
                                <input 
                                    type="text"
                                    value={config.audioFadeOut}
                                    onChange={(e) => onChange({ ...config, audioFadeOut: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">トリムスタート (seconds)</label>
                                <input 
                                    type="text"
                                    value={config.trimStart}
                                    onChange={(e) => onChange({ ...config, trimStart: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">トリムエンド (seconds)</label>
                                <input 
                                    type="text"
                                    value={config.trimEnd}
                                    onChange={(e) => onChange({ ...config, trimEnd: e.target.value })}
                                    placeholder="空白で最後まで"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div className="flex items-center md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={config.audioNormalize}
                                        onChange={(e) => onChange({ ...config, audioNormalize: e.target.checked })}
                                        className="rounded bg-gray-700 border-gray-500 text-primary-500"
                                    />
                                    <span className="text-sm text-gray-300">音量正規化 (Normalize)</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}
            </div>
=======
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
>>>>>>> 8a92cacec6b709993ac994f025af737c1c0a3fcf
        </div>
    );
}
