import { useEffect, useState } from 'react';

export type DocConfig = {
    format: 'pdf';
    // Desired output format when converting documents
    outputFormat?: 'txt' | 'pdf' | 'docx' | 'html' | 'odt' | 'md';
    mode: 'default' | 'merge' | 'split' | 'rotate' | 'extract' | 'compress';
    rotateAngle: number;
    imageFormat: string;
    removePageRanges: string;
    // additional options
    removeMetadata?: boolean;
    optimizeForWeb?: boolean;
    flattenAnnotations?: boolean;
    compressionLevel?: 'low' | 'medium' | 'high';
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

    const [open, setOpen] = useState(false);
    const toggle = () => setOpen((v) => !v);

    return (
        <div className="space-y-3 bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-bold text-white">Document File Settings</h3>

            <div className="space-y-4">
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <label className="block text-xs text-gray-400 mb-2">Output Format</label>
                    <select
                        value={config.outputFormat || 'pdf'}
                        onChange={(e) => onChange({ ...config, outputFormat: e.target.value as any })}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                    >
                        <option value="txt">Plain Text (.txt)</option>
                        <option value="pdf">PDF (.pdf)</option>
                        <option value="docx">DOCX (.docx)</option>
                        <option value="html">HTML (.html)</option>
                        <option value="odt">ODT (.odt)</option>
                        <option value="md">Markdown (.md)</option>
                    </select>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <button
                        type="button"
                        onClick={toggle}
                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-300"
                        aria-expanded={open}
                    >
                        <span>ドキュメント設定</span>
                        <span className="text-xs text-primary-400">{open ? '非表示' : '表示'}</span>
                    </button>

                    {open && (
                        <div className="mt-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">モード</label>
                                <select
                                    value={config.mode}
                                    onChange={(e) => onChange({ ...config, mode: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                >
                                    <option value="default">デフォルト</option>
                                    <option value="merge">PDF を結合</option>
                                    <option value="split">PDF を分割</option>
                                    <option value="rotate">ページを回転</option>
                                    <option value="extract">ページを抽出</option>
                                    <option value="compress">圧縮</option>
                                </select>
                            </div>

                            {config.mode === 'rotate' && (
                                <div className="mt-3">
                                    <label className="block text-xs text-gray-400 mb-1">Rotation Angle</label>
                                    <select
                                        value={config.rotateAngle}
                                        onChange={(e) => onChange({ ...config, rotateAngle: Number(e.target.value) })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                                    >
                                        <option value={90}>90°</option>
                                        <option value={180}>180°</option>
                                        <option value={270}>270°</option>
                                    </select>
                                </div>
                            )}

                            {config.mode === 'extract' && (
                                <div className="mt-3">
                                    <label className="block text-xs text-gray-400 mb-1">ページ範囲（例: 1-3,5,7-9）</label>
                                    <input
                                        type="text"
                                        value={config.removePageRanges}
                                        onChange={(e) => onChange({ ...config, removePageRanges: e.target.value })}
                                        placeholder="1-3,5,7-9"
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                                    />
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={!!config.removeMetadata} onChange={(e) => onChange({ ...config, removeMetadata: e.target.checked })} />
                                    <span className="text-xs text-gray-400">メタデータを削除</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={!!config.optimizeForWeb} onChange={(e) => onChange({ ...config, optimizeForWeb: e.target.checked })} />
                                    <span className="text-xs text-gray-400">Web表示最適化（線形化）</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={!!config.flattenAnnotations} onChange={(e) => onChange({ ...config, flattenAnnotations: e.target.checked })} />
                                    <span className="text-xs text-gray-400">注釈をフラット化（注釈を削除）</span>
                                </label>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">圧縮レベル</label>
                                    <select value={config.compressionLevel || 'medium'} onChange={(e) => onChange({ ...config, compressionLevel: e.target.value as any })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white">
                                        <option value="low">低</option>
                                        <option value="medium">中</option>
                                        <option value="high">高</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
