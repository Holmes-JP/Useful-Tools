import { useState } from 'react';
import { CalendarDays } from 'lucide-react';

export default function JapaneseCalendar() {
    const [year, setYear] = useState<number>(new Date().getFullYear());

    // 和暦データ
    const eras = [
        { name: '令和', start: 2019 },
        { name: '平成', start: 1989 },
        { name: '昭和', start: 1926 },
        { name: '大正', start: 1912 },
        { name: '明治', start: 1868 },
    ];

    const getJapaneseYear = (y: number) => {
        const era = eras.find(e => y >= e.start);
        if (!era) return '明治以前';
        const eraYear = y - era.start + 1;
        return `${era.name} ${eraYear === 1 ? '元' : eraYear}年`;
    };

    const getEto = (y: number) => {
        const etoList = ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未'];
        return etoList[y % 12];
    };

    const getAge = (y: number) => {
        const currentYear = new Date().getFullYear();
        const age = currentYear - y;
        return age >= 0 ? `${age}歳` : '生まれる前';
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-surface border border-gray-700 p-6 rounded-xl">
                <h3 className="text-primary-400 font-bold mb-6 flex items-center gap-2">
                    <CalendarDays size={20} /> 西暦 ⇔ 和暦 変換
                </h3>

                <div className="flex items-center justify-center gap-4 mb-8">
                    <input 
                        type="number" 
                        value={year} 
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-32 bg-gray-900 border border-gray-600 rounded p-3 text-white text-center text-xl font-bold"
                    />
                    <span className="text-gray-400">年 (西暦)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center">
                        <p className="text-xs text-gray-500 mb-1">和暦 (Japanese Era)</p>
                        <p className="text-2xl font-bold text-white">{getJapaneseYear(year)}</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center">
                        <p className="text-xs text-gray-500 mb-1">干支 (Zodiac)</p>
                        <p className="text-2xl font-bold text-white">{getEto(year)}</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center">
                        <p className="text-xs text-gray-500 mb-1">今年で (Age)</p>
                        <p className="text-2xl font-bold text-white">{getAge(year)}</p>
                    </div>
                </div>

                {/* 早見表 (簡易) */}
                <div className="mt-8">
                    <h4 className="text-sm text-gray-400 font-bold mb-3">直近の早見表</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm text-center">
                        {[0, 1, 2, 3, 4, 5].map(i => {
                            const y = new Date().getFullYear() - i;
                            return (
                                <div key={y} className="bg-gray-800 p-2 rounded border border-gray-700">
                                    <div className="text-white font-bold">{y}</div>
                                    <div className="text-primary-400 text-xs">{getJapaneseYear(y)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
