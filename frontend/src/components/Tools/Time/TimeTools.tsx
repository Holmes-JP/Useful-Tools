import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, differenceInDays, differenceInYears, isValid, parse, fromUnixTime, getUnixTime, isLeapYear } from 'date-fns';
import { ja } from 'date-fns/locale';
import JapaneseHolidays from 'japanese-holidays';
import { Clock, Timer, Calculator, Binary, Copy, Play, Pause, RotateCcw, Flag } from 'lucide-react';
import clsx from 'clsx';

// --- サブコンポーネント: 現在時刻 & 世界時計 ---
const WorldClock = () => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const cities = [
        { name: 'Tokyo', tz: 'Asia/Tokyo' },
        { name: 'New York', tz: 'America/New_York' },
        { name: 'London', tz: 'Europe/London' },
        { name: 'UTC', tz: 'UTC' },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* メイン時計 */}
            <div className="bg-surface border border-gray-700 p-8 rounded-2xl text-center">
                <p className="text-gray-400 font-mono mb-2">{format(now, 'yyyy/MM/dd (E)', { locale: ja })}</p>
                <h2 className="text-6xl md:text-8xl font-bold text-primary-500 font-mono tracking-wider">
                    {format(now, 'HH:mm:ss')}
                </h2>
            </div>

            {/* 世界時計グリッド */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cities.map((city) => {
                    const timeString = new Intl.DateTimeFormat('en-US', {
                        timeZone: city.tz,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }).format(now);
                    return (
                        <div key={city.name} className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{city.name}</p>
                            <p className="text-2xl font-mono text-white">{timeString}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- サブコンポーネント: ストップウォッチ ---
const Stopwatch = () => {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [laps, setLaps] = useState<number[]>([]);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    const update = () => {
        setTime(Date.now() - startTimeRef.current);
        requestRef.current = requestAnimationFrame(update);
    };

    const start = () => {
        setIsRunning(true);
        startTimeRef.current = Date.now() - time;
        requestRef.current = requestAnimationFrame(update);
    };

    const stop = () => {
        setIsRunning(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

    const reset = () => {
        stop();
        setTime(0);
        setLaps([]);
    };

    const lap = () => {
        setLaps([time, ...laps]);
    };

    // フォーマット (mm:ss.ms)
    const formatTime = (ms: number) => {
        const date = new Date(ms);
        return format(date, 'mm:ss.SS');
    };

    return (
        <div className="space-y-6 animate-fade-in-up max-w-lg mx-auto">
            <div className="bg-surface border border-gray-700 p-10 rounded-full aspect-square flex items-center justify-center relative shadow-2xl shadow-primary-500/10">
                <div className="text-center">
                    <span className="text-6xl font-mono text-white font-bold block w-64">
                        {formatTime(time)}
                    </span>
                    <span className="text-gray-500 text-sm mt-2 block">Stopwatch</span>
                </div>
            </div>

            <div className="flex justify-center gap-4">
                {!isRunning ? (
                    <button onClick={start} className="p-4 rounded-full bg-primary-500 hover:bg-primary-400 text-black transition shadow-lg">
                        <Play fill="currentColor" />
                    </button>
                ) : (
                    <button onClick={stop} className="p-4 rounded-full bg-red-500 hover:bg-red-400 text-white transition shadow-lg">
                        <Pause fill="currentColor" />
                    </button>
                )}
                <button onClick={lap} disabled={!isRunning} className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition disabled:opacity-50">
                    <Flag />
                </button>
                <button onClick={reset} className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition">
                    <RotateCcw />
                </button>
            </div>

            {laps.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 max-h-48 overflow-y-auto border border-gray-800">
                    {laps.map((lapTime, i) => (
                        <div key={i} className="flex justify-between py-2 border-b border-gray-800 last:border-0 font-mono text-sm">
                            <span className="text-gray-500">Lap {laps.length - i}</span>
                            <span className="text-white">{formatTime(lapTime)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- サブコンポーネント: 日付計算機 ---
const DateCalculator = () => {
    // 1. 未来/過去日計算
    const [baseDate, setBaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [daysToAdd, setDaysToAdd] = useState<number>(0);
    
    // 2. 年齢計算
    const [birthDate, setBirthDate] = useState('');
    const [ageResult, setAgeResult] = useState<string>('');

    // 3. 期間計算
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [diffResult, setDiffResult] = useState<string>('');

    const calcFutureDate = () => {
        const date = new Date(baseDate);
        if (isValid(date)) {
            const result = addDays(date, daysToAdd);
            return format(result, 'yyyy年MM月dd日 (E)', { locale: ja });
        }
        return '---';
    };

    const calcAge = () => {
        const birth = new Date(birthDate);
        if (isValid(birth)) {
            const age = differenceInYears(new Date(), birth);
            const days = differenceInDays(new Date(), birth);
            setAgeResult(`${age}歳 (生まれてから約 ${days.toLocaleString()} 日)`);
        }
    };

    const calcDiff = () => {
        const s = new Date(startDate);
        const e = new Date(endDate);
        if (isValid(s) && isValid(e)) {
            const diff = differenceInDays(e, s);
            setDiffResult(`${diff} 日間`);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
            {/* 未来日計算 */}
            <div className="bg-surface p-6 rounded-xl border border-gray-700">
                <h3 className="text-primary-400 font-bold mb-4">未来・過去日計算</h3>
                <div className="space-y-4">
                    <input 
                        type="date" 
                        value={baseDate} 
                        onChange={(e) => setBaseDate(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                    />
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={daysToAdd} 
                            onChange={(e) => setDaysToAdd(Number(e.target.value))}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                        />
                        <span className="text-gray-400 whitespace-nowrap">日後</span>
                    </div>
                    <div className="bg-gray-900 p-3 rounded text-center text-xl font-bold text-white">
                        {calcFutureDate()}
                    </div>
                </div>
            </div>

            {/* 年齢計算 */}
            <div className="bg-surface p-6 rounded-xl border border-gray-700">
                <h3 className="text-primary-400 font-bold mb-4">年齢・生存日数</h3>
                <div className="space-y-4">
                    <input 
                        type="date" 
                        value={birthDate} 
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                    />
                    <button onClick={calcAge} className="w-full bg-primary-500 text-black font-bold py-2 rounded hover:bg-primary-400 transition">
                        計算する
                    </button>
                    {ageResult && (
                        <div className="bg-gray-900 p-3 rounded text-center font-bold text-white">
                            {ageResult}
                        </div>
                    )}
                </div>
            </div>

            {/* 期間計算 */}
            <div className="bg-surface p-6 rounded-xl border border-gray-700 md:col-span-2">
                <h3 className="text-primary-400 font-bold mb-4">期間計算 (日数差)</h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full">
                        <label className="text-xs text-gray-500 block mb-1">開始日</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"/>
                    </div>
                    <div className="w-full">
                        <label className="text-xs text-gray-500 block mb-1">終了日</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"/>
                    </div>
                    <button onClick={calcDiff} className="bg-primary-500 text-black font-bold py-2 px-6 rounded hover:bg-primary-400 transition whitespace-nowrap">
                        計算
                    </button>
                </div>
                {diffResult && (
                    <div className="mt-4 bg-gray-900 p-3 rounded text-center text-xl font-bold text-white">
                        {diffResult}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- サブコンポーネント: ユーティリティ (UNIX / 祝日 / うるう年) ---
const Utilities = () => {
    // UNIX Time
    const [unixInput, setUnixInput] = useState<string>(getUnixTime(new Date()).toString());
    const [unixResult, setUnixResult] = useState('');

    // うるう年
    const [yearInput, setYearInput] = useState<number>(new Date().getFullYear());

    // 祝日
    const [holidayDate, setHolidayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [holidayName, setHolidayName] = useState<string | null>(null);

    useEffect(() => {
        // UNIX変換
        try {
            const date = fromUnixTime(Number(unixInput));
            if (isValid(date)) {
                setUnixResult(format(date, 'yyyy/MM/dd HH:mm:ss', { locale: ja }));
            } else {
                setUnixResult('Invalid Timestamp');
            }
        } catch {
            setUnixResult('Error');
        }
    }, [unixInput]);

    useEffect(() => {
        // 祝日判定
        const date = new Date(holidayDate);
        if (isValid(date)) {
            const holiday = JapaneseHolidays.isHoliday(date);
            setHolidayName(holiday || "祝日ではありません");
        }
    }, [holidayDate]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* UNIX変換 */}
            <div className="bg-surface p-6 rounded-xl border border-gray-700">
                <h3 className="text-primary-400 font-bold mb-4 flex items-center gap-2">
                    <Binary size={18} /> UNIX Time Converter
                </h3>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <input 
                        type="number" 
                        value={unixInput} 
                        onChange={(e) => setUnixInput(e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-600 rounded p-2 text-white font-mono"
                        placeholder="Unix Timestamp"
                    />
                    <span className="text-gray-500">⇄</span>
                    <div className="flex-1 bg-gray-900 p-2 rounded text-white font-mono border border-transparent">
                        {unixResult}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* うるう年判定 */}
                <div className="bg-surface p-6 rounded-xl border border-gray-700">
                    <h3 className="text-primary-400 font-bold mb-4">うるう年判定</h3>
                    <input 
                        type="number" 
                        value={yearInput} 
                        onChange={(e) => setYearInput(Number(e.target.value))}
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white mb-3"
                    />
                    <div className="bg-gray-900 p-3 rounded text-center text-white">
                        {isLeapYear(new Date(yearInput, 0, 1)) 
                            ? <span className="text-primary-400 font-bold">YES, うるう年です (366日)</span> 
                            : <span className="text-gray-400">NO, 平年です (365日)</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        ※4で割り切れる年はうるう年ですが、100で割り切れる年は平年、ただし400で割り切れる年はうるう年になります。
                    </p>
                </div>

                {/* 祝日判定 */}
                <div className="bg-surface p-6 rounded-xl border border-gray-700">
                    <h3 className="text-primary-400 font-bold mb-4">日本の祝日判定</h3>
                    <input 
                        type="date" 
                        value={holidayDate} 
                        onChange={(e) => setHolidayDate(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white mb-3"
                    />
                    <div className="bg-gray-900 p-3 rounded text-center text-white font-bold">
                        {holidayName}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- メインコンポーネント ---
export default function TimeTools() {
    const [activeTab, setActiveTab] = useState<'clock' | 'stopwatch' | 'calc' | 'util'>('clock');

    const tabs = [
        { id: 'clock', label: 'Clock', icon: Clock },
        { id: 'stopwatch', label: 'Stopwatch', icon: Timer },
        { id: 'calc', label: 'Date Calc', icon: Calculator },
        { id: 'util', label: 'Utilities', icon: Binary },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* ヘッダー */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Clock className="text-primary-500" />
                    Time Tools
                </h2>
                <p className="text-gray-500 text-sm">
                    Advanced Time Management & Calculation
                </p>
            </div>

            {/* タブナビゲーション */}
            <div className="flex justify-center gap-2 md:gap-4 overflow-x-auto pb-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap",
                                isActive 
                                    ? "bg-primary-500 text-black shadow-lg shadow-primary-500/20" 
                                    : "bg-surface text-gray-400 hover:bg-gray-800 hover:text-white"
                            )}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* コンテンツエリア */}
            <div className="min-h-[400px]">
                {activeTab === 'clock' && <WorldClock />}
                {activeTab === 'stopwatch' && <Stopwatch />}
                {activeTab === 'calc' && <DateCalculator />}
                {activeTab === 'util' && <Utilities />}
            </div>
        </div>
    );
}