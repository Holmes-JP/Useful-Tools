import React, { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, parseISO } from 'date-fns';
import { CalendarHeart, Plus, Trash2 } from 'lucide-react';

type Event = {
    id: number;
    title: string;
    date: string;
};

export default function DDayCounter() {
    const [events, setEvents] = useState<Event[]>(() => {
        const saved = localStorage.getItem('dday_events');
        return saved ? JSON.parse(saved) : [
            { id: 1, title: '2025 New Year', date: '2025-01-01' }
        ];
    });

    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');

    useEffect(() => {
        localStorage.setItem('dday_events', JSON.stringify(events));
    }, [events]);

    const addEvent = () => {
        if (!newTitle || !newDate) return;
        setEvents([...events, { id: Date.now(), title: newTitle, date: newDate }]);
        setNewTitle('');
        setNewDate('');
    };

    const removeEvent = (id: number) => {
        setEvents(events.filter(e => e.id !== id));
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-surface border border-gray-700 p-6 rounded-xl">
                <h3 className="text-primary-400 font-bold mb-4 flex items-center gap-2">
                    <CalendarHeart size={20} /> Anniversary & Countdown
                </h3>
                
                {/* 入力フォーム */}
                <div className="flex flex-col md:flex-row gap-2 mb-6">
                    <input 
                        type="text" 
                        value={newTitle} 
                        onChange={e => setNewTitle(e.target.value)} 
                        placeholder="Event Name (e.g. Birthday)"
                        className="flex-1 bg-gray-900 border border-gray-600 rounded p-2 text-white"
                    />
                    <input 
                        type="date" 
                        value={newDate} 
                        onChange={e => setNewDate(e.target.value)} 
                        className="bg-gray-900 border border-gray-600 rounded p-2 text-white"
                    />
                    <button onClick={addEvent} className="bg-primary-500 text-black font-bold px-4 py-2 rounded hover:bg-primary-400 flex items-center gap-1">
                        <Plus size={16} /> Add
                    </button>
                </div>

                {/* リスト */}
                <div className="space-y-3">
                    {events.length === 0 && <p className="text-gray-500 text-center text-sm">No events added.</p>}
                    
                    {events.map(event => {
                        const today = new Date();
                        const target = parseISO(event.date);
                        const diff = differenceInDays(target, today);
                        
                        let statusColor = "text-white";
                        let statusText = "";
                        
                        if (diff > 0) {
                            statusText = `あと ${diff} 日`;
                            statusColor = "text-primary-400";
                        } else if (diff === 0) {
                            statusText = "★ 本日 ★";
                            statusColor = "text-yellow-400 animate-pulse";
                        } else {
                            statusText = `${Math.abs(diff)} 日経過`;
                            statusColor = "text-gray-400";
                        }

                        return (
                            <div key={event.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-gray-200">{event.title}</p>
                                    <p className="text-xs text-gray-500">{event.date}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xl font-bold font-mono ${statusColor}`}>{statusText}</span>
                                    <button onClick={() => removeEvent(event.id)} className="text-gray-600 hover:text-red-400">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
