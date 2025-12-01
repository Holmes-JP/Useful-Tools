import React, { useState } from 'react';
import { Archive } from 'lucide-react';
import clsx from 'clsx';
import ArchiverView from './Views/ArchiverView';

export default function FileTools() {
    // PDF Kit は削除されたため、タブ管理も不要になりArchiverViewを直接表示でも良いが
    // 将来の拡張性のため構造は残す
    const [tab, setTab] = useState<'zip'>('zip');

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Archive className="text-primary-500" /> File Master
                </h2>
                <p className="text-gray-500 text-sm">Advanced Zip Archiver</p>
            </div>

            {/* タブが1つだけになったのでナビゲーションは一旦隠すか、タイトルのみ表示 */}
            {/* <div className="flex justify-center gap-2 md:gap-4 overflow-x-auto pb-2">
                <button onClick={() => setTab('zip')} className={clsx("flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all", tab === 'zip' ? "bg-primary-500 text-black shadow-lg" : "bg-surface text-gray-400 hover:bg-gray-800")}>
                    <Archive size={18} /> Archiver (Zip)
                </button>
            </div>
            */}

            <div className="min-h-[400px]">
                <ArchiverView />
            </div>
        </div>
    );
}
