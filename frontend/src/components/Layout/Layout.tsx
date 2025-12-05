import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Wand2, ShieldCheck, MessageSquarePlus, Menu, X,
    Clock, Calculator, Image as ImageIcon, Network,
    Archive, FileText, Video, Music, Monitor, Settings, Sparkles, Globe2
} from 'lucide-react';
import clsx from 'clsx';

export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { path: '/', label: 'Universal Converter', icon: Wand2 },
        { path: '/video', label: 'Video Studio', icon: Video },
        { path: '/audioeditor', label: 'Audio Editor', icon: Music },
        { path: '/editor', label: 'Image Editor', icon: ImageIcon },
        { path: '/file', label: 'File Master', icon: Archive },
        { path: '/text', label: 'Text & Code', icon: FileText },
        { path: '/time', label: 'Time Tools', icon: Clock },
        { path: '/calc', label: 'Calculator', icon: Calculator },
        { path: '/generators', label: 'Generators', icon: Sparkles },
        { path: '/analyzers', label: 'Analyzers', icon: ShieldCheck },
        { path: '/web-tools', label: 'Web Tools', icon: Globe2 },
        { path: '/network-tools', label: 'Network Tools', icon: Network },
        { path: '/sys', label: 'System Info', icon: Monitor },
        { path: '/privacy', label: 'Privacy & Security', icon: ShieldCheck },
        { path: '/feedback', label: 'Request & Feedback', icon: MessageSquarePlus },
        { path: '/settings', label: 'Global Settings', icon: Settings },
    ];

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <div className="relative min-h-screen flex font-sans text-white overflow-hidden">
            <button onClick={toggleSidebar} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-md shadow-md border border-gray-700">
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <aside className={clsx("fixed inset-y-0 left-0 z-40 w-64 bg-black/50 backdrop-blur-xl border-r border-white/10 transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2"><Wand2 className="text-primary-400" /><span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Useful Tools</span></h1>
                    <p className="text-xs text-gray-500 mt-2 font-mono">Serverless & Secure</p>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.path === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(item.path);
                        return (
                            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={clsx("flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200", isActive ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" : "text-gray-400 hover:text-white hover:bg-white/5")}>
                                <Icon size={20} /><span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className="flex-1 p-3 sm:p-5 lg:p-8 relative bg-[#050712] text-slate-100">
                <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_15%_25%,rgba(14,165,233,0.14)_0,transparent_32%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.12)_0,transparent_30%),radial-gradient(circle_at_20%_85%,rgba(52,211,153,0.12)_0,transparent_36%),radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.12)_0,transparent_32%)] blur-3xl -z-10 pointer-events-none" />
                <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 pt-6 lg:pt-2 pb-16">{children}</div>
            </main>
            {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden" />}
        </div>
    );
}
