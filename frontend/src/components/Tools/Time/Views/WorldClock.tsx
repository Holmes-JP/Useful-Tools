import { useState, useEffect } from 'react';
import { Copy, Globe } from 'lucide-react';

export default function WorldClock() {
    const [now, setNow] = useState(new Date());
    const [copyStatus, setCopyStatus] = useState('Copy');

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStr = days[now.getDay()];

    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        const day = days[date.getDay()];
        const h = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        return `${y}/${m}/${d} (${day}) ${h}:${min}:${s}`;
    };

    const handleCopy = () => {
        const text = formatDate(now);
        navigator.clipboard.writeText(text);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy'), 2000);
    };

    // 都市データ
    const cities = [
        { name: 'UTC', zone: 'UTC', country: 'UN', label: 'UTC', utc: 'UTC+0', jst: 'JST-9' },
        { name: 'Tokyo', zone: 'Asia/Tokyo', country: 'JP', label: 'JST', utc: 'UTC+9', jst: 'JST±0' },
        { name: 'New York', zone: 'America/New_York', country: 'US', label: 'EST/EDT', utc: 'UTC-5', jst: 'JST-14' },
        { name: 'London', zone: 'Europe/London', country: 'GB', label: 'GMT/BST', utc: 'UTC+0', jst: 'JST-9' },
        { name: 'Paris', zone: 'Europe/Paris', country: 'FR', label: 'CET', utc: 'UTC+1', jst: 'JST-8' },
        { name: 'Berlin', zone: 'Europe/Berlin', country: 'DE', label: 'CET', utc: 'UTC+1', jst: 'JST-8' },
        { name: 'Cairo', zone: 'Africa/Cairo', country: 'EG', label: 'EET', utc: 'UTC+2', jst: 'JST-7' },
        { name: 'Dubai', zone: 'Asia/Dubai', country: 'AE', label: 'GST', utc: 'UTC+4', jst: 'JST-5' },
        { name: 'Mumbai', zone: 'Asia/Kolkata', country: 'IN', label: 'IST', utc: 'UTC+5.5', jst: 'JST-3.5' },
        { name: 'Bangkok', zone: 'Asia/Bangkok', country: 'TH', label: 'ICT', utc: 'UTC+7', jst: 'JST-2' },
        { name: 'Shanghai', zone: 'Asia/Shanghai', country: 'CN', label: 'CST', utc: 'UTC+8', jst: 'JST-1' },
        { name: 'Sydney', zone: 'Australia/Sydney', country: 'AU', label: 'AEST', utc: 'UTC+10', jst: 'JST+1' },
    ];

    const getCityTime = (zone: string) => {
        return new Intl.DateTimeFormat('en-US', {
            timeZone: zone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(now);
    };

    // 日付差分判定: 同じ日なら null を返す
    const getCityDateDiff = (zone: string) => {
        const localDateString = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(now);
        const targetDateString = new Intl.DateTimeFormat('en-CA', { timeZone: zone }).format(now);
        
        if (localDateString === targetDateString) return null;
        if (targetDateString > localDateString) return '+1 Day';
        return '-1 Day';
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Main Clock */}
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 opacity-50" />
                
                <h3 className="text-primary-400 font-bold uppercase tracking-widest mb-2 text-sm">Current Local Time</h3>
                <div className="text-6xl md:text-8xl font-black text-white font-mono tracking-tighter mb-4 drop-shadow-lg">
                    {now.toLocaleTimeString('en-US', { hour12: false })}
                </div>
                <div className="text-2xl text-gray-300 font-medium flex items-center justify-center gap-3">
                    <span>{now.getFullYear()}/{String(now.getMonth() + 1).padStart(2, '0')}/{String(now.getDate()).padStart(2, '0')}</span>
                    <span className="text-primary-400">({dayStr})</span>
                </div>

                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={handleCopy}
                        className="group flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-full transition-all duration-200 shadow-md hover:shadow-primary-500/20 border border-gray-600 hover:border-gray-500"
                    >
                        <Copy size={18} className="group-hover:text-primary-400 transition-colors" />
                        <span className="font-mono">{copyStatus}</span>
                    </button>
                </div>
            </div>

            {/* World Cities Grid */}
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 px-2">
                    <Globe size={24} className="text-primary-500" /> Global Timezones
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {cities.map((city) => {
                        const dateDiff = getCityDateDiff(city.zone);
                        const diffColor = dateDiff?.startsWith('+') ? 'text-primary-400' : 'text-red-400';
                        
                        return (
                            <div key={city.name} className="group bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-gray-600 transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between h-full">
                                <div>
                                    {/* City Header */}
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="text-lg font-bold text-gray-200 leading-tight">{city.name}</div>
                                            <div className="text-xs font-bold text-primary-500/80 mt-0.5">{city.label}</div>
                                        </div>
                                        <span className="text-xs font-bold bg-gray-700 text-gray-400 px-2 py-1 rounded border border-gray-600">
                                            {city.country}
                                        </span>
                                    </div>
                                    
                                    {/* Time Display */}
                                    <div className="text-3xl font-mono font-bold text-white tracking-tight my-3 pb-2 border-b border-gray-700/50">
                                        {getCityTime(city.zone)}
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div className="flex flex-col gap-1 text-xs font-mono text-gray-400">
                                    <div className="flex justify-between h-4"> {/* 固定高さでレイアウトずれ防止 */}
                                        <span>{city.utc}</span>
                                        {dateDiff && (
                                            <span className={`font-bold ${diffColor} bg-gray-900/50 px-1 rounded`}>
                                                {dateDiff}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{city.jst}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
