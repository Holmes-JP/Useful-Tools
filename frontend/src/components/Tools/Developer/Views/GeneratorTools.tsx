import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Copy, RefreshCw, Key, Fingerprint, Hash, Settings2 } from 'lucide-react';
import { useHashGenerator, SaltMode } from '../../../../hooks/useHashGenerator';
import clsx from 'clsx';

export default function GeneratorTools() {
    const [activeTab, setActiveTab] = useState<'uuid' | 'password' | 'hash'>('uuid');

    // --- UUID Logic ---
    const [uuids, setUuids] = useState<string[]>([]);
    const [uuidCount, setUuidCount] = useState(1);

    const generateUuid = () => {
        const newUuids = Array.from({ length: uuidCount }, () => uuidv4());
        setUuids(newUuids);
    };

    // --- Password Logic ---
    const [pwdLength, setPwdLength] = useState(16);
    const [pwdCount, setPwdCount] = useState(1);
    const [pwdConfig, setPwdConfig] = useState({ upper: true, lower: true, number: true, symbol: true });
    const [passwords, setPasswords] = useState<string[]>([]);

    const generatePassword = () => {
        const chars = {
            upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lower: 'abcdefghijklmnopqrstuvwxyz',
            number: '0123456789',
            symbol: '!@#$%^&*()_+~`|}{[]:;?><,./-='
        };
        let charset = '';
        if (pwdConfig.upper) charset += chars.upper;
        if (pwdConfig.lower) charset += chars.lower;
        if (pwdConfig.number) charset += chars.number;
        if (pwdConfig.symbol) charset += chars.symbol;

        if (!charset) return;

        const newPasses: string[] = [];
        for (let k = 0; k < pwdCount; k++) {
            let result = '';
            const array = new Uint32Array(pwdLength);
            crypto.getRandomValues(array);
            for (let i = 0; i < pwdLength; i++) {
                result += charset[array[i] % charset.length];
            }
            newPasses.push(result);
        }
        setPasswords(newPasses);
    };

    // --- Hash Logic ---
    const { text: hashText, setText: setHashText, salt, setSalt, saltMode, setSaltMode, results: hashResults } = useHashGenerator();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                    <Fingerprint className="text-blue-500" /> Generators
                </h2>
                <p className="text-gray-400 mt-2">Secure ID, Password, and Hash generation</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('uuid')}
                    className={clsx(
                        "px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2",
                        activeTab === 'uuid' ? "bg-blue-500 text-white shadow-lg" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    )}
                >
                    <Fingerprint size={18} /> UUID / GUID
                </button>
                <button
                    onClick={() => setActiveTab('password')}
                    className={clsx(
                        "px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2",
                        activeTab === 'password' ? "bg-green-500 text-white shadow-lg" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    )}
                >
                    <Key size={18} /> Password
                </button>
                <button
                    onClick={() => setActiveTab('hash')}
                    className={clsx(
                        "px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2",
                        activeTab === 'hash' ? "bg-pink-500 text-white shadow-lg" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    )}
                >
                    <Hash size={18} /> Hash
                </button>
            </div>

            {/* ================= UUID View ================= */}
            {activeTab === 'uuid' && (
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg animate-fade-in">
                    <div className="flex items-end gap-4 mb-6">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1 font-bold">QUANTITY</label>
                            <input 
                                type="number" min="1" max="100" 
                                value={uuidCount} 
                                onChange={(e) => setUuidCount(Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <button onClick={generateUuid} className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-md">
                            <RefreshCw size={18} /> Generate
                        </button>
                    </div>

                    {uuids.length > 0 && (
                        <div className="bg-black/50 rounded-lg overflow-hidden border border-gray-700 max-h-96 overflow-y-auto">
                            {uuids.map((uuid, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border-b border-gray-700 last:border-0 hover:bg-gray-700/50">
                                    <code className="text-blue-300 font-mono">{uuid}</code>
                                    <button onClick={() => copyToClipboard(uuid)} className="text-gray-500 hover:text-white transition"><Copy size={16} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ================= Password View ================= */}
            {activeTab === 'password' && (
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg animate-fade-in">
                    <div className="space-y-6 mb-6">
                        {/* Row 1: Length & Quantity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs text-gray-400 font-bold">LENGTH: {pwdLength}</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="range" min="4" max="64" 
                                        value={pwdLength} 
                                        onChange={(e) => setPwdLength(Number(e.target.value))}
                                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                                    />
                                    <input 
                                        type="number" min="4" max="128"
                                        value={pwdLength}
                                        onChange={(e) => setPwdLength(Number(e.target.value))}
                                        className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-center text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1 font-bold">QUANTITY</label>
                                <input 
                                    type="number" min="1" max="100" 
                                    value={pwdCount} 
                                    onChange={(e) => setPwdCount(Number(e.target.value))}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-green-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Row 2: Character Options */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                            <label className="flex items-center gap-3 cursor-pointer text-gray-200 hover:bg-gray-800 p-2 rounded transition">
                                <input 
                                    type="checkbox" 
                                    checked={pwdConfig.upper} 
                                    onChange={(e) => setPwdConfig({...pwdConfig, upper: e.target.checked})}
                                    className="w-5 h-5 rounded bg-gray-700 border-gray-500 text-green-500 focus:ring-green-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold">Uppercase</span>
                                    <span className="text-xs text-gray-400 font-mono">A~Z</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer text-gray-200 hover:bg-gray-800 p-2 rounded transition">
                                <input 
                                    type="checkbox" 
                                    checked={pwdConfig.lower} 
                                    onChange={(e) => setPwdConfig({...pwdConfig, lower: e.target.checked})}
                                    className="w-5 h-5 rounded bg-gray-700 border-gray-500 text-green-500 focus:ring-green-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold">Lowercase</span>
                                    <span className="text-xs text-gray-400 font-mono">a~z</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer text-gray-200 hover:bg-gray-800 p-2 rounded transition">
                                <input 
                                    type="checkbox" 
                                    checked={pwdConfig.number} 
                                    onChange={(e) => setPwdConfig({...pwdConfig, number: e.target.checked})}
                                    className="w-5 h-5 rounded bg-gray-700 border-gray-500 text-green-500 focus:ring-green-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold">Numbers</span>
                                    <span className="text-xs text-gray-400 font-mono">0~9</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer text-gray-200 hover:bg-gray-800 p-2 rounded transition">
                                <input 
                                    type="checkbox" 
                                    checked={pwdConfig.symbol} 
                                    onChange={(e) => setPwdConfig({...pwdConfig, symbol: e.target.checked})}
                                    className="w-5 h-5 rounded bg-gray-700 border-gray-500 text-green-500 focus:ring-green-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold">Symbols</span>
                                    <span className="text-xs text-gray-400 font-mono">!@#</span>
                                </div>
                            </label>
                        </div>

                        <button onClick={generatePassword} className="w-full bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg">
                            <RefreshCw size={18} /> Generate Passwords
                        </button>
                    </div>

                    {passwords.length > 0 && (
                        <div className="bg-black/50 rounded-xl border border-gray-700 overflow-hidden max-h-96 overflow-y-auto custom-scrollbar">
                            {passwords.map((pwd, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border-b border-gray-700 last:border-0 hover:bg-gray-700/50 group transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-xs text-gray-600 w-6 text-right">{i + 1}.</span>
                                        <code className="text-green-400 font-mono text-lg truncate">{pwd}</code>
                                    </div>
                                    <button onClick={() => copyToClipboard(pwd)} className="text-gray-500 hover:text-white p-2 transition" title="Copy">
                                        <Copy size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ================= Hash View ================= */}
            {activeTab === 'hash' && (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-xs text-gray-400 font-bold uppercase">Input Text</label>
                                <textarea
                                    value={hashText}
                                    onChange={(e) => setHashText(e.target.value)}
                                    placeholder="Type text to hash..."
                                    className="w-full bg-gray-900 border border-gray-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none h-32 resize-none"
                                />
                            </div>

                            <div className="space-y-4 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                <div className="flex items-center gap-2 text-gray-300 font-bold text-sm mb-2">
                                    <Settings2 size={14} /> Salt Configuration
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Salt String</label>
                                    <input
                                        type="text"
                                        value={salt}
                                        onChange={(e) => setSalt(e.target.value)}
                                        placeholder="Optional salt..."
                                        className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-1 focus:ring-pink-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-2">Mode</label>
                                    <div className="flex gap-1">
                                        {(['append', 'prepend', 'hmac'] as SaltMode[]).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setSaltMode(mode)}
                                                className={clsx(
                                                    "flex-1 py-1.5 rounded text-[10px] font-bold transition-colors border uppercase tracking-wider",
                                                    saltMode === mode
                                                        ? "bg-pink-500/20 border-pink-500 text-pink-400"
                                                        : "bg-gray-800 border-gray-600 text-gray-500 hover:bg-gray-700"
                                                )}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {hashText && (
                        <div className="space-y-3">
                            {hashResults.map((res) => (
                                <div key={res.algo} className="group bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-pink-500/50 transition-all flex">
                                    <div className="bg-gray-900/80 w-24 flex items-center justify-center border-r border-gray-700 px-2 shrink-0">
                                        <span className="text-xs font-bold text-gray-400">{res.algo}</span>
                                    </div>
                                    <div className="flex-1 p-3 font-mono text-sm text-gray-300 break-all flex items-center">
                                        {res.value}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(res.value)}
                                        className="w-12 bg-gray-800/50 hover:bg-pink-500 hover:text-white border-l border-gray-700 text-gray-500 flex items-center justify-center transition-colors shrink-0"
                                    >
                                        <Copy size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
