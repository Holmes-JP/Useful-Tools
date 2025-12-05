import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Copy, RefreshCcw, Shield } from "lucide-react";

type Part = "header" | "payload";
type VerifyState = { status: "idle" | "success" | "error"; message: string; calculated?: string };

type SampleKey = "valid" | "expired" | "invalid";

const SAMPLE_TOKENS: Record<SampleKey, { label: string; token: string }> = {
    valid: {
        label: "Valid Token (HS256, not expired)",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiVmFsaWQgVXNlciIsImlhdCI6MTc2NDkwOTc0MSwiZXhwIjoxNzY0OTEzMzQxfQ.HIOQvBdde4ylLEdbZj8aOFi1IImn_MOwjrU_N8S_H2g",
    },
    expired: {
        label: "Expired Token",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiRXhwaXJlZCBVc2VyIiwiaWF0IjoxNzY0OTAyNTQxLCJleHAiOjE3NjQ5MDYxNDF9.I2-RKEuXRh26y07n_h0lduIkFbunMBM_XjoziaxR-wE",
    },
    invalid: {
        label: "Invalid Signature",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSW52YWxpZCBTaWciLCJleHAiOjQ3NjQ5MDk3NDF9.invalidsignature",
    },
};

const CLAIM_DESCRIPTIONS: Record<string, string> = {
    iss: "Issuer (who issued the token)",
    sub: "Subject (who the token refers to)",
    aud: "Audience (who should accept the token)",
    exp: "Expiration time",
    nbf: "Not valid before",
    iat: "Issued at",
    jti: "JWT ID (unique identifier)",
};

function decodeBase64Url(part: string) {
    try {
        return atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    } catch (e) {
        return null;
    }
}

function formatTimeClaim(value: unknown, key: string) {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) return { display: String(value ?? ""), badge: null as React.ReactNode };
    const date = new Date(num * 1000);
    const now = Date.now();
    const diffMs = date.getTime() - now;
    const hours = Math.floor(Math.abs(diffMs) / 3600000);
    const mins = Math.floor((Math.abs(diffMs) % 3600000) / 60000);
    const readable = `${num} (${date.toISOString()} / ${date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })})`;

    if (key === "exp") {
        const expired = diffMs <= 0;
        const text = expired ? `期限切れ（${hours}h${mins}m前）` : `有効（あと ${hours}h${mins}m）`;
        return {
            display: readable,
            badge: (
                <span className={`px-2 py-1 rounded text-xs ${expired ? "bg-red-500/20 text-red-200" : "bg-green-500/20 text-green-200"}`}>
                    {text}
                </span>
            ),
        };
    }
    if (key === "nbf") {
        const notYet = diffMs > 0;
        const text = notYet ? `まだ有効開始前（${hours}h${mins}m後）` : "有効開始時刻を過ぎています";
        return {
            display: readable,
            badge: (
                <span className={`px-2 py-1 rounded text-xs ${notYet ? "bg-amber-500/20 text-amber-200" : "bg-green-500/20 text-green-200"}`}>
                    {text}
                </span>
            ),
        };
    }
    if (key === "iat") {
        return {
            display: readable,
            badge: <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-200">発行時刻</span>,
        };
    }
    return { display: readable, badge: null as React.ReactNode };
}

function prettyJson(input: any) {
    try {
        return JSON.stringify(input, null, 2);
    } catch {
        return "";
    }
}

function copyText(text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
}

export default function JWTAnalyzerPanel() {
    const [tokenInput, setTokenInput] = useState("");
    const [autoAnalyze, setAutoAnalyze] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [headerObj, setHeaderObj] = useState<any>(null);
    const [payloadObj, setPayloadObj] = useState<any>(null);
    const [rawHeader, setRawHeader] = useState("");
    const [rawPayload, setRawPayload] = useState("");
    const [activeTab, setActiveTab] = useState<Part>("payload");
    const [verifySecret, setVerifySecret] = useState("secret");
    const [verifyResult, setVerifyResult] = useState<VerifyState>({ status: "idle", message: "" });
    const [showRaw, setShowRaw] = useState(false);
    const [selectedSample, setSelectedSample] = useState<SampleKey>("valid");
    const analyzeTimer = useRef<number | null>(null);

    const claims = useMemo(() => {
        if (!payloadObj || typeof payloadObj !== "object") return [];
        return Object.entries(payloadObj as Record<string, unknown>);
    }, [payloadObj]);

    function clearAll() {
        setTokenInput("");
        setError(null);
        setHeaderObj(null);
        setPayloadObj(null);
        setRawHeader("");
        setRawPayload("");
        setVerifyResult({ status: "idle", message: "" });
    }

    function loadSample() {
        const sample = SAMPLE_TOKENS[selectedSample];
        if (!sample) return;
        setTokenInput(sample.token);
        setTimeout(() => analyze(sample.token), 0);
    }

    function analyze(input?: string) {
        const token = (input ?? tokenInput).trim();
        setError(null);
        setVerifyResult({ status: "idle", message: "" });

        if (!token) {
            setHeaderObj(null);
            setPayloadObj(null);
            setRawHeader("");
            setRawPayload("");
            return;
        }

        const parts = token.split(".");
        if (parts.length !== 3) {
            setError("JWT は「.」で 3 つの部分（header.payload.signature）に分かれている必要があります。ドットが不足していないか確認してください。");
            return;
        }

        const [h, p] = parts;
        const decHeader = decodeBase64Url(h);
        if (decHeader === null) {
            setError("Header 部分が Base64URL として無効です。ペースト時に余計な文字が入っていないか確認してください。");
            return;
        }
        const decPayload = decodeBase64Url(p);
        if (decPayload === null) {
            setError("Payload 部分が Base64URL として無効です。");
            return;
        }

        try {
            const header = JSON.parse(decHeader);
            const payload = JSON.parse(decPayload);
            setHeaderObj(header);
            setPayloadObj(payload);
            setRawHeader(decHeader);
            setRawPayload(decPayload);
        } catch (e: any) {
            setError("Header または Payload が JSON として無効です。");
            return;
        }
    }

    useEffect(() => {
        if (!autoAnalyze) return;
        if (analyzeTimer.current) window.clearTimeout(analyzeTimer.current);
        analyzeTimer.current = window.setTimeout(() => analyze(), 500);
        return () => {
            if (analyzeTimer.current) window.clearTimeout(analyzeTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenInput, autoAnalyze]);

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            analyze();
        }
    }

    async function verifySignature() {
        if (!headerObj || !payloadObj) {
            setVerifyResult({ status: "error", message: "先に JWT を解析してください。" });
            return;
        }

        const token = tokenInput.trim();
        const [h, p, s] = token.split(".");
        const alg = (headerObj?.alg || "").toString();

        if (!alg) {
            setVerifyResult({ status: "error", message: "Algorithm: (not specified)" });
            return;
        }

        if (alg.startsWith("HS")) {
            try {
                const signingInput = `${h}.${p}`;
                const algo = alg === "HS512" ? "SHA-512" : alg === "HS384" ? "SHA-384" : "SHA-256";
                const enc = new TextEncoder();
                const key = await crypto.subtle.importKey(
                    "raw",
                    enc.encode(verifySecret),
                    { name: "HMAC", hash: algo },
                    false,
                    ["sign"]
                );
                const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
                const calcSig = Buffer.from(sigBuf).toString("base64url");
                const matches = calcSig === s;
                setVerifyResult({
                    status: matches ? "success" : "error",
                    message: matches ? "署名の検証に成功しました。" : "署名の検証に失敗しました。秘密鍵/アルゴリズムを確認してください。",
                    calculated: calcSig,
                });
            } catch (e: any) {
                setVerifyResult({ status: "error", message: e?.message || "署名検証に失敗しました。" });
            }
            return;
        }

        if (alg === "none") {
            setVerifyResult({ status: "error", message: "署名なしアルゴリズム（alg=none）のため、署名検証は行われません。" });
            return;
        }

        setVerifyResult({ status: "error", message: `アルゴリズム ${alg} の公開鍵検証はまだ実装されていません。` });
    }

    const algLabel = headerObj?.alg ? String(headerObj.alg) : "(not specified)";

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Analyzer</div>
                    <h3 className="text-2xl font-bold text-white">JWT Analyzer</h3>
                    <p className="text-gray-400 text-sm">Decode, inspect claims, and verify HS signatures. 全処理はブラウザ内で完結します。</p>
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded-lg text-sm">
                    <AlertCircle size={18} />
                    <div>{error}</div>
                </div>
            )}

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="text-sm text-gray-300">JWT Token</label>
                    <div className="flex items-center gap-3 text-sm">
                        <label className="flex items-center gap-2 text-gray-300">
                            <input type="checkbox" checked={autoAnalyze} onChange={e => setAutoAnalyze(e.target.checked)} />
                            Auto analyze (0.5s)
                        </label>
                        <select
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-100"
                            value={selectedSample}
                            onChange={e => setSelectedSample(e.target.value as SampleKey)}
                        >
                            {Object.entries(SAMPLE_TOKENS).map(([key, v]) => (
                                <option key={key} value={key}>{v.label}</option>
                            ))}
                        </select>
                        <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 hover:border-primary-500/60" onClick={loadSample}>Load</button>
                    </div>
                </div>
                <textarea
                    className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[110px]"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="flex gap-2 flex-wrap">
                    <button className="px-4 py-2 bg-primary-500 text-black rounded font-semibold" onClick={() => analyze()}>Analyze JWT</button>
                    <button className="px-3 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700" onClick={clearAll}>
                        <RefreshCcw size={14} className="inline mr-1" /> Clear
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4 items-start">
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <button
                            className={`px-3 py-2 rounded-lg border ${activeTab === "payload" ? "border-primary-500/60 text-primary-300" : "border-gray-700 text-gray-300"}`}
                            onClick={() => setActiveTab("payload")}
                        >
                            Payload
                        </button>
                        <button
                            className={`px-3 py-2 rounded-lg border ${activeTab === "header" ? "border-primary-500/60 text-primary-300" : "border-gray-700 text-gray-300"}`}
                            onClick={() => setActiveTab("header")}
                        >
                            Header
                        </button>
                        <label className="flex items-center gap-2 ml-auto text-xs text-gray-400">
                            <input type="checkbox" checked={showRaw} onChange={e => setShowRaw(e.target.checked)} />
                            Show raw Base64URL
                        </label>
                        <button
                            className="flex items-center gap-1 px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-100"
                            onClick={() => copyText(activeTab === "payload" ? prettyJson(payloadObj) : prettyJson(headerObj))}
                        >
                            <Copy size={14} /> Copy JSON
                        </button>
                    </div>
                    <pre className="bg-gray-950 border border-gray-800 rounded p-3 text-xs text-gray-100 overflow-auto min-h-[180px]">
                        {activeTab === "payload" ? prettyJson(payloadObj) : prettyJson(headerObj)}
                    </pre>
                    {showRaw && (
                        <div className="bg-gray-950 border border-gray-800 rounded p-3 text-xs text-gray-300 space-y-2">
                            <div>
                                <div className="text-gray-500 text-[11px] uppercase mb-1">Header (raw)</div>
                                <code className="break-all">{rawHeader}</code>
                            </div>
                            <div>
                                <div className="text-gray-500 text-[11px] uppercase mb-1">Payload (raw)</div>
                                <code className="break-all">{rawPayload}</code>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Shield size={16} className="text-primary-400" />
                        <span className="font-semibold">Claims</span>
                    </div>
                    <div className="overflow-auto border border-gray-800 rounded">
                        <table className="min-w-full text-xs text-gray-100">
                            <thead className="bg-gray-800 text-gray-300">
                                <tr>
                                    <th className="px-3 py-2 text-left">Claim</th>
                                    <th className="px-3 py-2 text-left">Value</th>
                                    <th className="px-3 py-2 text-left">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {claims.length === 0 && (
                                    <tr>
                                        <td className="px-3 py-2 text-gray-500" colSpan={3}>No claims</td>
                                    </tr>
                                )}
                                {claims.map(([key, value]) => {
                                    const desc = CLAIM_DESCRIPTIONS[key] || "Custom claim";
                                    const timeInfo = key === "exp" || key === "nbf" || key === "iat" ? formatTimeClaim(value, key) : null;
                                    return (
                                        <tr key={key} className="border-t border-gray-800">
                                            <td className="px-3 py-2 font-semibold text-gray-200">{key}</td>
                                            <td className="px-3 py-2 space-y-1">
                                                <div className="break-all text-gray-100">{timeInfo ? timeInfo.display : String(value)}</div>
                                                {timeInfo?.badge}
                                            </td>
                                            <td className="px-3 py-2 text-gray-300">{desc}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Shield size={16} className="text-primary-400" />
                    <span className="font-semibold">Signature Verification</span>
                    <span className="text-xs text-gray-500">Algorithm: {algLabel}</span>
                </div>
                {algLabel === "none" && (
                    <div className="text-amber-300 text-sm bg-amber-500/10 border border-amber-500/40 p-3 rounded">
                        署名なしアルゴリズム（alg=none）のため、署名検証は行われません。本番環境での使用は非推奨です。
                    </div>
                )}
                {algLabel.startsWith("HS") && (
                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">Shared Secret</label>
                        <input
                            type="text"
                            className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-gray-100"
                            value={verifySecret}
                            onChange={e => setVerifySecret(e.target.value)}
                        />
                        <button className="px-4 py-2 bg-primary-500 text-black rounded font-semibold" onClick={verifySignature}>
                            Verify Signature
                        </button>
                    </div>
                )}
                {!algLabel.startsWith("HS") && algLabel !== "none" && (
                    <div className="text-sm text-gray-300 bg-gray-950 border border-gray-800 rounded p-3">
                        公開鍵アルゴリズム（{algLabel}）の検証はまだ実装されていません。
                    </div>
                )}

                {verifyResult.status !== "idle" && (
                    <div className={`p-3 rounded border text-sm ${verifyResult.status === "success" ? "border-green-500/50 bg-green-500/10 text-green-200" : "border-red-500/50 bg-red-500/10 text-red-200"}`}>
                        {verifyResult.status === "success" ? <CheckCircle2 size={16} className="inline mr-2" /> : <AlertCircle size={16} className="inline mr-2" />}
                        {verifyResult.message}
                        {verifyResult.calculated && (
                            <div className="mt-2 text-xs text-gray-100 space-y-1">
                                <div>Calculated: <code className="break-all">{verifyResult.calculated}</code></div>
                                <div>Token: <code className="break-all">{tokenInput.split(".")[2] || ""}</code></div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={14} />
                このツールはすべてブラウザ内で処理され、JWT や秘密鍵は外部に送信されません。
            </div>
        </div>
    );
}
