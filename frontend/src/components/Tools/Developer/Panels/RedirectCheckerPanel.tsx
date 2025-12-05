import { useMemo, useRef, useState } from "react";
import { ArrowRight, Copy, Link as LinkIcon, RefreshCcw, ShieldCheck, Timer } from "lucide-react";

type Method = "GET" | "HEAD";
type Hop = {
    requestUrl: string;
    status?: number;
    statusText?: string;
    location?: string;
    elapsedMs?: number;
    error?: string;
};

const MAX_REDIRECTS_DEFAULT = 10;

export default function RedirectCheckerPanel() {
    const [url, setUrl] = useState("https://example.com");
    const [method, setMethod] = useState<Method>("GET");
    const [maxRedirects, setMaxRedirects] = useState<number>(MAX_REDIRECTS_DEFAULT);
    const [timeoutSec, setTimeoutSec] = useState<number>(8);
    const [hops, setHops] = useState<Hop[]>([]);
    const [finalUrl, setFinalUrl] = useState("");
    const [finalStatus, setFinalStatus] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    function copy(text: string) {
        if (!text) return;
        navigator.clipboard?.writeText(text);
    }

    async function checkRedirect() {
        const target = url.trim();
        if (!target) {
            setError("URL を入力してください。");
            return;
        }
        setLoading(true);
        setError(null);
        setHops([]);
        setFinalUrl("");
        setFinalStatus("");
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const hopResults: Hop[] = [];
        let currentUrl = target;

        for (let i = 0; i < maxRedirects; i++) {
            const started = performance.now();
            const timer = setTimeout(() => controller.abort(), timeoutSec * 1000);
            try {
                const response = await fetch(currentUrl, {
                    method,
                    redirect: "manual",
                    signal: controller.signal,
                });
                clearTimeout(timer);
                const elapsed = Math.round(performance.now() - started);
                const location = response.headers.get("location") || undefined;
                hopResults.push({
                    requestUrl: currentUrl,
                    status: response.status,
                    statusText: response.statusText,
                    location,
                    elapsedMs: elapsed,
                });

                const isRedirect = response.status >= 300 && response.status < 400 && !!location;
                if (!isRedirect) {
                    setFinalUrl(response.url || currentUrl);
                    setFinalStatus(`${response.status} ${response.statusText || ""}`.trim());
                    break;
                }

                const nextUrl = new URL(location, currentUrl).toString();
                currentUrl = nextUrl;

                if (i === maxRedirects - 1) {
                    setError(`Max redirects (${maxRedirects}) に達しました。リダイレクトループの可能性があります。`);
                }
            } catch (e: any) {
                clearTimeout(timer);
                hopResults.push({
                    requestUrl: currentUrl,
                    error: e?.name === "AbortError" ? "Timeout / Aborted" : e?.message || "Request failed",
                });
                setError(e?.name === "AbortError" ? "タイムアウトまたは中断されました。" : e?.message || "リクエストに失敗しました。");
                break;
            }
        }

        setHops(hopResults);
        setLoading(false);
    }

    function clearAll() {
        setUrl("");
        setHops([]);
        setFinalUrl("");
        setFinalStatus("");
        setError(null);
    }

    const redirectCount = useMemo(() => Math.max(0, hops.length - 1), [hops]);
    const httpsEnforced = useMemo(() => {
        if (hops.length < 1) return false;
        const first = hops[0]?.requestUrl || "";
        return first.startsWith("http://") && finalUrl.startsWith("https://");
    }, [hops, finalUrl]);

    const hostChanged = useMemo(() => {
        if (hops.length < 2) return false;
        const firstHost = (() => {
            try {
                return new URL(hops[0].requestUrl).host;
            } catch {
                return "";
            }
        })();
        const lastHost = (() => {
            try {
                return new URL(finalUrl || hops[hops.length - 1].requestUrl).host;
            } catch {
                return "";
            }
        })();
        return firstHost && lastHost && firstHost !== lastHost;
    }, [hops, finalUrl]);

    const finalStatusCode = useMemo(() => {
        const last = hops[hops.length - 1];
        return last?.status;
    }, [hops]);

    const warningMessage = useMemo(() => {
        if (redirectCount >= 5) return "リダイレクト回数が多いです。チェーンの短縮を検討してください。";
        if (finalStatusCode && finalStatusCode >= 400) return "最終ステータスがエラーです。リンク切れや設定を確認してください。";
        return "";
    }, [redirectCount, finalStatusCode]);

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <LinkIcon size={18} /> Redirect Checker
                    </h4>
                    <p className="text-xs text-gray-400">どこを経由して最終的にどこへ行くかを可視化します。</p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1">ブラウザ fetch を使用します (CORS に依存)</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2 space-y-1">
                    <label className="text-sm text-gray-300">URL</label>
                    <input
                        className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-gray-100"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://example.com"
                    />
                </div>
                <label className="flex flex-col gap-1 text-sm text-gray-300">
                    Method
                    <select className="bg-gray-900 border border-gray-800 rounded p-2 text-white" value={method} onChange={e => setMethod(e.target.value as Method)}>
                        <option value="GET">GET</option>
                        <option value="HEAD">HEAD</option>
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-300">
                    Timeout (sec / hop)
                    <input
                        type="number"
                        min={2}
                        max={30}
                        className="bg-gray-900 border border-gray-800 rounded p-2 text-white"
                        value={timeoutSec}
                        onChange={e => setTimeoutSec(Number(e.target.value))}
                    />
                </label>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                <label className="flex items-center gap-2">
                    Max redirects
                    <input
                        type="number"
                        min={1}
                        max={20}
                        className="w-20 bg-gray-900 border border-gray-800 rounded p-2 text-white"
                        value={maxRedirects}
                        onChange={e => setMaxRedirects(Number(e.target.value))}
                    />
                </label>
            </div>

            <div className="flex gap-2 flex-wrap">
                <button className="px-4 py-2 bg-primary-500 rounded text-black font-semibold disabled:opacity-60" onClick={checkRedirect} disabled={loading}>
                    {loading ? "Checking..." : "Check Redirect"}
                </button>
                <button className="px-3 py-2 bg-gray-800 rounded text-gray-200 hover:bg-gray-700" onClick={() => setUrl("https://example.com")}>
                    Sample
                </button>
                <button className="px-3 py-2 bg-gray-800 rounded text-gray-200 hover:bg-gray-700" onClick={clearAll}>
                    <RefreshCcw size={14} className="inline mr-1" /> Clear
                </button>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded text-sm">{error}</div>}

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">From:</span>
                        <span className="text-primary-400">{hops[0]?.requestUrl || "-"}</span>
                        <ArrowRight size={14} className="text-gray-500" />
                        <span className="text-emerald-400">To: {finalUrl || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Timer size={12} /> Hops: {redirectCount}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        Final: {finalStatus || "-"}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className={`px-3 py-1 rounded-full ${httpsEnforced ? "bg-emerald-500/80 text-black" : "bg-gray-700 text-gray-200"}`}>
                        HTTPS redirect: {httpsEnforced ? "Enabled" : "Not enforced"}
                    </span>
                    <span className={`px-3 py-1 rounded-full ${redirectCount >= 5 ? "bg-amber-400/80 text-black" : "bg-emerald-500/80 text-black"}`}>
                        Redirects: {redirectCount}
                    </span>
                    <span className={`px-3 py-1 rounded-full ${hostChanged ? "bg-amber-400/80 text-black" : "bg-gray-700 text-gray-200"}`}>
                        Host change: {hostChanged ? "Yes" : "No"}
                    </span>
                </div>
                {warningMessage && <div className="text-xs text-amber-300">{warningMessage}</div>}
            </div>

            <div className="space-y-3">
                <h5 className="text-sm text-gray-300 font-semibold">Redirect chain</h5>
                {hops.length === 0 && <p className="text-gray-500 text-sm">結果がまだありません。URL を入力して「Check Redirect」を押してください。</p>}
                {hops.map((hop, idx) => (
                    <div key={idx} className="border border-gray-800 rounded-lg p-3 bg-gray-950 space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>#{idx + 1}</span>
                            {hop.elapsedMs !== undefined && (
                                <span className="flex items-center gap-1 text-gray-400">
                                    <Timer size={12} /> {hop.elapsedMs} ms
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-primary-400 break-all">Request: {hop.requestUrl}</div>
                        {hop.error ? (
                            <div className="text-xs text-red-300">Error: {hop.error}</div>
                        ) : (
                            <>
                                <div className="text-sm text-gray-100">
                                    Response: {hop.status} {hop.statusText}
                                </div>
                                <div className="text-sm text-gray-300">
                                    Location: {hop.location || <span className="text-gray-500">None</span>}
                                </div>
                            </>
                        )}
                        <div className="flex gap-2 flex-wrap text-xs">
                            <button
                                className="px-2 py-1 bg-gray-800 rounded text-gray-200 border border-gray-700 hover:border-primary-500/60"
                                onClick={() => copy(hop.requestUrl)}
                            >
                                <Copy size={12} className="inline mr-1" /> Copy URL
                            </button>
                            <button
                                className="px-2 py-1 bg-gray-800 rounded text-gray-200 border border-gray-700 hover:border-primary-500/60"
                                onClick={() => window.open(`/web-tools/headers?url=${encodeURIComponent(hop.requestUrl)}`, "_blank")}
                            >
                                <ShieldCheck size={12} className="inline mr-1" /> View headers
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
