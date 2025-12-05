import { useMemo, useState } from 'react';
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    isToday,
    isWeekend,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import JapaneseHolidays from 'japanese-holidays';
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import clsx from 'clsx';

type HolidayEntry = {
    name: string;
    date: Date;
};

export default function CalendarWithHolidays() {
    const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const weeks = useMemo(() => {
        const start = startOfWeek(monthStart, { weekStartsOn: 0 });
        const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end });
    }, [monthStart, monthEnd]);

    const holidayMap = useMemo(() => {
        const years = [
            currentMonth.getFullYear() - 1,
            currentMonth.getFullYear(),
            currentMonth.getFullYear() + 1,
        ];
        const map = new Map<string, string>();

        years.forEach((year) => {
            JapaneseHolidays.getHolidaysOf(year).forEach((holiday) => {
                const date = new Date(year, holiday.month - 1, holiday.date);
                map.set(format(date, 'yyyy-MM-dd'), holiday.name);
            });
        });

        return map;
    }, [currentMonth]);

    const monthHolidays: HolidayEntry[] = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        return JapaneseHolidays.getHolidaysOf(year)
            .filter((holiday) => holiday.month === month)
            .map((holiday) => ({
                name: holiday.name,
                date: new Date(year, holiday.month - 1, holiday.date),
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [currentMonth]);

    const upcomingHolidays: HolidayEntry[] = useMemo(() => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const collect = (year: number) =>
            JapaneseHolidays.getHolidaysOf(year).map((holiday) => ({
                name: holiday.name,
                date: new Date(year, holiday.month - 1, holiday.date),
            }));

        return [...collect(today.getFullYear()), ...collect(today.getFullYear() + 1)]
            .filter((holiday) => holiday.date >= todayStart)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 4);
    }, []);

    const handlePrev = () => setCurrentMonth((prev) => addMonths(prev, -1));
    const handleNext = () => setCurrentMonth((prev) => addMonths(prev, 1));
    const handleToday = () => setCurrentMonth(startOfMonth(new Date()));

    const dayLabel = (date: Date) => format(date, 'd');
    const weekdayLabel = (date: Date) => format(date, 'EEE', { locale: ja });
    const holidayFor = (date: Date) => holidayMap.get(format(date, 'yyyy-MM-dd'));

    const legend = [
        { color: 'bg-primary-500/60 border-primary-500', label: '祝日' },
        { color: 'bg-emerald-500/50 border-emerald-500', label: '今日' },
        { color: 'bg-rose-400/50 border-rose-400', label: '週末' },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 bg-surface border border-gray-700 p-6 rounded-2xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-500/10 border border-primary-500/40 rounded-xl">
                                <CalendarDays className="text-primary-400" size={22} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-gray-400">Calendar</p>
                                <p className="text-2xl font-bold text-white">
                                    {format(currentMonth, 'yyyy年 M月', { locale: ja })}
                                </p>
                                <p className="text-sm text-gray-400">
                                    祝日と週末をハイライトした月間カレンダー
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrev}
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-800 border border-gray-700 hover:border-gray-600 hover:bg-gray-700 transition-colors"
                                aria-label="前の月"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={handleToday}
                                className="px-4 h-10 rounded-full border border-primary-500/60 text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 font-bold transition-colors"
                            >
                                今日
                            </button>
                            <button
                                onClick={handleNext}
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-800 border border-gray-700 hover:border-gray-600 hover:bg-gray-700 transition-colors"
                                aria-label="次の月"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center gap-3 text-xs text-gray-400">
                        {legend.map((item) => (
                            <div key={item.label} className="flex items-center gap-2">
                                <span className={clsx('h-3 w-3 rounded-full border', item.color)} />
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 grid grid-cols-7 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                            <div key={day} className="py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {weeks.map((date) => {
                            const holidayName = holidayFor(date);
                            const isCurrent = isSameMonth(date, monthStart);
                            const weekend = isWeekend(date);
                            const today = isToday(date);

                            return (
                                <div
                                    key={date.toISOString()}
                                    className={clsx(
                                        'rounded-xl border p-3 min-h-[96px] flex flex-col gap-1 transition-all',
                                        isCurrent ? 'bg-gray-900' : 'bg-gray-900/40 text-gray-500',
                                        holidayName
                                            ? 'border-primary-500/60 shadow shadow-primary-500/10'
                                            : 'border-gray-800',
                                        today && 'ring-1 ring-primary-400 ring-offset-2 ring-offset-gray-900',
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <span
                                            className={clsx(
                                                'text-xl font-bold leading-none',
                                                holidayName
                                                    ? 'text-primary-300'
                                                    : weekend
                                                        ? 'text-rose-200'
                                                        : isCurrent
                                                            ? 'text-white'
                                                            : 'text-gray-500',
                                            )}
                                        >
                                            {dayLabel(date)}
                                        </span>
                                        <div className="flex gap-1">
                                            {today && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 font-bold">
                                                    今日
                                                </span>
                                            )}
                                            {holidayName && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-200 border border-primary-500/50 font-bold">
                                                    祝日
                                                </span>
                                            )}
                                            {!holidayName && weekend && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-200 border border-rose-400/60 font-bold">
                                                    週末
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <span>{weekdayLabel(date)}</span>
                                    </div>
                                    {holidayName && (
                                        <p className="text-xs text-primary-100 font-semibold leading-tight">
                                            {holidayName}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 h-full">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={18} className="text-primary-400" />
                            <h4 className="text-white font-bold">今月の祝日</h4>
                        </div>
                        {monthHolidays.length === 0 ? (
                            <p className="text-sm text-gray-500">今月の祝日はありません。</p>
                        ) : (
                            <div className="space-y-2">
                                {monthHolidays.map((holiday) => (
                                    <div
                                        key={holiday.date.toISOString()}
                                        className="flex items-center justify-between bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-white font-semibold">{holiday.name}</span>
                                            <span className="text-xs text-gray-400">
                                                {format(holiday.date, 'M月d日 (EEE)', { locale: ja })}
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold text-primary-300 bg-primary-500/10 border border-primary-500/40 px-2 py-1 rounded-full">
                                            祝日
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={18} className="text-amber-300" />
                            <h4 className="text-white font-bold">次の祝日メモ</h4>
                        </div>
                        <div className="space-y-2">
                            {upcomingHolidays.map((holiday) => (
                                <div
                                    key={`${holiday.name}-${holiday.date.toISOString()}`}
                                    className="flex items-center justify-between bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-white font-semibold">{holiday.name}</span>
                                        <span className="text-xs text-gray-400">
                                            {format(holiday.date, 'yyyy年M月d日 (EEE)', { locale: ja })}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {format(holiday.date, 'MMM', { locale: ja })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
