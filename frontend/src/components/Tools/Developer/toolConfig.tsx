import { Fingerprint, Globe2, Hash, KeyRound, Lock, Router, ShieldCheck, Sparkles } from "lucide-react";
import GeneratorsPanel from "./Panels/GeneratorsPanel";
import HashAnalyzerPanel from "./Panels/HashAnalyzerPanel";
import NetworkUtilsPanel from "./Panels/NetworkUtilsPanel";
import WebToolsPanel from "./Panels/WebToolsPanel";

export type ChildTool = {
    slug: string;
    label: string;
    description: string;
    icon: JSX.Element;
    element: JSX.Element;
};

export type ToolCard = {
    slug: string;
    label: string;
    description: string;
    color: string;
    icon: JSX.Element;
    children: ChildTool[];
};

export const toolCards: Record<string, ToolCard> = {
    generators: {
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
    analyzers: {
        slug: "analyzers",
        label: "Analyzers",
        description: "Dictionary attack and hash analysis",
        color: "bg-rose-400 text-black hover:bg-rose-300",
        icon: <ShieldCheck size={18} />,
        children: [
            { slug: "hashanalyzer", label: "Hash Analyzer", description: "Dictionary attack for hashes", icon: <ShieldCheck size={16} />, element: <HashAnalyzerPanel /> },
        ],
    },
    "web-tools": {
        slug: "web-tools",
        label: "Web Tools",
        description: "Headers, redirects, and HTTP helpers",
        color: "bg-emerald-500 text-black hover:bg-emerald-400",
        icon: <Globe2 size={18} />,
        children: [
            { slug: "webtools", label: "Web Tools", description: "Inspect and debug web endpoints", icon: <Globe2 size={16} />, element: <WebToolsPanel /> },
        ],
    },
    "network-tools": {
        slug: "network-tools",
        label: "Network Tools",
        description: "CIDR, QR, hashes, quick utilities",
        color: "bg-amber-400 text-black hover:bg-amber-300",
        icon: <Router size={18} />,
        children: [
            { slug: "networkutils", label: "Network Utils", description: "Subnet calculator, QR, hashes", icon: <Router size={16} />, element: <NetworkUtilsPanel /> },
        ],
    },
};
