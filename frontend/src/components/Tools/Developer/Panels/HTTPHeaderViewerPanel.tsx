import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, RefreshCcw, Shield, Timer, Link as LinkIcon, History } from "lucide-react";

type Method = "GET" | "HEAD";
type Tab = "headers" | "security" | "cookies" | "raw";

type HeaderItem = { name: string; value: string };
type CookieItem = {
    name: string;
    value: string;
    attributes: Record<string, string | boolean>;
};

type SecurityStatus = "ok" | "warn" | "missing";

const SECURITY_KEYS: Record<string, string> = {
    "strict-transport-security": "HSTS",
    "content-security-policy": "CSP",
    "x-frame-options": "Clickjacking",
    "x-content-type-options": "MIME sniffing",
    "referrer-policy": "Referrer",
    "permissions-policy": "Permissions",
    "x-xss-protection": "Legacy XSS",
};

const HISTORY_LIMIT = 5;

export default function HTTPHeaderViewerPanel() {
    const [url, setUrl] = useState("https://example.com");
    const [method, setMethod] = useState<Method>("GET");
    const [followRedirects, setFollowRedirects] = useState(true);
    const [timeoutSec, setTimeoutSec] = useState(8);
    const [showRedirectChain, setShowRedirectChain] = useState(true);

    const [statusLine, setStatusLine] = useState("");
    const [statusColor, setStatusColor] = useState<"green" | "yellow" | "red" | "gray">("gray");
    const [finalUrl, setFinalUrl] = useState("");
    const [httpVersion, setHttpVersion] = useState<string | null>(null);
    const [durationMs, setDurationMs] = useState<number | null>(null);
    const [headers, setHeaders] = useState<HeaderItem[]>([]);
    const [raw, setRaw] = useState("");
    const [cookies, setCookies] = useState<CookieItem[]>([]);
    const [redirects, setRedirects] = useState<Array<{ url: string; status: number; location?: string }>>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>("headers");
    const [filter, setFilter] = useState("");
    const [history, setHistory] = useState<string[]>([]);

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (history.length === 0) {
            setHistory([url]);
        }
    }, []);

    function statusToColor(code: number) {
        if (code >= 200 && code < 300) return "green";
        if (code >= 300 && code < 400) return "yellow";
        return "red";
    }

    function parseCookies(headerValues: string[]): CookieItem[] {
        return headerValues.map(rawCookie => {
            const parts = rawCookie.split(";").map(p => p.trim());
            const [nameValue, ...attrs] = parts;
            const [name, ...valueParts] = nameValue.split("=");
            const value = valueParts.join("=") || "";
            const attributes: Record<string, string | boolean> = {};
            attrs.forEach(attr => {
                const [k, ...vParts] = attr.split("=");
                const key = k.toLowerCase();
                const v = vParts.join("=");
                if (!v && (key === "httponly" || key === "secure")) {
                    attributes[key] = true;
                } else {
                    attributes[key] = v || true;
                }
            });
            return { name, value, attributes };
        });
    }

    function buildRaw(status: string, hdrs: HeaderItem[]) {
        const lines = [status, ...hdrs.map(h => `${h.name}: ${h.value}`)];
        return lines.join("\n");
    }

    function copy(text: string) {
        if (!text) return;
        navigator.clipboard?.writeText(text);
    }

    async function handleSend(sampleUrl?: string) {
        const targetUrl = (sampleUrl || url).trim();
        if (!targetUrl) {
            setError("URL を入力してください。");
            return;
        }
        setUrl(targetUrl);
        setLoading(true);
        setError(null);
        setStatusLine("");
        setHeaders([]);
        setCookies([]);
        setRedirects([]);
        setRaw("");
        setDurationMs(null);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const timer = setTimeout(() => controller.abort(), timeoutSec * 1000);
        const started = performance.now();

        try {
            const response = await fetch(targetUrl, {
                method,
                redirect: followRedirects ? "follow" : "manual",
                signal: controller.signal,
            });
            const elapsed = Math.round(performance.now() - started);
            clearTimeout(timer);
            setDurationMs(elapsed);

            const hdrs = Array.from(response.headers.entries()).map(([name, value]) => ({ name, value }));
            const statusText = response.statusText || "";
            const statusLineValue = `HTTP ${response.status} ${statusText}`.trim();

            setStatusLine(statusLineValue);
            setStatusColor(followRedirects ? statusToColor(response.status) : "gray");
            setFinalUrl(response.url || targetUrl);
            setHttpVersion(response.headers.get("x-http-version") || null);
            setHeaders(hdrs);
            setRaw(buildRaw(statusLineValue, hdrs));

            const setCookieValues = hdrs.filter(h => h.name.toLowerCase() === "set-cookie").map(h => h.value);
            setCookies(parseCookies(setCookieValues));

            if (!followRedirects && response.status >= 300 && response.status < 400) {
                setRedirects([{ url: targetUrl, status: response.status, location: response.headers.get("location") || undefined }]);
            }

            setHistory(prev => {
                const updated = [targetUrl, ...prev.filter(p => p !== targetUrl)].slice(0, HISTORY_LIMIT);
                return updated;
            });
        } catch (e: any) {
            const elapsed = Math.round(performance.now() - started);
            clearTimeout(timer);
            setDurationMs(elapsed);
            setError(e?.name === "AbortError" ? "Timeout / request aborted." : e?.message || "Request failed.");
        } finally {
            setLoading(false);
        }
    }

    const filteredHeaders = useMemo(() => {
        const f = filter.trim().toLowerCase();
        if (!f) return headers;
        return headers.filter(h => h.name.toLowerCase().includes(f) || h.value.toLowerCase().includes(f));
    }, [headers, filter]);

    const securityResults = useMemo(() => {
        const result: Array<{ key: string; value: string; status: SecurityStatus; note: string }> = [];
        Object.keys(SECURITY_KEYS).forEach(k => {
            const h = headers.find(hd => hd.name.toLowerCase() === k);
            if (!h) {
                result.push({ key: k, value: "-", status: "missing", note: "未設定" });
            } else {
                let status: SecurityStatus = "ok";
                let note = "設定されています";
                if (k === "x-xss-protection" && h.value.includes("0")) {
                    status = "warn";
                    note = "無効設定 (0)";
                }
                result.push({ key: k, value: h.value, status, note });
            }
        });
        return result;
    }, [headers]);

    function cookiesBadge(c: CookieItem) {
        const secure = !!c.attributes["secure"];
        const httpOnly = !!c.attributes["httponly"];
        const sameSite = (c.attributes["samesite"] as string) || "";
        if (secure && httpOnly && sameSite.toLowerCase() !== "none") return "良好";
        return "要確認";
    }

    function curlCommand() {
        const parts = [`curl -I`, `"${url.trim()}"`];
        if (!followRedirects) parts.splice(1, 0, "--max-redirs 0");
        if (method === "HEAD") parts.splice(1, 0, "-X HEAD");
        return parts.join(" ");
    }

    const statusBadge = (
        <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                statusColor === "green"
                    ? "bg-emerald-500/80 text-black"
                    : statusColor === "yellow"
                        ? "bg-amber-400/80 text-black"
                        : statusColor === "red"
                            ? "bg-red-500/80 text-black"
                            : "bg-gray-700 text-gray-200"
            }`}
        >
            {statusLine || "No response"}
        </span>
    );

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <LinkIcon size={18} /> HTTP Header Viewer
                    </h4>
                    <p className="text-xs text-gray-400">Check HTTP status, headers, security, CORS, and cookies.</p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1 flex items-center gap-2">
                    <Shield size={12} /> Uses browser fetch (CORS applies)
                </div>
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
                    <select
                        className="bg-gray-900 border border-gray-800 rounded p-2 text-white"
                        value={method}
                        onChange={e => setMethod(e.target.value as Method)}
                    >
                        <option value="GET">GET</option>
                        <option value="HEAD">HEAD</option>
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-300">
                    Timeout (sec)
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

            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={followRedirects} onChange={e => setFollowRedirects(e.target.checked)} />
                    Follow redirects
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={showRedirectChain} onChange={e => setShowRedirectChain(e.target.checked)} />
                    Show redirect chain
                </label>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <History size={14} /> History:
                    {history.map(item => (
                        <button
                            key={item}
                            className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-200 hover:border-primary-500/60"
                            onClick={() => {
                                setUrl(item);
                                handleSend(item);
                            }}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 flex-wrap">
                <button
                    className="px-4 py-2 bg-primary-500 rounded text-black font-semibold disabled:opacity-60"
                    onClick={() => handleSend()}
                    disabled={loading}
                >
                    {loading ? "Requesting..." : "Send Request"}
                </button>
                <button
                    className="px-3 py-2 bg-gray-800 rounded text-gray-200 hover:bg-gray-700"
                    onClick={() => handleSend("https://example.com")}
                >
                    Load Sample
                </button>
                <button
                    className="px-3 py-2 bg-gray-800 rounded text-gray-200 hover:bg-gray-700"
                    onClick={() => {
                        setUrl("");
                        setStatusLine("");
                        setHeaders([]);
                        setCookies([]);
                        setRedirects([]);
                        setRaw("");
                        setError(null);
                    }}
                >
                    <RefreshCcw size={14} className="inline mr-1" /> Clear
                </button>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded text-sm">{error}</div>}

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        {statusBadge}
                        {durationMs !== null && (
                            <span className="text-xs text-gray-300 flex items-center gap-1">
                                <Timer size={12} /> Response time: {durationMs} ms
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>Final URL: {finalUrl || "-"}</span>
                        <span>HTTP: {httpVersion || "unknown"}</span>
                    </div>
                </div>
                {showRedirectChain && redirects.length > 0 && (
                    <div className="text-xs text-gray-300 space-y-1">
                        <p className="font-semibold">Redirect chain</p>
                        {redirects.map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-gray-400">{i + 1}.</span>
                                <span className="text-primary-400">{r.url}</span>
                                <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-200">{r.status}</span>
                                {r.location && <span className="text-gray-400">→ {r.location}</span>}
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>cURL:</span>
                    <code className="bg-gray-950 border border-gray-800 px-2 py-1 rounded text-[11px] text-gray-200">{curlCommand()}</code>
                    <button className="px-2 py-1 bg-gray-800 rounded text-gray-200 text-xs" onClick={() => copy(curlCommand())}>
                        <Copy size={12} className="inline mr-1" /> Copy
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-gray-300">
                <button
                    className={`px-3 py-2 rounded-lg border ${tab === "headers" ? "bg-primary-500 text-black border-primary-500" : "bg-gray-800 text-gray-200 border-gray-700"}`}
                    onClick={() => setTab("headers")}
                >
                    Headers
                </button>
                <button
                    className={`px-3 py-2 rounded-lg border ${tab === "security" ? "bg-primary-500 text-black border-primary-500" : "bg-gray-800 text-gray-200 border-gray-700"}`}
                    onClick={() => setTab("security")}
                >
                    Security
                </button>
                <button
                    className={`px-3 py-2 rounded-lg border ${tab === "cookies" ? "bg-primary-500 text-black border-primary-500" : "bg-gray-800 text-gray-200 border-gray-700"}`}
                    onClick={() => setTab("cookies")}
                >
                    Cookies
                </button>
                <button
                    className={`px-3 py-2 rounded-lg border ${tab === "raw" ? "bg-primary-500 text-black border-primary-500" : "bg-gray-800 text-gray-200 border-gray-700"}`}
                    onClick={() => setTab("raw")}
                >
                    Raw
                </button>
            </div>

            {tab === "headers" && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-300">
                        <label className="flex items-center gap-2">
                            Filter
                            <input
                                className="bg-gray-900 border border-gray-800 rounded p-2 text-white w-56"
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                placeholder="header or value"
                            />
                        </label>
                        <button
                            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-gray-200 text-xs"
                            onClick={() => copy(raw)}
                        >
                            <Copy size={12} className="inline mr-1" /> Copy all headers
                        </button>
                    </div>
                    <div className="bg-gray-950 border border-gray-800 rounded p-3 max-h-[320px] overflow-auto text-sm text-gray-100">
                        {filteredHeaders.length ? (
                            filteredHeaders
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((h, idx) => (
                                    <div key={idx} className="flex items-start gap-3 py-1 border-b border-gray-800 last:border-0">
                                        <span className="w-44 text-gray-300 break-words">{h.name}</span>
                                        <span className="text-gray-100 break-words flex-1">{h.value}</span>
                                    </div>
                                ))
                        ) : (
                            <p className="text-gray-500 text-sm">No headers.</p>
                        )}
                    </div>
                </div>
            )}

            {tab === "security" && (
                <div className="space-y-3">
                    <div className="bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-100 space-y-2">
                        <p className="text-xs text-gray-300">セキュリティヘッダのカバレッジ: {securityResults.filter(s => s.status !== "missing").length}/{securityResults.length}</p>
                        {securityResults.map(item => (
                            <div key={item.key} className="flex items-start gap-3 py-1 border-b border-gray-800 last:border-0">
                                <span className="w-56 text-gray-300">{item.key}</span>
                                <span className="flex-1">{item.value}</span>
                                <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                        item.status === "ok"
                                            ? "bg-emerald-600/70 text-black"
                                            : item.status === "warn"
                                                ? "bg-amber-400/70 text-black"
                                                : "bg-red-500/60 text-black"
                                    }`}
                                >
                                    {item.status === "ok" ? "良好" : item.status === "warn" ? "注意" : "未設定"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === "cookies" && (
                <div className="bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-100 space-y-3">
                    {cookies.length === 0 ? (
                        <p className="text-gray-400">Set-Cookie が見つかりませんでした。</p>
                    ) : (
                        cookies.map((c, idx) => (
                            <div key={idx} className="border border-gray-800 rounded p-3 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-primary-400">{c.name}</span>
                                    <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-200">{cookiesBadge(c)}</span>
                                </div>
                                <div className="text-xs break-all text-gray-200">Value: {c.value.length > 40 ? `${c.value.slice(0, 40)}...` : c.value}</div>
                                <div className="text-xs text-gray-300 flex flex-wrap gap-2">
                                    {Object.entries(c.attributes).map(([k, v]) => (
                                        <span key={k} className="px-2 py-1 bg-gray-800 rounded border border-gray-700">
                                            {k}: {v === true ? "true" : String(v)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {tab === "raw" && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-300">
                        <span>Raw response (order preserved as received by fetch)</span>
                        <button className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={() => copy(raw)}>
                            <Copy size={12} className="inline mr-1" /> Copy
                        </button>
                    </div>
                    <textarea
                        readOnly
                        className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-xs text-gray-100 min-h-[240px] font-mono"
                        value={raw}
                        placeholder="HTTP/2 200 OK\nserver: ...\ncontent-type: text/html; charset=utf-8"
                    />
                </div>
            )}
        </section>
    );
}
