import { useState } from 'react';
import { FileText, Copy, Trash2 } from 'lucide-react';

export default function TextAnalyzer() {
    const [text, setText] = useState('');

    const stats = {
        chars: text.length,
        charsNoSpace: text.replace(/\s/g, '').length,
        words: text.trim() === '' ? 0 : text.trim().split(/\s+/).length,
        lines: text ? text.split(/\r\n|\r|\n/).length : 0,
        bytes: new Blob([text]).size
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* スタッツ表示 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Characters', val: stats.chars },
                    { label: 'w/o Spaces', val: stats.charsNoSpace },
                    { label: 'Words', val: stats.words },
                    { label: 'Lines', val: stats.lines },
                    { label: 'Bytes', val: stats.bytes }
                ].map((s) => (
                    <div key={s.label} className="bg-gray-900 border border-gray-700 p-3 rounded-xl text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">{s.label}</div>
                        <div className="text-xl font-mono text-white font-bold">{s.val.toLocaleString()}</div>
                    </div>
                ))}
            </div>

            {/* 入力エリア */}
            <div className="bg-surface border border-gray-700 p-4 rounded-xl relative">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-primary-400 font-bold flex items-center gap-2">
                        <FileText size={18} /> Text Input
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => navigator.clipboard.writeText(text)} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition" title="Copy">
                            <Copy size={16} />
                        </button>
                        <button onClick={() => setText('')} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400 transition" title="Clear">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-96 bg-gray-900 border border-gray-600 rounded-lg p-4 text-white font-mono text-sm focus:border-primary-500 focus:outline-none resize-y"
                    placeholder="Type or paste your text here..."
                />
            </div>
        </div>
    );
}
