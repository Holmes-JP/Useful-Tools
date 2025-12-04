import { useState } from 'react';
import CryptoJS from 'crypto-js';

export default function HashAnalyzerPanel() {
    const [text, setText] = useState('');
    const [algo, setAlgo] = useState<'MD5'|'SHA1'|'SHA256'>('MD5');
    const [result, setResult] = useState('');

    function compute() {
        let out = '';
        if (algo === 'MD5') out = CryptoJS.MD5(text).toString();
        else if (algo === 'SHA1') out = CryptoJS.SHA1(text).toString();
        else out = CryptoJS.SHA256(text).toString();
        setResult(out);
    }

    return (
        <div className="space-y-4">
            <h4 className="text-xl font-semibold text-white">Hash Generator</h4>
            <textarea className="w-full bg-gray-800 p-2 rounded" rows={6} value={text} onChange={e => setText(e.target.value)} />
            <div className="flex items-center gap-2">
                <select value={algo} onChange={e => setAlgo(e.target.value as any)} className="bg-gray-800 p-2 rounded">
                    <option>MD5</option>
                    <option>SHA1</option>
                    <option>SHA256</option>
                </select>
                <button className="px-3 py-1 bg-primary-500 rounded text-black" onClick={compute}>Generate</button>
                <input readOnly className="flex-1 bg-gray-900 p-2 rounded" value={result} />
            </div>
        </div>
    );
}
