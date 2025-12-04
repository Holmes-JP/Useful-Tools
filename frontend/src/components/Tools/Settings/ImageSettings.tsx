
import { useState } from 'react';

export type ImageConfig = {
    format: 'original' | 'jpeg' | 'png' | 'webp' | 'gif';
    quality: number;
    maxWidth: number;
    maxHeight?: number;
    fitMode?: 'contain' | 'cover' | 'fill' | 'stretch' | 'inside';
    resizeAlgorithm?: 'lanczos' | 'bicubic' | 'bilinear' | 'nearest';
    preserveExif?: boolean;
    progressive?: boolean;
    grayscale?: boolean;
    removeMetadata?: boolean;
    backgroundColor?: string;
    chromaSubsampling?: '4:4:4' | '4:2:2' | '4:2:0';
    // GIF Options
    gifWidth?: string;
    gifLoop?: string;
    gifFps?: string;
    gifCompression?: '0' | '1' | '2' | '3';
    gifTransparent?: boolean;
    // Video Options (when converting to video)
    resolution?: 'original' | '1080p' | '720p' | '480p';
    videoCodec?: 'libx264' | 'libx265' | 'libvpx-vp9' | 'copy';
    trimStart?: string;
    trimEnd?: string;
    frameRate?: 'original' | '60' | '30' | '24' | '15';
    videoBitrate?: 'original' | '8M' | '4M' | '2M' | '1M';
    aspectRatio?: 'original' | '16:9' | '4:3' | '1:1' | '21:9';
    rotate?: '0' | '90' | '180' | '270';
    brightness?: string;
    contrast?: string;
    saturation?: string;
    deinterlace?: boolean;
    pixelFormat?: 'original' | 'yuv420p' | 'yuv422p' | 'yuv444p';
    // Audio Options (when converting to video)
    audioCodec?: 'aac' | 'mp3' | 'libopus' | 'libvorbis' | 'flac' | 'pcm_s16le' | 'pcm_s24le' | 'alac' | 'ac3' | 'eac3' | 'dts' | 'wmav2' | 'copy';
    audioBitrate?: '320k' | '192k' | '128k' | '96k' | '64k' | '48k' | '32k';
    audioVolume?: string;
    audioSampleRate?: 'original' | '48000' | '44100' | '32000' | '22050' | '16000' | '8000';
    audioChannels?: 'original' | 'stereo' | 'mono' | '5.1' | '7.1';
    audioNormalize?: boolean;
    audioFadeIn?: string;
    audioFadeOut?: string;
};

type Props = {
    config: ImageConfig;
    onChange: (config: ImageConfig) => void;
};

export default function ImageSettings({ config, onChange }: Props) {
    // フォーマット判定
    const isImageFormat = ['original', 'jpeg', 'png', 'webp'].includes(config.format);
    const isGifFormat = config.format === 'gif';
    const [openSections, setOpenSections] = useState({ image: false, gif: false });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="space-y-4 bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-bold text-white">Image File Settings</h3>
            
            {/* Output Format */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <label className="block text-xs text-gray-400 mb-2">Output Format</label>
                <select 
                    value={config.format}
                    onChange={(e) => onChange({ ...config, format: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                >
                    <optgroup label="Image">
                        <option value="original">Keep Original</option>
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                    </optgroup>
                    {/* Video output formats removed for Image settings */}
                </select>
            </div>

            {/* Image Options - 画像フォーマットの場合（折りたたみ可能） */}
            {isImageFormat && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <button
                        type="button"
                        onClick={() => toggleSection('image')}
                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-300"
                        aria-expanded={openSections.image}
                    >
                        <span>Image Options</span>
                        <span className="text-xs text-primary-400">{openSections.image ? 'Hide' : 'Show'}</span>
                    </button>
                    {openSections.image && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Quality ({Math.round(config.quality * 100)}%)</label>
                                <input 
                                    type="range" min="0.1" max="1.0" step="0.1"
                                    value={config.quality}
                                    onChange={(e) => onChange({ ...config, quality: Number(e.target.value) })}
                                    className="w-full accent-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Max Width (px)</label>
                                <input 
                                    type="number"
                                    value={config.maxWidth || ''}
                                    placeholder="Original"
                                    onChange={(e) => onChange({ ...config, maxWidth: Number(e.target.value) })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Max Height (px)</label>
                                <input
                                    type="number"
                                    value={config.maxHeight || ''}
                                    placeholder="Original"
                                    onChange={(e) => onChange({ ...config, maxHeight: Number(e.target.value) })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Fit Mode</label>
                                <select
                                    value={config.fitMode || 'contain'}
                                    onChange={(e) => onChange({ ...config, fitMode: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    <option value="contain">Contain (preserve aspect)</option>
                                    <option value="cover">Cover (crop to fill)</option>
                                    <option value="fill">Fill (stretch to fit)</option>
                                    <option value="stretch">Stretch (distort to fit)</option>
                                    <option value="inside">Inside (fit within)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Resize Algorithm</label>
                                <select
                                    value={config.resizeAlgorithm || 'lanczos'}
                                    onChange={(e) => onChange({ ...config, resizeAlgorithm: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    <option value="lanczos">Lanczos (best quality)</option>
                                    <option value="bicubic">Bicubic</option>
                                    <option value="bilinear">Bilinear</option>
                                    <option value="nearest">Nearest (fastest)</option>
                                </select>
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!config.preserveExif}
                                        onChange={(e) => onChange({ ...config, preserveExif: e.target.checked })}
                                        className="rounded bg-gray-700 border-gray-500 text-primary-500"
                                    />
                                    <span className="text-sm text-gray-300">Preserve EXIF metadata</span>
                                </label>
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!config.removeMetadata}
                                        onChange={(e) => onChange({ ...config, removeMetadata: e.target.checked })}
                                        className="rounded bg-gray-700 border-gray-500 text-primary-500"
                                    />
                                    <span className="text-sm text-gray-300">Remove all metadata</span>
                                </label>
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!config.grayscale}
                                        onChange={(e) => onChange({ ...config, grayscale: e.target.checked })}
                                        className="rounded bg-gray-700 border-gray-500 text-primary-500"
                                    />
                                    <span className="text-sm text-gray-300">Convert to grayscale</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Background Color</label>
                                <input
                                    type="color"
                                    value={config.backgroundColor || '#000000'}
                                    onChange={(e) => onChange({ ...config, backgroundColor: e.target.value })}
                                    className="w-16 h-8 p-0 bg-gray-900 border border-gray-600 rounded"
                                />
                                <p className="text-xs text-gray-500 mt-1">Used when adding background for formats without alpha.</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Chroma Subsampling</label>
                                <select
                                    value={config.chromaSubsampling || '4:2:0'}
                                    onChange={(e) => onChange({ ...config, chromaSubsampling: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    <option value="4:4:4">4:4:4 (No subsampling)</option>
                                    <option value="4:2:2">4:2:2</option>
                                    <option value="4:2:0">4:2:0 (Standard)</option>
                                </select>
                            </div>
                            <div className="flex items-center md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!config.progressive}
                                        onChange={(e) => onChange({ ...config, progressive: e.target.checked })}
                                        className="rounded bg-gray-700 border-gray-500 text-primary-500"
                                    />
                                    <span className="text-sm text-gray-300">Enable progressive encoding (JPEG)</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* GIF Options - gif 出力を選択したときに表示 */}
            {isGifFormat && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <button
                        type="button"
                        onClick={() => toggleSection('gif')}
                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-300"
                        aria-expanded={openSections.gif}
                    >
                        <span>Image Options (GIF)</span>
                        <span className="text-xs text-primary-400">{openSections.gif ? 'Hide' : 'Show'}</span>
                    </button>
                    {openSections.gif && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Trim Start (seconds)</label>
                                <input
                                    type="text"
                                    value={config.trimStart || ''}
                                    onChange={(e) => onChange({ ...config, trimStart: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Trim End (seconds)</label>
                                <input
                                    type="text"
                                    value={config.trimEnd || ''}
                                    onChange={(e) => onChange({ ...config, trimEnd: e.target.value })}
                                    placeholder="Leave empty for full length"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Width (pixels)</label>
                                <input
                                    type="text"
                                    value={config.gifWidth || ''}
                                    onChange={(e) => onChange({ ...config, gifWidth: e.target.value })}
                                    placeholder="Original"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Loop Count (0 = infinite)</label>
                                <input
                                    type="text"
                                    value={config.gifLoop || '0'}
                                    onChange={(e) => onChange({ ...config, gifLoop: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">0–10000 (0 = infinite)</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">FPS (frame rate)</label>
                                <input
                                    type="text"
                                    value={config.gifFps || ''}
                                    onChange={(e) => onChange({ ...config, gifFps: e.target.value })}
                                    placeholder="10"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">Recommended: 10–15</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Compression</label>
                                <select
                                    value={config.gifCompression || '2'}
                                    onChange={(e) => onChange({ ...config, gifCompression: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    <option value="0">Best quality (largest)</option>
                                    <option value="1">High quality</option>
                                    <option value="2">Standard</option>
                                    <option value="3">Highest compression (smallest)</option>
                                </select>
                            </div>
                            <div className="flex items-center md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!config.gifTransparent}
                                        onChange={(e) => onChange({ ...config, gifTransparent: e.target.checked })}
                                        className="rounded bg-gray-700 border-gray-500 text-primary-500"
                                    />
                                    <span className="text-sm text-gray-300">Enable transparent background</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
