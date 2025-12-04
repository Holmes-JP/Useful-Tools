import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function GeneratorsPanel() {
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [useSymbols, setUseSymbols] = useState(true);
    const [useUpper, setUseUpper] = useState(true);
    const [useNumbers, setUseNumbers] = useState(true);

    function generateUUID() {
        const id = uuidv4();
        setTimeout(() => navigator.clipboard?.writeText(id), 0);
        return id;
    }

    function generatePassword() {
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nums = '0123456789';
        const syms = '!@#$%^&*()-_=+[]{};:,.<>?';

        let pool = lower;
        if (useUpper) pool += upper;
        if (useNumbers) pool += nums;
        if (useSymbols) pool += syms;

        let out = '';
        const plen = Math.max(4, Math.min(128, Number(length) || 16));
        for (let i = 0; i < plen; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            out += pool[idx];
        }
        setPassword(out);
    }

    return (
        <div className="space-y-4">
            <section>
                <h4 className="text-xl font-semibold text-white">UUID / GUID</h4>
                <div className="mt-2 flex gap-2">
                    <input className="flex-1 bg-gray-800 p-2 rounded" readOnly value={''} placeholder="Click generate" />
                    <button className="px-4 py-2 bg-primary-500 rounded text-black" onClick={() => { const id = generateUUID(); alert(id); }}>Generate UUID</button>
                </div>
            </section>

            <section>
                <h4 className="text-xl font-semibold text-white">Strong Password</h4>
                <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={useUpper} onChange={e => setUseUpper(e.target.checked)} /> Upper
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={useNumbers} onChange={e => setUseNumbers(e.target.checked)} /> Numbers
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={useSymbols} onChange={e => setUseSymbols(e.target.checked)} /> Symbols
                        </label>
                        <label className="flex items-center gap-2">
                            Length
                            <input type="number" value={length} min={4} max={128} onChange={e => setLength(Number(e.target.value))} className="w-20 bg-gray-800 p-1 rounded ml-2" />
                        </label>
                    </div>
                    <div className="flex gap-2 items-center">
                        <input className="flex-1 bg-gray-800 p-2 rounded" readOnly value={password} />
                        <button className="px-3 py-1 bg-primary-500 rounded text-black" onClick={generatePassword}>Generate</button>
                        <button className="px-3 py-1 bg-gray-700 rounded text-gray-200" onClick={() => { navigator.clipboard?.writeText(password); }}>Copy</button>
                    </div>
                </div>
            </section>
        </div>
    );
}
