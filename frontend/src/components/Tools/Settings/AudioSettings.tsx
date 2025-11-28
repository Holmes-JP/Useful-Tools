import { AudioOptions } from '@/hooks/useAudioConverter';

type Props = {
    config: AudioOptions;
    onChange: (newConfig: AudioOptions) => void;
};

export default function AudioSettings({ config, onChange }: Props) {
    const update = (key: keyof AudioOptions, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="bg-gray-800 text-gray-200 p-6 rounded-xl border border-gray-700 shadow-inner">
            <h3 className="text-sm font-bold text-gray-400 mb-4 border-b border-gray-700 pb-2">
                Audio Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Format</label>
                    <select
                        value={config.format}
                        onChange={(e) => update('format', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                        <option value="mp3">MP3 (Universal)</option>
                        <option value="wav">WAV (High Quality/Lossless)</option>
                        <option value="m4a">M4A (Apple/AAC)</option>
                        <option value="aac">AAC (Standard)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Bitrate</label>
                    <select
                        value={config.bitrate}
                        onChange={(e) => update('bitrate', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                        <option value="128k">128 kbps (Standard)</option>
                        <option value="192k">192 kbps (High)</option>
                        <option value="256k">256 kbps (Very High)</option>
                        <option value="320k">320 kbps (Max)</option>
                    </select>
                </div>
            </div>
        </div>
    );
}