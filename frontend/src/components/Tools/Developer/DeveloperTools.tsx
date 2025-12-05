import { Fingerprint, Globe2, Hash, KeyRound, Lock, Network, Router, ShieldCheck, Sparkles } from "lucide-react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import GeneratorsPanel from "./Panels/GeneratorsPanel";
import HashAnalyzerPanel from "./Panels/HashAnalyzerPanel";
import NetworkUtilsPanel from "./Panels/NetworkUtilsPanel";
import WebToolsPanel from "./Panels/WebToolsPanel";

type ChildTool = {
    slug: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    element: React.ReactNode;
};

type ToolCard = {
    slug: string;
    label: string;
    description: string;
    color: string;
    icon: React.ReactNode;
    children: ChildTool[];
};

const tools: ToolCard[] = [
    {
        slug: "generators",
        label: "Generators",
        description: "UUID, passwords, RSA keys, hash tools",
        color: "bg-sky-500 text-black hover:bg-sky-400",
        icon: <Sparkles size={18} />,
        children: [
            { slug: "uuid", label: "UUID", description: "Generate multiple UUIDs", icon: <Fingerprint size={16} />, element: <GeneratorsPanel view="uuid" /> },
            { slug: "passwords", label: "Passwords", description: "Strong password generator", icon: <Lock size={16} />, element: <GeneratorsPanel view="password" /> },
            { slug: "hash", label: "Hash", description: "Hash text or files", icon: <Hash size={16} />, element: <GeneratorsPanel view="hash" /> },
            { slug: "keys", label: "RSA Keys", description: "Generate RSA key pairs", icon: <KeyRound size={16} />, element: <GeneratorsPanel view="keys" /> },
        ],
    },
    {
        slug: "analyzer",
        label: "Analyzer",
        description: "Dictionary attack and hash analysis",
        color: "bg-rose-400 text-black hover:bg-rose-300",
        icon: <ShieldCheck size={18} />,
        children: [
            { slug: "hashanalyzer", label: "Hash Analyzer", description: "Dictionary attack for hashes", icon: <ShieldCheck size={16} />, element: <HashAnalyzerPanel /> },
        ],
    },
    {
        slug: "web",
        label: "Web Tools",
        description: "Headers, redirects, and HTTP helpers",
        color: "bg-emerald-500 text-black hover:bg-emerald-400",
        icon: <Globe2 size={18} />,
        children: [
            { slug: "webtools", label: "Web Tools", description: "Inspect and debug web endpoints", icon: <Globe2 size={16} />, element: <WebToolsPanel /> },
        ],
    },
    {
        slug: "network",
        label: "Network Utils",
        description: "CIDR, QR, hashes, quick utilities",
        color: "bg-amber-400 text-black hover:bg-amber-300",
        icon: <Router size={18} />,
        children: [
            { slug: "networkutils", label: "Network Utils", description: "Subnet calculator, QR, hashes", icon: <Router size={16} />, element: <NetworkUtilsPanel /> },
        ],
    },
];

export default function DeveloperTools() {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <Hero />
            <Routes>
                <Route path="" element={<Menu />} />
                <Route path="/" element={<Menu />} />
                <Route path=":section" element={<ToolRouter />} />
                <Route path=":section/:child" element={<ToolRouter />} />
                <Route path="*" element={<Navigate to="/dev" replace />} />
            </Routes>
        </div>
    );
}

function Hero() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-800 p-6">
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(88,255,150,0.06), transparent 25%), radial-gradient(circle at 80% 30%, rgba(82,186,255,0.08), transparent 25%)" }} />
            <div className="relative flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary-500/20 border border-primary-500/40 text-primary-400">
                        <Network size={30} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white">Dev & Network</h2>
                        <p className="text-gray-300 text-sm">Utilities for Developers and System Admins</p>
                    </div>
                </div>
                <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1">
                    Quick-launch cards {"→"} dedicated URLs
                </div>
            </div>
        </div>
    );
}

function Menu() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tools.map(tool => (
                <Link
                    key={tool.slug}
                    to={`/dev/${tool.slug}`}
                    className="group block rounded-xl border border-gray-800 bg-gray-900/60 p-4 hover:border-primary-500/60 hover:-translate-y-1 transition-all shadow-sm"
                >
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${tool.color}`}>
                        {tool.icon}
                        {tool.label}
                    </div>
                    <p className="mt-3 text-gray-300 text-sm leading-relaxed">{tool.description}</p>
                </Link>
            ))}
        </div>
    );
}

function ToolRouter() {
    const { section, child } = useParams();
    const sectionKey = (section || "").toLowerCase();
    const childKey = (child || "").toLowerCase();
    if (sectionKey === "hash") return <Navigate to="/dev/analyzer" replace />;
    const target = tools.find(t => t.slug === sectionKey);
    if (!target) return <Navigate to="/dev" replace />;
    return <ToolShell tool={target} childSlug={childKey} />;
}

function ToolShell({ tool, childSlug }: { tool: ToolCard; childSlug?: string }) {
    const activeChild = tool.children.find(c => c.slug === childSlug);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Dev & Network / {tool.label}</div>
                    <h3 className="text-2xl font-bold text-white">{tool.label}</h3>
                    <p className="text-gray-400 text-sm">{tool.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {tool.children.map(child => {
                    const isActive = child.slug === childSlug;
                    return (
                        <Link
                            key={child.slug}
                            to={`/dev/${tool.slug}/${child.slug}`}
                            className={`group rounded-xl border p-4 transition-all max-w-xs ${
                                isActive
                                    ? "border-primary-500/80 bg-gray-900"
                                    : "border-gray-800 bg-gray-900/60 hover:border-primary-500/60 hover:-translate-y-1"
                            }`}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-gray-800 text-gray-100 group-hover:bg-primary-500/20">
                                {child.icon}
                                {child.label}
                            </div>
                            <p className="mt-3 text-sm text-gray-300 leading-relaxed">{child.description}</p>
                        </Link>
                    );
                })}
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                {activeChild ? activeChild.element : <p className="text-gray-400 text-sm">Select a {tool.label} tool to get started.</p>}
            </div>
        </div>
    );
}
