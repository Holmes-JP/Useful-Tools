import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Wand2, 
    ShieldCheck, 
    Settings, 
    Menu, 
    X, 
    Github,
    MessageSquarePlus // 追加
} from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';





export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { path: '/', label: 'Universal Tool', icon: Wand2 },
        { path: '/privacy', label: 'Privacy & Security', icon: ShieldCheck },
        { path: '/settings', label: 'Global Settings', icon: Settings },
        { path: '/feedback', label: 'Request Feature', icon: MessageSquarePlus }, // 追加
    ];

    

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans text-gray-800">
            
            {/* モバイル用メニューボタン */}
            <button 
                onClick={toggleSidebar}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* サイドバー */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-300 transition-transform duration-300 transform lg:translate-x-0 lg:static flex flex-col",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Wand2 className="text-blue-500" />
                        Useful Tools
                    </h1>
                    <p className="text-xs text-gray-500 mt-2">Serverless & Secure</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)} // モバイルなら閉じる
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive 
                                        ? "bg-blue-600 text-white shadow-lg" 
                                        : "hover:bg-gray-800 hover:text-white"
                                )}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <a 
                        href="https://github.com/Holmes-JP" 
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
                    >
                        <Github size={16} />
                        <span>Created by Holmes-JP</span>
                    </a>
                </div>
            </aside>

            {/* メインコンテンツエリア */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-5xl mx-auto pt-10 lg:pt-0">
                    {children}
                </div>
            </main>

            {/* モバイル用オーバーレイ */}
            {isSidebarOpen && (
                <div 
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                />
            )}
        </div>
    );
}