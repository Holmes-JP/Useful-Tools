import { useState } from 'react';
import { Clock, Calendar, Calculator, Briefcase } from 'lucide-react';
import clsx from 'clsx';

// Views
import WorldClock from './Views/WorldClock';
import JapaneseCalendar from './Views/JapaneseCalendar';
import DDayCounter from './Views/DDayCounter';
import BusinessDays from './Views/BusinessDays';

export default function TimeTools() {
    const [activeTab, setActiveTab] = useState<'clock' | 'calendar' | 'dday' | 'business'>('clock');

    const tabs = [
        { id: 'clock', label: 'World Clock', icon: Clock },
        { id: 'calendar', label: 'Japan Calendar', icon: Calendar },
        { id: 'dday', label: 'Date Calculator', icon: Calculator },
        { id: 'business', label: 'Business Days', icon: Briefcase },
    ];

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Time Tools</h2>
                <p className="text-gray-400 mt-2">Clock, Calendar, and Date utilities</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-200",
                                isActive 
                                    ? "bg-primary-500 text-black shadow-lg shadow-primary-500/20 scale-105" 
                                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                            )}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'clock' && <WorldClock />}
                {activeTab === 'calendar' && <JapaneseCalendar />}
                {activeTab === 'dday' && <DDayCounter />}
                {activeTab === 'business' && <BusinessDays />}
            </div>
        </div>
    );
}
