import { Network } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import type { ToolCard } from "./toolConfig";

export default function ToolSectionPage({ tool, basePath }: { tool: ToolCard; basePath: string }) {
    const location = useLocation();

    const childKey = (() => {
        const cleaned = location.pathname.startsWith(basePath)
            ? location.pathname.slice(basePath.length)
            : "";
        const segment = cleaned.replace(/^\/+/, "").split("/")[0];
        return (segment || "").toLowerCase();
    })();

    const activeChild = tool.children.find(c => c.slug === childKey) || tool.children[0];

    if (!tool) return <Navigate to="/" replace />;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-800 p-6">
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(88,255,150,0.06), transparent 25%), radial-gradient(circle at 80% 30%, rgba(82,186,255,0.08), transparent 25%)" }} />
                <div className="relative flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary-500/20 border border-primary-500/40 text-primary-400">
                            <Network size={30} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white">{tool.label}</h2>
                            <p className="text-gray-300 text-sm">{tool.description}</p>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1">
                        Open a tool to start
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {tool.children.map(child => {
                    const isActive = child.slug === activeChild?.slug;
                    return (
                        <Link
                            key={child.slug}
                            to={`${basePath}/${child.slug}`}
                            className={`group rounded-xl border p-4 transition-all ${
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
                            <p className="mt-4 text-primary-400 text-xs inline-flex items-center gap-1">
                                Open {basePath}/{child.slug}
                            </p>
                        </Link>
                    );
                })}
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                {activeChild ? activeChild.element : <p className="text-gray-400 text-sm">Select a tool to get started.</p>}
            </div>
        </div>
    );
}
