import { useEffect } from 'react';

export type DocConfig = {
    format: 'pdf';
    mode: 'default' | 'merge' | 'split' | 'rotate' | 'extract' | 'compress';
    rotateAngle: number;
    imageFormat: string;
    removePageRanges: string;
    metadataTitle: string;
    metadataAuthor: string;
    metadataDate: string;
};

type Props = {
    config: DocConfig;
    onChange: (config: DocConfig) => void;
    inputType?: string;
};

export default function DocumentSettings({ config, onChange, inputType }: Props) {
    useEffect(() => {
        if (inputType?.includes('text')) {
            onChange({ ...config, mode: 'default' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputType]);

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-bold text-white">Document File Settings</h3>
            <div className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div>
                <label className="block text-xs text-gray-400 mb-1">Mode</label>
                <select
                    value={config.mode}
                    onChange={(e) => onChange({ ...config, mode: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                >
                    <option value="default">Default</option>
                    <option value="merge">Merge PDFs</option>
                    <option value="split">Split PDF</option>
                    <option value="rotate">Rotate Pages</option>
                    <option value="extract">Extract Pages</option>
                    <option value="compress">Compress</option>
                </select>
            </div>

            {config.mode === 'rotate' && (
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Rotation Angle</label>
                    <select
                        value={config.rotateAngle}
                        onChange={(e) => onChange({ ...config, rotateAngle: Number(e.target.value) })}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                    >
                        <option value="90">90°</option>
                        <option value="180">180°</option>
                        <option value="270">270°</option>
                    </select>
                </div>
            )}

            {config.mode === 'extract' && (
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Page Ranges (e.g., 1-3,5,7-9)</label>
                    <input
                        type="text"
                        value={config.removePageRanges}
                        onChange={(e) => onChange({ ...config, removePageRanges: e.target.value })}
                        placeholder="1-3,5,7-9"
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Title (Metadata)</label>
                    <input
                        type="text"
                        value={config.metadataTitle}
                        onChange={(e) => onChange({ ...config, metadataTitle: e.target.value })}
                        placeholder="Document title"
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Author (Metadata)</label>
                    <input
                        type="text"
                        value={config.metadataAuthor}
                        onChange={(e) => onChange({ ...config, metadataAuthor: e.target.value })}
                        placeholder="Author name"
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Date (Metadata)</label>
                    <input
                        type="date"
                        value={config.metadataDate}
                        onChange={(e) => onChange({ ...config, metadataDate: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                    />
                </div>
            </div>
            </div>
        </div>
    );
}
