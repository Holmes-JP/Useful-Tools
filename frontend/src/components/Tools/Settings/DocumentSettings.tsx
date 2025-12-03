import React, { useEffect } from 'react';

export type DocConfig = {
    format: 'pdf' | 'jpg' | 'png' | 'txt';
    mode: 'default' | 'merge' | 'split' | 'rotate' | 'remove_pages';
    rotateAngle: 90 | 180 | 270;
    removePageRanges: string;
    imageFormat: 'jpg' | 'png';
    metadataTitle: string;
    metadataAuthor: string;
    metadataDate: string;
};

type Props = {
    config: DocConfig;
    onChange: (newConfig: DocConfig) => void;
    inputType: string; 
};

export default function DocumentSettings({ config, onChange, inputType }: Props) {
    const isPdf = inputType === 'application/pdf';
    const update = (key: keyof DocConfig, value: any) => onChange({ ...config, [key]: value });

    useEffect(() => {
        if (!isPdf && config.format === 'txt') update('format', 'pdf');
    }, [inputType]);

    return (
        <div className="bg-gray-800 text-gray-200 p-6 rounded-xl border border-gray-700 shadow-inner space-y-6 animate-fade-in-up">
            <h3 className="text-sm font-bold text-primary-400 border-b border-gray-700 pb-2 mb-4">Document Settings</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Output Format</label>
                    <select value={config.format} onChange={(e) => update('format', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm font-bold">
                        <option value="pdf">PDF (Document)</option>
                        <option value="jpg">JPG (Image)</option>
                        <option value="png">PNG (Image)</option>
                        {isPdf && <option value="txt">TXT (Extract Text)</option>}
                    </select>
                </div>
                {config.format === 'pdf' && isPdf && (
                    <div className="animate-fade-in-down">
                        <label className="block text-xs text-gray-500 mb-1">Operation Mode</label>
                        <select value={config.mode} onChange={(e) => update('mode', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                            <option value="default">Default (No Change)</option>
                            <option value="merge">Merge All (結合)</option>
                            <option value="split">Split Pages (全ページ分割)</option>
                            <option value="rotate">Rotate Pages (回転)</option>
                            <option value="remove_pages">Remove Pages (ページ削除)</option>
                        </select>
                    </div>
                )}
                {config.mode === 'rotate' && config.format === 'pdf' && (
                    <div className="animate-fade-in-down">
                        <label className="block text-xs text-gray-500 mb-1">Rotation Angle</label>
                        <select value={config.rotateAngle} onChange={(e) => update('rotateAngle', Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm">
                            <option value={90}>90° CW (右回転)</option>
                            <option value={180}>180° (上下反転)</option>
                            <option value={270}>270° CW (左回転)</option>
                        </select>
                    </div>
                )}
                {config.mode === 'remove_pages' && config.format === 'pdf' && (
                    <div className="animate-fade-in-down">
                        <label className="block text-xs text-gray-500 mb-1">Pages to Remove</label>
                        <input type="text" value={config.removePageRanges} onChange={(e) => update('removePageRanges', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" placeholder="e.g. 1, 3-5" />
                        <p className="text-[10px] text-gray-400 mt-1">Example: "1, 3-5" removes page 1, 3, 4, and 5.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
