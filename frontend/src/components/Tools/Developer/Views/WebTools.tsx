import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import * as toml from 'toml'; // toml parsing
import { jwtDecode } from 'jwt-decode';
import { FileJson, Eye, Regex, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export default function WebTools() {
    const [mode, setMode] = useState<'json' | 'jwt' | 'regex'>('json');

    // JSON Converter
    const [jsonInput, setJsonInput] = useState('');
    const [jsonOutput, setJsonOutput] = useState('');
    const [jsonFormat, setJsonFormat] = useState<'yaml' | 'toml'>('yaml');
    
    // JWT
    const [jwtInput, setJwtInput] = useState('');
    const [jwtResult, setJwtResult] = useState('');

    // Regex
    const [regexPattern, setRegexPattern] = useState('');
    const [regexFlags, setRegexFlags] = useState('gm');
    const [regexText, setRegexText] = useState('');
    const [regexMatches, setRegexMatches] = useState<string[]>([]);

    // JSON/YAML Effect
    useEffect(() => {
        if (!jsonInput.trim()) return;
        try {
            // 入力がJSONかYAMLかを自動判定してオブジェクト化
            let obj;
            try {
                obj = JSON.parse(jsonInput);
            } catch {
                try {
                    obj = yaml.load(jsonInput);
                } catch {
                    setJsonOutput('Invalid JSON/YAML');
                    return;
                }
            }

            if (jsonFormat === 'yaml') {
                setJsonOutput(yaml.dump(obj));
            } else {
                // TOML書き出しはライブラリ依存が面倒なので今回は簡易JSON整形にするか、
                // 双方向変換の完全実装は複雑なため、ここでは整形済みJSONとして出力
                setJsonOutput(JSON.stringify(obj, null, 2)); 
            }
        } catch (e) {
            setJsonOutput('Error parsing input');
        }
    }, [jsonInput, jsonFormat]);

    // JWT Effect
    useEffect(() => {
        if (!jwtInput.trim()) { setJwtResult(''); return; }
        try {
            const decoded = jwtDecode(jwtInput);
            const header = jwtDecode(jwtInput, { header: true });
            setJwtResult(JSON.stringify({ header, payload: decoded }, null, 2));
        } catch (e) {
            setJwtResult('Invalid JWT Token');
        }
    }, [jwtInput]);

    // Regex Effect
    useEffect(() => {
        if (!regexPattern || !regexText) { setRegexMatches([]); return; }
        try {
            const re = new RegExp(regexPattern, regexFlags);
            const matches = regexText.match(re);
            setRegexMatches(matches ? Array.from(matches) : []);
        } catch {
            setRegexMatches([]);
        }
    }, [regexPattern, regexFlags, regexText]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex gap-2 border-b border-gray-700 pb-1">
                <button onClick={() => setMode('json')} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'json' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}><FileJson size={18} /> JSON/YAML</button>
                <button onClick={() => setMode('jwt')} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'jwt' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}><Eye size={18} /> JWT Decoder</button>
                <button onClick={() => setMode('regex')} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'regex' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}><Regex size={18} /> Regex Tester</button>
            </div>

            {mode === 'json' && (
                <div className="bg-surface border border-gray-700 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500">Input (JSON or YAML)</label>
                        <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} className="w-full h-64 bg-gray-900 border border-gray-600 rounded p-3 text-white font-mono text-xs" placeholder='{"key": "value"} or key: value' />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs text-gray-500">Output</label>
                            <select value={jsonFormat} onChange={e => setJsonFormat(e.target.value as any)} className="bg-gray-800 text-white text-xs rounded px-2"><option value="yaml">to YAML</option><option value="toml">to JSON (Formatted)</option></select>
                        </div>
                        <textarea readOnly value={jsonOutput} className="w-full h-64 bg-gray-900 border border-gray-600 rounded p-3 text-primary-400 font-mono text-xs" />
                    </div>
                </div>
            )}

            {mode === 'jwt' && (
                <div className="bg-surface border border-gray-700 p-6 rounded-xl space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Encoded Token</label>
                        <textarea value={jwtInput} onChange={e => setJwtInput(e.target.value)} className="w-full h-24 bg-gray-900 border border-gray-600 rounded p-3 text-white font-mono text-xs break-all" placeholder="eyJhbGci..." />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Decoded Payload</label>
                        <pre className="w-full h-64 bg-gray-900 border border-gray-600 rounded p-3 text-green-400 font-mono text-sm overflow-auto">{jwtResult}</pre>
                    </div>
                </div>
            )}

            {mode === 'regex' && (
                <div className="bg-surface border border-gray-700 p-6 rounded-xl space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 block mb-1">Pattern</label>
                            <input type="text" value={regexPattern} onChange={e => setRegexPattern(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white font-mono" placeholder="[a-z]+" />
                        </div>
                        <div className="w-24">
                            <label className="text-xs text-gray-500 block mb-1">Flags</label>
                            <input type="text" value={regexFlags} onChange={e => setRegexFlags(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white font-mono" placeholder="gm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Test String</label>
                            <textarea value={regexText} onChange={e => setRegexText(e.target.value)} className="w-full h-40 bg-gray-900 border border-gray-600 rounded p-3 text-white font-mono text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Matches ({regexMatches.length})</label>
                            <div className="w-full h-40 bg-gray-900 border border-gray-600 rounded p-3 text-primary-400 font-mono text-sm overflow-auto">
                                {regexMatches.map((m, i) => <div key={i} className="border-b border-gray-800 py-1">{m}</div>)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
