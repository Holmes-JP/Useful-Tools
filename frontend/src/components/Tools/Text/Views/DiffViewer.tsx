import React, { useState, useEffect } from 'react';
import { diffLines, Change } from 'diff';
import { Split, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export default function DiffViewer() {
    const [oldText, setOldText] = useState('Console.log("Hello World");');
    const [newText, setNewText] = useState('console.log("Hello World!");');
    const [diffs, setDiffs] = useState<Change[]>([]);

    useEffect(() => {
        const d = diffLines(oldText, newText);
        setDiffs(d);
    }, [oldText, newText]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs text-gray-500 font-bold">ORIGINAL</label>
                    <textarea 
                        value={oldText}
                        onChange={(e) => setOldText(e.target.value)}
                        className="w-full h-48 bg-gray-900 border border-gray-600 rounded p-3 text-white font-mono text-xs"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-gray-500 font-bold">MODIFIED</label>
                    <textarea 
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        className="w-full h-48 bg-gray-900 border border-gray-600 rounded p-3 text-white font-mono text-xs"
                    />
                </div>
            </div>

            <div className="bg-surface border border-gray-700 p-6 rounded-xl">
                <h3 className="text-primary-400 font-bold mb-4 flex items-center gap-2">
                    <Split size={20} /> Diff Result
                </h3>
                <div className="bg-black rounded-lg p-4 font-mono text-sm overflow-x-auto whitespace-pre-wrap border border-gray-800">
                    {diffs.map((part, i) => {
                        const color = part.added ? 'bg-green-500/20 text-green-300' :
                                      part.removed ? 'bg-red-500/20 text-red-300' : 
                                      'text-gray-400';
                        const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
                        return (
                            <span key={i} className={clsx("block px-2", color)}>
                                {part.value.replace(/\n$/, '').split('\n').map((line, j) => (
                                    <div key={j} className="flex">
                                        <span className="select-none w-6 opacity-50">{prefix}</span>
                                        <span>{line}</span>
                                    </div>
                                ))}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
