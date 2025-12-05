import React from 'react';
import CryptoJS from 'crypto-js';
import { Copy } from 'lucide-react';
import { useHashGenerator, SaltMode, HashResult, HashAlgo } from '../../../hooks/useHashGenerator';

type Props = {
    // Controlled mode (pass hook state from parent)
    text?: string;
    setText?: (s: string) => void;
    salt?: string;
    setSalt?: (s: string) => void;
    saltMode?: SaltMode;
    setSaltMode?: (m: SaltMode) => void;
    results?: HashResult[];

    // Simple mode for network panel
    simple?: boolean;
    simpleAlgo?: HashAlgo[] | HashAlgo;
    onSimpleGenerate?: (out: string) => void;
};

export default function HashGenerator(props: Props) {
    const controlled = props.text !== undefined && props.setText !== undefined && props.results !== undefined;

    const internal = useHashGenerator();

    const text = controlled ? props.text! : internal.text;
    const setText = controlled ? props.setText! : internal.setText;
    const salt = controlled ? props.salt! : internal.salt;
    const setSalt = controlled ? props.setSalt! : internal.setSalt;
    const saltMode = controlled ? props.saltMode! : internal.saltMode;
    const setSaltMode = controlled ? props.setSaltMode! : internal.setSaltMode;
    const results = controlled ? props.results! : internal.results;

    const copyToClipboard = (t: string) => navigator.clipboard?.writeText(t);

    if (props.simple) {
        // Simple generator: single input, select algo, generate button
        const [input, setInput] = React.useState('');
        const [algo, setAlgo] = React.useState<HashAlgo>(Array.isArray(props.simpleAlgo) ? (props.simpleAlgo[0] as HashAlgo) : (props.simpleAlgo as HashAlgo) || 'MD5');

        const gen = () => {
            let out = '';
            try {
                switch (algo) {
                    case 'MD5': out = CryptoJS.MD5(input).toString(); break;
                    case 'SHA1': out = CryptoJS.SHA1(input).toString(); break;
                    case 'SHA256': out = CryptoJS.SHA256(input).toString(); break;
                    case 'SHA512': out = CryptoJS.SHA512(input).toString(); break;
                    case 'RIPEMD160': out = CryptoJS.RIPEMD160(input).toString(); break;
                }
            } catch (e) {
                out = '';
            }

            props.onSimpleGenerate?.(out);
        };

        const algoOptions = Array.isArray(props.simpleAlgo) ? props.simpleAlgo : ['MD5','SHA1','SHA256'];

        return (
            <section>
                <h4 className="text-lg font-semibold text-white">Hash Generator</h4>
                <div className="mt-2 flex gap-2">
                    <input className="flex-1 bg-gray-800 p-2 rounded" value={input} onChange={e=>setInput(e.target.value)} />
                    <select className="bg-gray-800 p-2 rounded" value={algo} onChange={e=>setAlgo(e.target.value as HashAlgo)}>
                        {algoOptions.map(a => <option key={String(a)}>{a}</option>)}
                    </select>
                    <button className="px-3 py-1 bg-primary-500 rounded text-black" onClick={gen}>Gen</button>
                </div>
            </section>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-xs text-gray-400 font-bold uppercase">Input Text</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type text to hash..."
                            className="w-full bg-gray-900 border border-gray-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none h-32 resize-none"
                        />
                    </div>

                    <div className="space-y-4 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                        <div className="flex items-center gap-2 text-gray-300 font-bold text-sm mb-2">
                            <span className="text-sm font-bold">Salt Configuration</span>
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
                                        className={
                                            `flex-1 py-1.5 rounded text-[10px] font-bold transition-colors border uppercase tracking-wider ${saltMode === mode ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-gray-800 border-gray-600 text-gray-500 hover:bg-gray-700'}`
                                        }
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {text && (
                <div className="space-y-3">
                    {results.map((res) => (
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
    );
}
