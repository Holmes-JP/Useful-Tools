import { useState, useEffect } from 'react';
import { format, addDays, isWeekend, differenceInDays, isSameDay } from 'date-fns';
import JapaneseHolidays from 'japanese-holidays';
import { Briefcase, Calculator } from 'lucide-react';
import clsx from 'clsx';

export default function BusinessDays() {
    const [mode, setMode] = useState<'add' | 'diff'>('add');
    
    // Add Mode
    const [baseDate, setBaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [daysToAdd, setDaysToAdd] = useState(5);
    const [resultDate, setResultDate] = useState('');

    // Diff Mode
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
    const [resultDiff, setResultDiff] = useState(0);

    const isHoliday = (date: Date) => {
        return isWeekend(date) || !!JapaneseHolidays.isHoliday(date);
    };

    // 営業日加算ロジック
    const calculateAdd = () => {
        let current = new Date(baseDate);
        let count = 0;
        const sign = daysToAdd >= 0 ? 1 : -1;
        const target = Math.abs(daysToAdd);

        while (count < target) {
            current = addDays(current, sign);
            if (!isHoliday(current)) {
                count++;
            }
        }
        setResultDate(format(current, 'yyyy-MM-dd (E)'));
    };

    // 営業日差分ロジック
    const calculateDiff = () => {
        let current = new Date(startDate);
        const end = new Date(endDate);
        let count = 0;
        
        // 単純化のため start < end 前提 (逆なら入れ替え推奨だが簡易実装)
        if (current > end) { setResultDiff(0); return; }

        while (!isSameDay(current, end)) {
            current = addDays(current, 1); // 開始日は含めず、翌日からカウントするのが一般的
            if (!isHoliday(current)) {
                count++;
            }
            if (differenceInDays(end, current) > 365 * 5) break; // 無限ループ防止
        }
        setResultDiff(count);
    };

    useEffect(() => { calculateAdd(); }, [baseDate, daysToAdd]);
    useEffect(() => { calculateDiff(); }, [startDate, endDate]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex gap-2 border-b border-gray-700 pb-1">
                <button onClick={() => setMode('add')} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'add' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}>
                    <Calculator size={18} /> X営業日後は？
                </button>
                <button onClick={() => setMode('diff')} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'diff' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}>
                    <Briefcase size={18} /> 営業日数は？
                </button>
            </div>

            <div className="bg-surface border border-gray-700 p-6 rounded-xl">
                {mode === 'add' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">基準日</label>
                            <input type="date" value={baseDate} onChange={e => setBaseDate(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="number" value={daysToAdd} onChange={e => setDaysToAdd(Number(e.target.value))} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 font-bold text-lg" />
                            <span className="text-white whitespace-nowrap">営業日後</span>
                        </div>
                        <div className="bg-gray-900 p-6 rounded-xl text-center border border-gray-800 mt-4">
                            <p className="text-sm text-gray-500 mb-1">Result Date</p>
                            <p className="text-3xl font-bold text-primary-500">{resultDate}</p>
                            <p className="text-xs text-gray-600 mt-2">※土日・日本の祝日を除外</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">開始日</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">終了日</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" />
                            </div>
                        </div>
                        <div className="bg-gray-900 p-6 rounded-xl text-center border border-gray-800 mt-4">
                            <p className="text-sm text-gray-500 mb-1">Business Days</p>
                            <p className="text-3xl font-bold text-primary-500">{resultDiff} Days</p>
                            <p className="text-xs text-gray-600 mt-2">※期間内の平日数</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
