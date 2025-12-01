import React from 'react';

export type DocConfig = {
    mode: 'merge' | 'split' | 'rotate' | 'compress' | 'pdf_to_img';
    rotateAngle: 90 | 180 | 270;
    imageFormat: 'jpg' | 'png';
    metadataTitle: string;
    metadataAuthor: string;
    metadataDate: string;
};

type Props = {
    config: DocConfig;
    onChange: (newConfig: DocConfig) => void;
};

export default function DocumentSettings({ config, onChange }: Props) {
    const update = (key: keyof DocConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="bg-gray-800 text-gray-200 p-6 rounded-xl border border-gray-700 shadow-inner space-y-6">
            <h3 className="text-sm font-bold text-primary-400 border-b border-gray-700 pb-2 mb-4">
                Document (PDF) Settings
            </h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Operation Mode</label>
                    <select value={config.mode} onChange={(e) => update('mode', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm font-bold text-primary-200">
                        <option value="merge">Merge PDFs (結合)</option>
                        <option value="split">Split Pages (分割)</option>
                        <option value="rotate">Rotate (回転)</option>
                        <option value="compress">Compress (圧縮)</option>
                        {/* <option value="pdf_to_img">PDF to Image</option> ※将来実装 */}
                    </select>
                </div>

                {config.mode === 'rotate' && (
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Rotation Angle</label>
                        <select value={config.rotateAngle} onChange={(e) => update('rotateAngle', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                            <option value={90}>90° CW (右回転)</option>
                            <option value={180}>180° (上下反転)</option>
                            <option value={270}>270° CW (左回転)</option>
                        </select>
                    </div>
                )}
                
                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-700 pt-4">
                    <div className="md:col-span-3 text-xs text-gray-500">Update Metadata (Optional)</div>
                    <div>
                        <input type="text" placeholder="Title" value={config.metadataTitle} onChange={(e) => update('metadataTitle', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                    </div>
                    <div>
                        <input type="text" placeholder="Author" value={config.metadataAuthor} onChange={(e) => update('metadataAuthor', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                    </div>
                    <div>
                        <input type="date" value={config.metadataDate} onChange={(e) => update('metadataDate', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" />
                    </div>
                </div>
            </div>
        </div>
    );
}
