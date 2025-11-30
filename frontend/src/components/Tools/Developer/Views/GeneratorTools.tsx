import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Copy, RefreshCw, KeyRound, Fingerprint } from 'lucide-react';
import clsx from 'clsx';

export default function GeneratorTools() {
    const [mode, setMode] = useState<'uuid' | 'password'>('uuid');
    
    // UUID State
    const [uuids, setUuids] = useState<string>('');
    const [uuidCount, setUuidCount] = useState(5);
    const [hyphens, setHyphens] = useState(true);

    // Password State
    const [password, setPassword] = useState('');
    const [passLength, setPassLength] = useState(16);
    const [useSymbols, setUseSymbols] = useState(true);
    const [useNumbers, setUseNumbers] = useState(true);
    const [useUppercase, setUseUppercase] = useState(true);

    const generateUuid = () => {
        const arr = Array.from({ length: uuidCount }).map(() => {
            const id = uuidv4();
            return hyphens ? id : id.replace(/-/g, '');
        });
        setUuids(arr.join('\n'));
    };

    const generatePassword = () => {
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nums = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        let chars = lower;
        if (useUppercase) chars += upper;
        if (useNumbers) chars += nums;
        if (useSymbols) chars += symbols;

        let result = '';
        const array = new Uint32Array(passLength);
        crypto.getRandomValues(array);
        for (let i = 0; i < passLength; i++) {
            result += chars[array[i] % chars.length];
        }
        setPassword(result);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* サブタブ */}
            <div className="flex gap-2 border-b border-gray-700 pb-1">
                <button onClick={() => setMode('uuid')} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'uuid' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}>
                    <Fingerprint size={18} /> UUID / GUID
                </button>
                <button onClick={() => setMode('password')} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'password' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}>
                    <KeyRound size={18} /> Password
                </button>
            </div>

            {mode === 'uuid' && (
                <div className="bg-surface border border-gray-700 p-6 rounded-xl space-y-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Count</label>
                            <input type="number" min="1" max="100" value={uuidCount} onChange={e => setUuidCount(Number(e.target.value))} className="w-20 bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                        </div>
                        <div className="pb-3">
                            <label className="flex items-center gap-2 text-white cursor-pointer">
                                <input type="checkbox" checked={hyphens} onChange={e => setHyphens(e.target.checked)} className="w-4 h-4" />
                                Hyphens
                            </label>
                        </div>
                        <button onClick={generateUuid} className="bg-primary-500 text-black font-bold px-6 py-2 rounded hover:bg-primary-400 transition flex items-center gap-2">
                            <RefreshCw size={18} /> Generate
                        </button>
                    </div>
                    <div className="relative">
                        <textarea value={uuids} readOnly className="w-full h-64 bg-gray-900 border border-gray-600 rounded p-3 text-white font-mono text-sm" placeholder="Generated UUIDs will appear here..." />
                        {uuids && (
                            <button onClick={() => navigator.clipboard.writeText(uuids)} className="absolute top-2 right-2 p-2 bg-gray-800 text-primary-500 rounded hover:bg-gray-700">
                                <Copy size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {mode === 'password' && (
                <div className="bg-surface border border-gray-700 p-6 rounded-xl space-y-6">
                    <div className="flex items-center gap-2 bg-gray-900 border border-gray-600 rounded p-4">
                        <input type="text" readOnly value={password} className="bg-transparent flex-1 text-xl font-mono text-white outline-none" placeholder="Click Generate" />
                        <button onClick={() => navigator.clipboard.writeText(password)} className="text-gray-400 hover:text-white p-2"><Copy size={20} /></button>
                        <button onClick={generatePassword} className="text-primary-500 hover:text-white p-2"><RefreshCw size={20} /></button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Length: {passLength}</label>
                            <input type="range" min="8" max="64" value={passLength} onChange={e => setPassLength(Number(e.target.value))} className="w-full" />
                        </div>
                        <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={useUppercase} onChange={e => setUseUppercase(e.target.checked)} /> A-Z</label>
                        <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={useNumbers} onChange={e => setUseNumbers(e.target.checked)} /> 0-9</label>
                        <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={useSymbols} onChange={e => setUseSymbols(e.target.checked)} /> !@#</label>
                    </div>
                </div>
            )}
        </div>
    );
}
