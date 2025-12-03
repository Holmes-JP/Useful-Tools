

export type VideoConfig = {
    format: 'mp4' | 'webm' | 'gif';
    resolution: 'original' | '1080p' | '720p' | '480p';
    mute: boolean;
};

type Props = {
    config: VideoConfig;
    onChange: (config: VideoConfig) => void;
};

export default function VideoSettings({ config, onChange }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div>
                <label className="block text-xs text-gray-400 mb-1">Format</label>
                <select 
                    value={config.format}
                    onChange={(e) => onChange({ ...config, format: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                >
                    <option value="mp4">MP4 (H.264)</option>
                    <option value="webm">WebM (VP9)</option>
                    <option value="gif">GIF (Animated)</option>
                </select>
            </div>
            <div>
                <label className="block text-xs text-gray-400 mb-1">Resolution</label>
                <select 
                    value={config.resolution}
                    onChange={(e) => onChange({ ...config, resolution: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                >
                    <option value="original">Original</option>
                    <option value="1080p">1080p (FHD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="480p">480p (SD)</option>
                </select>
            </div>
            <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full">
                    <input 
                        type="checkbox" 
                        checked={config.mute}
                        onChange={(e) => onChange({ ...config, mute: e.target.checked })}
                        className="rounded bg-gray-700 border-gray-500 text-primary-500"
                    />
                    <span className="text-sm text-gray-300">Mute Audio</span>
                </label>
            </div>
        </div>
    );
}
