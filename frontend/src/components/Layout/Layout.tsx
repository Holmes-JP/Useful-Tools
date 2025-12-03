import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Wand2, ShieldCheck, MessageSquarePlus, Menu, X,
    Clock, Calculator, Cast, Image as ImageIcon, Network,
    Archive, FileText, Video, Music, FileStack // 修正: FileStackを追加
} from 'lucide-react';
import clsx from 'clsx';

export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { path: '/', label: 'Universal Converter', icon: Wand2 },
        { path: '/doc', label: 'Document Studio', icon: FileStack },
        { path: '/video', label: 'Video Studio', icon: Video },
        { path: '/audio', label: 'Audio Lab', icon: Music },
        { path: '/file', label: 'File Master', icon: Archive },
        { path: '/text', label: 'Text & Code', icon: FileText },
        { path: '/time', label: 'Time Tools', icon: Clock },
        { path: '/calc', label: 'Calculator', icon: Calculator },
        { path: '/editor', label: 'Image Editor', icon: ImageIcon },
        { path: '/dev', label: 'Dev & Network', icon: Network },
        { path: '/streamer', label: 'Streamer Tools', icon: Cast },
        { path: '/privacy', label: 'Privacy & Security', icon: ShieldCheck },
        { path: '/feedback', label: 'Request & Feedback', icon: MessageSquarePlus },
    ];

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen flex font-sans">
            <button onClick={toggleSidebar} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-md shadow-md border border-gray-700">
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <aside className={clsx("fixed inset-y-0 left-0 z-40 w-64 bg-black/50 backdrop-blur-xl border-r border-white/10 transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2"><Wand2 className="text-primary-400" /><span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Useful Tools</span></h1>
                    <p className="text-xs text-gray-500 mt-2 font-mono">Serverless & Secure</p>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={clsx("flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200", isActive ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" : "text-gray-400 hover:text-white hover:bg-white/5")}>
                                <Icon size={20} /><span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen relative">
                <div className="absolute top-0 left-0 w-full h-96 bg-primary-500/5 blur-3xl -z-10 pointer-events-none rounded-full translate-y-[-50%]" />
                <div className="max-w-5xl mx-auto pt-10 lg:pt-0 pb-20">{children}</div>
            </main>
            {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden" />}
        </div>
    );
}
