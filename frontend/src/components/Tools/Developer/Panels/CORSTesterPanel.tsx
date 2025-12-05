import { useMemo, useState } from "react";
import { Copy, RefreshCcw, ShieldAlert, ShieldCheck } from "lucide-react";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";

type HeaderKV = { name: string; value: string };
type ResponseView = {
    status?: number;
    statusText?: string;
    headers: HeaderKV[];
    bodyPreview?: string;
    error?: string;
    durationMs?: number;
};

export default function CORSTesterPanel() {
    const [targetUrl, setTargetUrl] = useState("https://example.com/api");
    const [origin, setOrigin] = useState(window.location.origin);
    const [method, setMethod] = useState<Method>("GET");
    const [headers, setHeaders] = useState<HeaderKV[]>([{ name: "Content-Type", value: "application/json" }]);
    const [body, setBody] = useState('{"name":"Yuki"}');
    const [withCredentials, setWithCredentials] = useState(false);
    const [runPreflight, setRunPreflight] = useState(true);
    const [runActual, setRunActual] = useState(true);
    const [preflight, setPreflight] = useState<ResponseView | null>(null);
    const [actual, setActual] = useState<ResponseView | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [reason, setReason] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function addHeader() {
        setHeaders([...headers, { name: "", value: "" }]);
    }
    function updateHeader(idx: number, key: "name" | "value", value: string) {
        const clone = [...headers];
        clone[idx] = { ...clone[idx], [key]: value };
        setHeaders(clone);
    }
    function removeHeader(idx: number) {
        setHeaders(headers.filter((_, i) => i !== idx));
    }
    function copy(text: string) {
        if (!text) return;
        navigator.clipboard?.writeText(text);
    }

    function headerMap(list: HeaderKV[]) {
        const map: Record<string, string> = {};
        list.forEach(h => {
            if (!h.name) return;
            map[h.name.toLowerCase()] = h.value;
        });
        return map;
    }

    function evaluatePreflight(resp: ResponseView | null) {
        if (!resp || !resp.headers.length || resp.error) return { ok: false, msg: resp?.error || "プリフライトに失敗しました。" };
        const h = headerMap(resp.headers);
        const reasons: string[] = [];
        const originAllowed = h["access-control-allow-origin"];
        const methods = h["access-control-allow-methods"];
        const allowedHeaders = h["access-control-allow-headers"];
        const allowCreds = h["access-control-allow-credentials"] === "true";

        // Origin
        if (!originAllowed || (originAllowed !== "*" && originAllowed !== origin)) {
            reasons.push(`指定した Origin "${origin}" は許可されていません（現在: "${originAllowed || "なし"}"）。`);
        }
        // Method
        if (methods && !methods.toLowerCase().split(",").map(s => s.trim()).includes(method.toLowerCase())) {
            reasons.push(`Access-Control-Allow-Methods に "${method}" が含まれていません。`);
        }
        // Headers
        const requestedHeaders = headers.filter(hh => hh.name).map(hh => hh.name.toLowerCase());
        if (requestedHeaders.length && allowedHeaders) {
            const allowedList = allowedHeaders.toLowerCase().split(",").map(s => s.trim());
            requestedHeaders.forEach(hn => {
                if (!allowedList.includes(hn)) reasons.push(`カスタムヘッダ "${hn}" が許可されていません。`);
            });
        }
        // Credentials
        if (withCredentials) {
            if (!allowCreds) reasons.push("credentials を送信するには Access-Control-Allow-Credentials: true が必要です。");
            if (originAllowed === "*") reasons.push("credentials が ON の場合、Access-Control-Allow-Origin: * は使用できません。");
        }

        return { ok: reasons.length === 0, msg: reasons.join(" ") || "プリフライト OK" };
    }

    function evaluateActual(resp: ResponseView | null) {
        if (!resp) return { ok: false, msg: "実リクエストが未実行です。" };
        if (resp.error) return { ok: false, msg: resp.error };
        return { ok: true, msg: "実リクエスト取得に成功しました。CORS 可否はブラウザの挙動に依存します。" };
    }

    async function run() {
        const target = targetUrl.trim();
        if (!target) {
            setError("Target URL を入力してください。");
            return;
        }
        setLoading(true);
        setError(null);
        setPreflight(null);
        setActual(null);
        setSummary(null);
        setReason(null);

        const reqHeaders = headers.filter(h => h.name).reduce((acc, h) => ({ ...acc, [h.name]: h.value }), {} as Record<string, string>);

        const doPreflight = async () => {
            const started = performance.now();
            try {
                const res = await fetch(target, {
                    method: "OPTIONS",
                    mode: "cors",
                    credentials: withCredentials ? "include" : "omit",
                    headers: {
                        "Access-Control-Request-Method": method,
                        "Access-Control-Request-Headers": Object.keys(reqHeaders).join(", "),
                    },
                });
                const hdrs = Array.from(res.headers.entries()).map(([name, value]) => ({ name, value }));
                setPreflight({
                    status: res.status,
                    statusText: res.statusText,
                    headers: hdrs,
                    durationMs: Math.round(performance.now() - started),
                });
            } catch (e: any) {
                setPreflight({
                    headers: [],
                    error: e?.message || "プリフライト失敗",
                    durationMs: Math.round(performance.now() - started),
                });
            }
        };

        const doActual = async () => {
            const started = performance.now();
            try {
                const res = await fetch(target, {
                    method,
                    mode: "cors",
                    credentials: withCredentials ? "include" : "omit",
                    headers: reqHeaders,
                    body: ["POST", "PUT", "PATCH"].includes(method) ? body : undefined,
                });
                const hdrs = Array.from(res.headers.entries()).map(([name, value]) => ({ name, value }));
                let bodyPreview = "";
                const contentType = res.headers.get("content-type") || "";
                if (contentType.includes("application/json")) {
                    try {
                        const json = await res.clone().json();
                        bodyPreview = JSON.stringify(json, null, 2).slice(0, 2000);
                    } catch {
                        bodyPreview = await res.clone().text();
                    }
                } else if (contentType.startsWith("text/")) {
                    bodyPreview = (await res.clone().text()).slice(0, 2000);
                }
                setActual({
                    status: res.status,
                    statusText: res.statusText,
                    headers: hdrs,
                    bodyPreview,
                    durationMs: Math.round(performance.now() - started),
                });
            } catch (e: any) {
                setActual({
                    headers: [],
                    error: e?.message || "実リクエストに失敗しました",
                    durationMs: Math.round(performance.now() - started),
                });
            }
        };

        if (runPreflight) await doPreflight();
        if (runActual) await doActual();

        const preflightJudge = evaluatePreflight(runPreflight ? preflight : null);
        const actualJudge = evaluateActual(runActual ? actual : null);
        const ok = (!runPreflight || preflightJudge.ok) && (!runActual || actualJudge.ok);
        setSummary(ok ? "Result: OK（この条件なら CORS は許可される可能性があります）" : "Result: NG（CORS ポリシーによりブロックされる可能性があります）");
        setReason(preflightJudge.msg || actualJudge.msg);

        setLoading(false);
    }

    const corsInfo = useMemo(() => {
        const reqHeaders = headers.filter(h => h.name).map(h => h.name).join(", ");
        return `Origin: ${origin} / Method: ${method} / Headers: ${reqHeaders || "none"} / Credentials: ${withCredentials ? "ON" : "OFF"}`;
    }, [origin, method, headers, withCredentials]);

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <ShieldAlert size={18} /> CORS Tester
                    </h4>
                    <p className="text-xs text-gray-400">プリフライトと実リクエストをシミュレートし、CORS 可否を確認します（ブラウザ fetch ベース）。</p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1">CORS 制約により外部サイトはブロックされる場合があります</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm text-gray-300">
                    Target URL
                    <input className="bg-gray-900 border border-gray-800 rounded p-2 text-gray-100" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://api.example.com/v1/resource" />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-300">
                    Origin (simulate)
                    <input className="bg-gray-900 border border-gray-800 rounded p-2 text-gray-100" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="https://your-frontend-origin.com" />
                </label>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                <label className="flex items-center gap-2">
                    Method
                    <select className="bg-gray-900 border border-gray-800 rounded p-2 text-white" value={method} onChange={e => setMethod(e.target.value as Method)}>
                        {["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"].map(m => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={withCredentials} onChange={e => setWithCredentials(e.target.checked)} />
                    Send credentials (include cookies)
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={runPreflight} onChange={e => setRunPreflight(e.target.checked)} />
                    Preflight (OPTIONS)
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={runActual} onChange={e => setRunActual(e.target.checked)} />
                    Actual request
                </label>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>Request Headers</span>
                    <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={addHeader}>
                        行を追加
                    </button>
                </div>
                <div className="space-y-2">
                    {headers.map((h, idx) => (
                        <div key={idx} className="flex gap-2 text-sm">
                            <input className="w-1/3 bg-gray-900 border border-gray-800 rounded p-2 text-gray-100" placeholder="Header name" value={h.name} onChange={e => updateHeader(idx, "name", e.target.value)} />
                            <input className="flex-1 bg-gray-900 border border-gray-800 rounded p-2 text-gray-100" placeholder="Header value" value={h.value} onChange={e => updateHeader(idx, "value", e.target.value)} />
                            <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={() => removeHeader(idx)}>
                                削除
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {["POST", "PUT", "PATCH"].includes(method) && (
                <div className="space-y-2">
                    <label className="text-sm text-gray-300">Request Body</label>
                    <textarea className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[120px]" value={body} onChange={e => setBody(e.target.value)} />
                </div>
            )}

            <div className="flex gap-2 flex-wrap">
                <button className="px-4 py-2 bg-primary-500 rounded text-black font-semibold disabled:opacity-60" onClick={run} disabled={loading}>
                    {loading ? "Running..." : "Run CORS Test"}
                </button>
                <button className="px-3 py-2 bg-gray-800 rounded text-gray-200 hover:bg-gray-700" onClick={() => setTargetUrl("https://api.example.com/v1/resource")}>
                    Sample
                </button>
                <button className="px-3 py-2 bg-gray-800 rounded text-gray-200 hover:bg-gray-700" onClick={() => window.location.reload()}>
                    <RefreshCcw size={14} className="inline mr-1" />
                    Reset
                </button>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded text-sm">{error}</div>}

            {summary && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                        {summary.startsWith("Result: OK") ? (
                            <ShieldCheck className="text-emerald-400" size={16} />
                        ) : (
                            <ShieldAlert className="text-amber-400" size={16} />
                        )}
                        <span className="text-gray-100">{summary}</span>
                    </div>
                    <p className="text-xs text-gray-300">{reason}</p>
                    <p className="text-xs text-gray-400">条件: {corsInfo}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-300">
                        <span>Preflight (OPTIONS)</span>
                        {preflight?.headers?.length ? (
                            <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={() => copy(preflight!.headers.map(h => `${h.name}: ${h.value}`).join("\n"))}>
                                <Copy size={12} className="inline mr-1" /> Copy headers
                            </button>
                        ) : null}
                    </div>
                    {preflight ? (
                        <>
                            <p className="text-xs text-gray-400">Status: {preflight.status ?? "-"} {preflight.statusText || ""} {preflight.durationMs ? `(${preflight.durationMs} ms)` : ""}</p>
                            {preflight.error && <p className="text-xs text-red-300">{preflight.error}</p>}
                            <div className="max-h-48 overflow-auto space-y-1 text-xs text-gray-100 bg-gray-950 border border-gray-800 rounded p-2">
                                {preflight.headers.length ? preflight.headers.map((h, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <span className="w-48 text-gray-300">{h.name}</span>
                                        <span className="text-gray-100 break-words flex-1">{h.value}</span>
                                    </div>
                                )) : <p className="text-gray-500">ヘッダなし</p>}
                            </div>
                        </>
                    ) : (
                        <p className="text-xs text-gray-500">未実行</p>
                    )}
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-300">
                        <span>Actual Request</span>
                        {actual?.headers?.length ? (
                            <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={() => copy(actual!.headers.map(h => `${h.name}: ${h.value}`).join("\n"))}>
                                <Copy size={12} className="inline mr-1" /> Copy headers
                            </button>
                        ) : null}
                    </div>
                    {actual ? (
                        <>
                            <p className="text-xs text-gray-400">Status: {actual.status ?? "-"} {actual.statusText || ""} {actual.durationMs ? `(${actual.durationMs} ms)` : ""}</p>
                            {actual.error && <p className="text-xs text-red-300">{actual.error}</p>}
                            <div className="max-h-40 overflow-auto space-y-1 text-xs text-gray-100 bg-gray-950 border border-gray-800 rounded p-2">
                                {actual.headers.length ? actual.headers.map((h, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <span className="w-48 text-gray-300">{h.name}</span>
                                        <span className="text-gray-100 break-words flex-1">{h.value}</span>
                                    </div>
                                )) : <p className="text-gray-500">ヘッダなし</p>}
                            </div>
                            {actual.bodyPreview && (
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-300">Body (preview)</p>
                                    <pre className="bg-gray-950 border border-gray-800 rounded p-2 text-[11px] text-gray-100 max-h-32 overflow-auto whitespace-pre-wrap">{actual.bodyPreview}</pre>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-xs text-gray-500">未実行</p>
                    )}
                </div>
            </div>
        </section>
    );
}
