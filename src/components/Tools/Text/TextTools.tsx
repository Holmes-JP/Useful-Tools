import React, { useState } from 'react';
import { FileText, Split, FileCode } from 'lucide-react';
import clsx from 'clsx';

import TextAnalyzer from './Views/TextAnalyzer';
import DiffViewer from './Views/DiffViewer';
import MarkdownPreview from './Views/MarkdownPreview';

export default function TextTools() {
    const [tab, setTab] = useState<'analyzer' | 'diff' | 'md'>('analyzer');

    const tabs = [
        { id: 'analyzer', label: 'Text Analyzer', icon: FileText },
        { id: 'diff', label: 'Diff Viewer', icon: Split },
        { id: 'md', label: 'Markdown', icon: FileCode },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <FileText className="text-primary-500" />
                    Text & Code
                </h2>
                <p className="text-gray-500 text-sm">
                    Analyzer, Diff, and Markdown Editor
                </p>
            </div>

            <div className="flex justify-center gap-2 md:gap-4 overflow-x-auto pb-2">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id as any)}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap",
                            tab === t.id 
                                ? "bg-primary-500 text-black shadow-lg" 
                                : "bg-surface text-gray-400 hover:bg-gray-800"
                        )}
                    >
                        <t.icon size={18} />
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {tab === 'analyzer' && <TextAnalyzer />}
                {tab === 'diff' && <DiffViewer />}
                {tab === 'md' && <MarkdownPreview />}
            </div>
        </div>
    );
}
