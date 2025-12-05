import { useMemo, useState } from "react";
import { Shield, Clipboard } from "lucide-react";

type ParsedCookie = {
    name: string;
    value: string;
    attributes: Record<string, string>;
    session: boolean;
    warnings: string[];
    score: number;
};

const goodSample = `Set-Cookie: sessionid=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Domain=.example.com
Set-Cookie: remember_me=1; Expires=Wed, 31 Dec 2025 23:59:59 GMT; Path=/; Secure; SameSite=Strict`;

const badSample = `Set-Cookie: tracking=xyz; Path=/; SameSite=None
Set-Cookie: auth_token=secret; Domain=.example.com; Path=/`;

function normalizeSameSite(val: string) {
    const v = val.toLowerCase();
    if (v.startsWith("lax")) return "Lax";
    if (v.startsWith("strict")) return "Strict";
    if (v.startsWith("none")) return "None";
    return "";
}

function parseSetCookie(raw: string): ParsedCookie | null {
    const line = raw.trim();
    if (!line) return null;
    const cleaned = line.toLowerCase().startsWith("set-cookie:") ? line.slice(11).trim() : line;
    const parts = cleaned.split(";").map(p => p.trim()).filter(Boolean);
    if (!parts.length || !parts[0].includes("=")) return null;
    const [name, ...valueParts] = parts[0].split("=");
    const value = valueParts.join("=");
    const attrs: Record<string, string> = {};
    for (let i = 1; i < parts.length; i++) {
        const [k, ...vParts] = parts[i].split("=");
        const key = k.trim().toLowerCase();
        const val = vParts.join("=").trim();
        if (!key) continue;
        attrs[key] = val || "true";
    }
    const session = !("expires" in attrs) && !("max-age" in attrs);
    return {
        name: name.trim(),
        value,
        attributes: attrs,
        session,
        warnings: [],
        score: 0,
    };
}

function evaluateCookie(c: ParsedCookie): ParsedCookie {
    const warnings: string[] = [];
    let score = 0;
    const secure = "secure" in c.attributes;
    const httpOnly = "httponly" in c.attributes;
    const sameSite = normalizeSameSite(c.attributes["samesite"] || "");
    const domain = c.attributes["domain"] || "";

    if (secure) score += 2;
    else warnings.push("Secure がありません。HTTPS のみのサイトでは付与を推奨します。");

    if (httpOnly) score += 2;
    else warnings.push("HttpOnly がありません。JavaScript から参照可能です。");

    if (sameSite) score += 2;
    else warnings.push("SameSite が設定されていません。Lax 以上を推奨します。");

    if (sameSite === "None" && !secure) {
        warnings.push("SameSite=None の場合、Secure が必須です。");
        score -= 2;
    }

    if (c.session && (secure && httpOnly && sameSite && sameSite !== "None")) {
        score += 1;
    }

    if (domain.startsWith(".")) {
        warnings.push("Domain がサブドメイン全体に広がっています。必要な範囲に限定してください。");
    }

    return { ...c, warnings, score };
}

function summarize(cookies: ParsedCookie[]) {
    const total = cookies.length;
    const session = cookies.filter(c => c.session).length;
    const secure = cookies.filter(c => "secure" in c.attributes).length;
    const httpOnly = cookies.filter(c => "httponly" in c.attributes).length;
    const sameSite = cookies.filter(c => c.attributes["samesite"]).length;
    const noneWithoutSecure = cookies.filter(c => normalizeSameSite(c.attributes["samesite"] || "") === "None" && !("secure" in c.attributes)).length;

    let rating = "要改善";
    const avgScore = total ? cookies.reduce((s, c) => s + c.score, 0) / total : 0;
    if (avgScore >= 3 && noneWithoutSecure === 0) rating = "良好";
    if (noneWithoutSecure > 0) rating = "危険";

    return { total, session, secure, httpOnly, sameSite, noneWithoutSecure, rating };
}

export default function CookieAnalyzerPanel() {
    const [input, setInput] = useState("");
    const [cookies, setCookies] = useState<ParsedCookie[]>([]);
    const [error, setError] = useState<string | null>(null);

    const summary = useMemo(() => summarize(cookies), [cookies]);

    function analyze() {
        setError(null);
        const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const parsed: ParsedCookie[] = [];
        for (const line of lines) {
            const p = parseSetCookie(line);
            if (p) parsed.push(evaluateCookie(p));
        }
        if (!parsed.length) {
            setError("Set-Cookie として解析できる行がありません。\"Set-Cookie: name=value; attr...\" 形式で入力してください。");
        }
        setCookies(parsed);
    }

    function loadSample(kind: "good" | "bad") {
        setInput(kind === "good" ? goodSample : badSample);
        setCookies([]);
        setError(null);
    }

    function copy(text: string) {
        navigator.clipboard?.writeText(text);
    }

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Shield size={18} /> Cookie Analyzer
                    </h4>
                    <p className="text-xs text-gray-400">Set-Cookie を貼り付けてセキュリティ設定を即チェック。</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200" onClick={() => loadSample("good")}>
                        良い例
                    </button>
                    <button className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200" onClick={() => loadSample("bad")}>
                        悪い例
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-gray-300">Set-Cookie ヘッダを貼り付け</label>
                <textarea
                    className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[200px]"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`Set-Cookie: sessionid=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Domain=.example.com\nSet-Cookie: remember_me=1; Expires=Wed, 31 Dec 2025 23:59:59 GMT; Path=/; Secure`}
                />
                <div className="flex gap-2 flex-wrap">
                    <button className="px-4 py-2 bg-primary-500 rounded text-black font-semibold" onClick={analyze}>
                        Analyze Cookies
                    </button>
                    <button className="px-3 py-2 bg-gray-800 rounded text-gray-200 hover:bg-gray-700" onClick={() => { setInput(""); setCookies([]); setError(null); }}>
                        Clear
                    </button>
                    <button className="px-3 py-2 bg-gray-800 rounded text-gray-200 hover:bg-gray-700" onClick={() => copy(input)}>
                        <Clipboard size={14} className="inline mr-1" />
                        Copy Input
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded text-sm">{error}</div>}

            {cookies.length > 0 && (
                <div className="space-y-3">
                    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-sm text-gray-100 space-y-1">
                        <div className="flex flex-wrap gap-3 items-center">
                            <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-200">総数: {summary.total}</span>
                            <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-200">セッション: {summary.session}</span>
                            <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-200">Secure: {summary.secure}/{summary.total}</span>
                            <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-200">HttpOnly: {summary.httpOnly}/{summary.total}</span>
                            <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-200">SameSite: {summary.sameSite}/{summary.total}</span>
                            <span className={`px-3 py-1 rounded-full ${summary.noneWithoutSecure ? "bg-amber-400/80 text-black" : "bg-emerald-500/80 text-black"}`}>
                                SameSite=None+Secure: {summary.noneWithoutSecure ? "NG" : "OK"}
                            </span>
                        </div>
                        <div className="text-xs text-gray-300">全体評価: {summary.rating}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cookies.map((c, idx) => (
                            <div key={idx} className="border border-gray-800 rounded-xl p-3 bg-gray-950 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-primary-400 font-semibold text-sm">{c.name}</p>
                                        <p className="text-xs text-gray-400 break-all">Value: {c.value.length > 40 ? `${c.value.slice(0, 40)}...` : c.value}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.score >= 3 ? "bg-emerald-500/80 text-black" : c.score >= 1 ? "bg-amber-400/80 text-black" : "bg-red-500/80 text-black"}`}>
                                        {c.score >= 3 ? "良好" : c.score >= 1 ? "注意" : "危険"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                                    <div className="bg-gray-900 border border-gray-800 rounded p-2">
                                        <p>Type</p>
                                        <p className="text-gray-100">{c.session ? "Session Cookie" : "Persistent"}</p>
                                    </div>
                                    <div className="bg-gray-900 border border-gray-800 rounded p-2">
                                        <p>SameSite</p>
                                        <p className="text-gray-100">{normalizeSameSite(c.attributes["samesite"] || "") || "未設定"}</p>
                                    </div>
                                    <div className="bg-gray-900 border border-gray-800 rounded p-2">
                                        <p>Secure</p>
                                        <p className="text-gray-100">{c.attributes["secure"] ? "✓" : "なし"}</p>
                                    </div>
                                    <div className="bg-gray-900 border border-gray-800 rounded p-2">
                                        <p>HttpOnly</p>
                                        <p className="text-gray-100">{c.attributes["httponly"] ? "✓" : "なし"}</p>
                                    </div>
                                    <div className="bg-gray-900 border border-gray-800 rounded p-2">
                                        <p>Domain</p>
                                        <p className="text-gray-100">{c.attributes["domain"] || "未指定"}</p>
                                    </div>
                                    <div className="bg-gray-900 border border-gray-800 rounded p-2">
                                        <p>Path</p>
                                        <p className="text-gray-100">{c.attributes["path"] || "未指定"}</p>
                                    </div>
                                    <div className="bg-gray-900 border border-gray-800 rounded p-2">
                                        <p>Expires</p>
                                        <p className="text-gray-100 break-all">{c.attributes["expires"] || "なし"}</p>
                                    </div>
                                    <div className="bg-gray-900 border border-gray-800 rounded p-2">
                                        <p>Max-Age</p>
                                        <p className="text-gray-100">{c.attributes["max-age"] || "なし"}</p>
                                    </div>
                                </div>

                                {c.warnings.length > 0 ? (
                                    <div className="bg-amber-500/10 border border-amber-500/40 text-amber-200 p-2 rounded text-xs space-y-1">
                                        {c.warnings.map((w, i) => (
                                            <p key={i}>{w}</p>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 p-2 rounded text-xs">
                                        セッション Cookie として適切に保護されています。
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
