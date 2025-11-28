// 設定値の型定義 (親コンポーネントと共有するためexport)
export type VideoConfig = {
    format: 'mp4' | 'webm' | 'gif';
    resolution: 'original' | '1080p' | '720p' | '480p';
    mute: boolean;
};

type Props = {
    config: VideoConfig;
    onChange: (newConfig: VideoConfig) => void;
};

export default function VideoSettings({ config, onChange }: Props) {
    
    // 設定変更ハンドラ
    const update = (key: keyof VideoConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="bg-gray-800 text-gray-200 p-6 rounded-xl border border-gray-700 shadow-inner">
            <h3 className="text-sm font-bold text-gray-400 mb-4 border-b border-gray-700 pb-2">
                Conversion Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. 出力フォーマット */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Output Format</label>
                    <select
                        value={config.format}
                        onChange={(e) => update('format', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                        <option value="mp4">MP4 (H.264/AAC)</option>
                        <option value="webm">WebM (VP9/Opus)</option>
                        <option value="gif">GIF Animation</option>
                    </select>
                </div>

                {/* 2. 解像度 */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Resolution</label>
                    <select
                        value={config.resolution}
                        onChange={(e) => update('resolution', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                        <option value="original">Original (Same as source)</option>
                        <option value="1080p">1080p (Full HD)</option>
                        <option value="720p">720p (HD)</option>
                        <option value="480p">480p (SD)</option>
                    </select>
                </div>
                
                {/* 3. 音声設定など */}
                <div className="md:col-span-2 flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={config.mute}
                            onChange={(e) => update('mute', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-gray-900 border-gray-600"
                        />
                        <span className="text-sm">Mute Audio (Remove sound)</span>
                    </label>
                </div>
            </div>
        </div>
    );
}