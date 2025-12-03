

export type ImageConfig = {
    format: 'original' | 'jpeg' | 'png' | 'webp' | 'gif' | 'mp4' | 'mov' | 'avi' | 'mkv' | 'webm' | 'flv' | 'wmv' | 'm4v';
    quality: number;
    maxWidth: number;
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
    // GIF Options
    gifWidth?: string;
    gifLoop?: string;
    gifFps?: string;
    gifCompression?: '0' | '1' | '2' | '3';
    gifTransparent?: boolean;
};

type Props = {
    config: ImageConfig;
    onChange: (config: ImageConfig) => void;
};

export default function ImageSettings({ config, onChange }: Props) {
    // フォーマット判定
    const isImageFormat = ['original', 'jpeg', 'png', 'webp'].includes(config.format);
    
    return (
        <div className="space-y-4">
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
                        <option value="gif">GIF (Animated)</option>
                    </optgroup>
                    <optgroup label="Video">
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

            {/* Image Options - 画像フォーマットの場合 */}
            {isImageFormat && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300">Image Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    </div>
                </div>
            )}
        </div>
    );
}
