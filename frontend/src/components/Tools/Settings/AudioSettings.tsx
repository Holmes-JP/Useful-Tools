

export type AudioConfig = {
    format: 'mp3' | 'wav' | 'm4a' | 'aac' | 'ogg' | 'flac';
    bitrate: string;
};

type Props = {
    config: AudioConfig;
    onChange: (config: AudioConfig) => void;
};

export default function AudioSettings({ config, onChange }: Props) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-bold text-white">Audio File Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div>
                <label className="block text-xs text-gray-400 mb-1">Output Format</label>
                <select 
                    value={config.format}
                    onChange={(e) => onChange({ ...config, format: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                >
                    <option value="mp3">MP3</option>
                    <option value="wav">WAV</option>
                    <option value="m4a">M4A (AAC)</option>
                    <option value="ogg">OGG</option>
                    <option value="flac">FLAC</option>
                </select>
            </div>
            <div>
                <label className="block text-xs text-gray-400 mb-1">Bitrate</label>
                <select 
                    value={config.bitrate}
                    onChange={(e) => onChange({ ...config, bitrate: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                >
                    <option value="128k">128 kbps</option>
                    <option value="192k">192 kbps</option>
                    <option value="256k">256 kbps</option>
                    <option value="320k">320 kbps</option>
                </select>
            </div>
            </div>
        </div>
    );
}
