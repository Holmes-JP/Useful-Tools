import { useState } from 'react';
import { BadgePercent, Coins } from 'lucide-react';
import clsx from 'clsx';

export default function FinanceCalculator() {
    const [mode, setMode] = useState<'discount' | 'tax'>('discount');
    const [price, setPrice] = useState<string>('3980');
    const [percent, setPercent] = useState<string>('30');
    const [taxPrice, setTaxPrice] = useState<string>('1000');
    const [taxRate, setTaxRate] = useState<string>('10');

    const DiscountCalc = () => {
        const p = Number(price) || 0;
        const per = Number(percent) || 0;
        const saved = Math.floor(p * (per / 100));
        const final = p - saved;
        return (
            <div className="bg-surface border border-gray-700 p-6 rounded-xl space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs text-gray-500 mb-1">Price (円)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white text-lg font-mono" /></div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Discount (%)</label>
                        <div className="flex gap-2">
                            <input type="number" value={percent} onChange={e => setPercent(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white text-lg font-mono" />
                            <div className="flex flex-col gap-1">{[10, 20, 30, 50].map(n => <button key={n} onClick={() => setPercent(n.toString())} className="bg-gray-800 text-xs px-2 py-1 rounded hover:bg-gray-700 text-gray-300">{n}%</button>)}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 grid grid-cols-2 gap-4 text-center">
                    <div><p className="text-xs text-gray-500 mb-1">Final Price</p><p className="text-3xl font-bold text-primary-500 font-mono">¥{final.toLocaleString()}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">You Save</p><p className="text-xl font-bold text-green-400 font-mono">-¥{saved.toLocaleString()}</p></div>
                </div>
            </div>
        );
    };

    const TaxCalc = () => {
        const p = Number(taxPrice) || 0;
        const rate = Number(taxRate) || 10;
        const taxAmount = Math.floor(p * (rate / 100));
        const withTax = p + taxAmount;
        const withoutTax = Math.ceil(p / (1 + rate / 100));
        return (
            <div className="bg-surface border border-gray-700 p-6 rounded-xl space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Price</label><input type="number" value={taxPrice} onChange={e => setTaxPrice(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white text-lg font-mono" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Tax (%)</label><select value={taxRate} onChange={e => setTaxRate(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white text-lg font-mono h-[54px]"><option value="8">8%</option><option value="10">10%</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center"><p className="text-xs text-gray-500 mb-1">税込 (Including Tax)</p><p className="text-2xl font-bold text-white font-mono">¥{withTax.toLocaleString()}</p><p className="text-xs text-gray-600 mt-1">(Tax: ¥{taxAmount.toLocaleString()})</p></div>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center opacity-70"><p className="text-xs text-gray-500 mb-1">税抜 (If input is Incl.)</p><p className="text-xl font-bold text-gray-300 font-mono">¥{withoutTax.toLocaleString()}</p></div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex gap-4 border-b border-gray-700 pb-1">
                <button onClick={() => setMode('discount')} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'discount' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}><BadgePercent size={20} /> Discount</button>
                <button onClick={() => setMode('tax')} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'tax' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}><Coins size={20} /> Tax</button>
            </div>
            {mode === 'discount' ? <DiscountCalc /> : <TaxCalc />}
        </div>
    );
}
