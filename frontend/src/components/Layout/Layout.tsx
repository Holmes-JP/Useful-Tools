import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Wand2, 
    ShieldCheck, 
    MessageSquarePlus, 
    Menu, 
    X 
} from 'lucide-react';
import clsx from 'clsx';
// import { Activity } from 'lucide-react';
import { Clock } from 'lucide-react';
import { Calculator } from 'lucide-react';
import { Cast } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // ナビゲーション項目定義
    const navItems = [
        { path: '/', label: 'Universal Tool', icon: Wand2 },
        { path: '/time', label: 'Time Tools', icon: Clock },
        // { path: '/system', label: 'System Info', icon: Activity },
        { path: '/editor', label: 'Image Editor', icon: ImageIcon },
        { path: '/privacy', label: 'Privacy & Security', icon: ShieldCheck },
        { path: '/feedback', label: 'Request & Feedback', icon: MessageSquarePlus },
        { path: '/calc', label: 'Calculator', icon: Calculator },
        { path: '/streamer', label: 'Streamer Tools', icon: Cast },
    ];

    return (
        <div className="min-h-screen flex font-sans selection:bg-primary-500/30 selection:text-primary-200">
            
            {/* モバイル用メニューボタン (ダークモード対応) */}
            <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface/80 backdrop-blur-md border border-white/10 rounded-md text-gray-300 shadow-lg"
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* サイドバー */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-40 w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* ロゴエリア */}
                <div className="p-8">
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary-500/10 rounded-lg">
                            <Wand2 className="text-primary-400" size={24} />
                        </div>
                        <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Useful Tools
                        </span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-3 font-mono pl-1">
                        v1.0.0 • Serverless
                    </p>
                </div>

                {/* ナビゲーション */}
                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={clsx(
                                    "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden",
                                    isActive 
                                        // アクティブ時: ライムグリーンの淡い光沢とボーダー
                                        ? "text-primary-400 bg-primary-500/5 border border-primary-500/10 shadow-[0_0_15px_rgba(132,204,22,0.1)]" 
                                        // 非アクティブ時: シンプルに
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {/* アクティブ時の左端アクセントバー */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
                                )}

                                <Icon size={20} className={clsx(
                                    "transition-transform group-hover:scale-110",
                                    isActive ? "text-primary-400" : "text-gray-500 group-hover:text-gray-300"
                                )} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* フッターエリア (コピーライトのみシンプルに) */}
                <div className="p-6 text-xs text-gray-600 text-center border-t border-white/5">
                    &copy; 2025 Useful Hub
                </div>
            </aside>

            {/* メインコンテンツエリア */}
            <main className="flex-1 relative overflow-hidden">
                {/* 背景装飾: ライムグリーンの環境光 (右上に配置) */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 blur-[100px] -z-10 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                
                {/* コンテンツラッパー */}
                <div className="h-screen overflow-y-auto p-4 lg:p-10 scroll-smooth">
                    <div className="max-w-5xl mx-auto pt-12 lg:pt-0 pb-20">
                        {children}
                    </div>
                </div>
            </main>

            {/* モバイル用オーバーレイ */}
            {isSidebarOpen && (
                <div 
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                />
            )}
        </div>
    );
}