import React, { useState, useEffect } from 'react';
import { evaluate, format } from 'mathjs';
import { ArrowRightLeft, Copy } from 'lucide-react';
import clsx from 'clsx';

export default function UnitConverter() {
    const [category, setCategory] = useState('length');
    const [val, setVal] = useState<string>('1');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [result, setResult] = useState('');

    const categories: any = {
        length: { label: 'Length', units: ['m', 'cm', 'mm', 'km', 'inch', 'foot', 'yard', 'mile'] },
        weight: { label: 'Weight', units: ['kg', 'g', 'mg', 'lb', 'oz', 'ton'] },
        data:   { label: 'Data',   units: ['b', 'B', 'kb', 'kB', 'Mb', 'MB', 'Gb', 'GB', 'Tb', 'TB'] },
        temp:   { label: 'Temp',   units: ['degC', 'degF', 'K'] },
        speed:  { label: 'Speed',  units: ['m/s', 'km/h', 'mph'] },
        area:   { label: 'Area',   units: ['m2', 'cm2', 'km2', 'hectare', 'acre'] }
    };

    useEffect(() => {
        if (categories[category]) {
            setFrom(categories[category].units[0]);
            setTo(categories[category].units[1] || categories[category].units[0]);
        }
    }, [category]);

    useEffect(() => {
        if (!val || isNaN(Number(val))) {
            setResult('---');
            return;
        }
        try {
            const f = from === 'degC' ? 'degC' : from;
            const t = to === 'degC' ? 'degC' : to;
            const expr = `${val} ${f} to ${t}`;
            const ans = evaluate(expr);
            let num = ans.toNumber ? ans.toNumber(t) : ans;
            setResult(format(num, { precision: 6, lowerExp: -9, upperExp: 9 }));
        } catch (e) {
            setResult('Error');
        }
    }, [val, from, to, category]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex gap-2 overflow-x-auto pb-2">
                {Object.keys(categories).map(key => (
                    <button
                        key={key}
                        onClick={() => setCategory(key)}
                        className={clsx(
                            "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors",
                            category === key ? "bg-primary-500 text-black" : "bg-gray-800 text-gray-400 hover:text-white"
                        )}
                    >
                        {categories[key].label}
                    </button>
                ))}
            </div>

            <div className="bg-surface border border-gray-700 p-6 rounded-xl flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full space-y-2">
                    <label className="text-xs text-gray-500 font-bold">FROM</label>
                    <div className="flex gap-2">
                        <input type="number" value={val} onChange={e => setVal(e.target.value)} className="flex-1 bg-gray-900 border border-gray-600 rounded p-3 text-white text-lg font-mono focus:border-primary-500 focus:outline-none" />
                        <select value={from} onChange={e => setFrom(e.target.value)} className="w-24 bg-gray-800 text-white rounded border border-gray-600 p-2">
                            {categories[category]?.units.map((u: string) => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>
                <div className="text-gray-500"><ArrowRightLeft /></div>
                <div className="flex-1 w-full space-y-2">
                    <label className="text-xs text-gray-500 font-bold">TO</label>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-gray-900 border border-gray-700 rounded p-3 text-primary-400 text-lg font-mono font-bold flex items-center justify-between group relative overflow-hidden">
                            <span className="truncate">{result}</span>
                            <button onClick={() => navigator.clipboard.writeText(result)} className="opacity-0 group-hover:opacity-100 transition text-gray-500 hover:text-white"><Copy size={16} /></button>
                        </div>
                        <select value={to} onChange={e => setTo(e.target.value)} className="w-24 bg-gray-800 text-white rounded border border-gray-600 p-2">
                            {categories[category]?.units.map((u: string) => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
