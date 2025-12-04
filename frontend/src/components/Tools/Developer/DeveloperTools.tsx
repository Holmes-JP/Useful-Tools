import { Network } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import GeneratorsPanel from './Panels/GeneratorsPanel';
import HashAnalyzerPanel from './Panels/HashAnalyzerPanel';
import WebToolsPanel from './Panels/WebToolsPanel';
import NetworkUtilsPanel from './Panels/NetworkUtilsPanel';

export default function DeveloperTools() {
    const [tab, setTab] = useState<'generators' | 'hash' | 'web' | 'network'>('generators');

    const tabs = [
        { id: 'generators', label: 'Generators' },
        { id: 'hash', label: 'Hash Analyzer' },
        { id: 'web', label: 'Web Tools' },
        { id: 'network', label: 'Network Utils' },
    ];


    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Network className="text-primary-500" />
                    Dev & Network
                </h2>
                <p className="text-gray-500 text-sm">Utilities for Developers and System Admins</p>
            </div>

            <div className="flex justify-center gap-2 md:gap-4 overflow-x-auto pb-2">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id as any)}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap",
                            tab === t.id
                                ? "bg-primary-500 text-black shadow-lg"
                                : "bg-surface text-gray-400 hover:bg-gray-800"
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="max-w-3xl mx-auto">
                {(() => {
                    if (tab === 'generators') return <GeneratorsPanel />;
                    if (tab === 'hash') return <HashAnalyzerPanel />;
                    if (tab === 'web') return <WebToolsPanel />;
                    if (tab === 'network') return <NetworkUtilsPanel />;
                    return <p className="text-gray-400">No tool selected</p>;
                })()}
            </div>
        </div>
    );
}
