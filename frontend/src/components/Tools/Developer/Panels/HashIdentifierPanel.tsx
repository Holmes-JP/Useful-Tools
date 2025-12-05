import { useEffect, useState } from "react";
import { AlertCircle, Copy, FileDown, Fingerprint, RefreshCcw } from "lucide-react";

type Mode = "single" | "multi";

type Candidate = {
    name: string;
    confidence: "High" | "Medium" | "Low";
    reason: string;
};

type ResultRow = {
    hash: string;
    candidates: Candidate[];
};

const SAMPLES: Record<string, { label: string; value: string }> = {
    md5: { label: "MD5", value: "5d41402abc4b2a76b9719d911017c592" },
    sha1: { label: "SHA-1", value: "a9993e364706816aba3e25717850c26c9cd0d89d" },
    sha256: { label: "SHA-256", value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
    bcrypt: { label: "bcrypt", value: "$2b$12$abcdefghijklmnopqrstuvC7Ix2SWK3TU/.F3wxwdeJ5Hkq" },
    sha512crypt: { label: "Linux /etc/shadow (SHA-512)", value: "$6$somesalt$XvZ6JiWkTxuPQe1MXjH2am5E2CNb0.TnjO7f8u/2JpWkqzqQEM77jXQs7gkzhK8kseM1XxL65BAl5ZkG7PH7V/" },
};

const ALGO_INFO: Record<string, string> = {
    "MD5": "128-bit hash, 32 hex chars. Fast but weak; avoid for passwords.",
    "SHA-1": "160-bit hash, 40 hex chars. Deprecated for security-sensitive use.",
    "SHA-224": "224-bit SHA-2, 56 hex chars.",
    "SHA-256": "256-bit SHA-2, 64 hex chars. Common for integrity checks.",
    "SHA-384": "384-bit SHA-2, 96 hex chars.",
    "SHA-512": "512-bit SHA-2, 128 hex chars.",
    "bcrypt": "Password hash ($2a/$2b/$2y$). Includes cost and salt.",
    "SHA-256 crypt": "Linux crypt(3) $5$ format with salt.",
    "SHA-512 crypt": "Linux crypt(3) $6$ format with salt.",
    "MD5-crypt": "crypt(3) $1$ format with salt.",
};

function shorten(hash: string, len = 26) {
    if (hash.length <= len) return hash;
    const side = Math.max(4, Math.floor((len - 3) / 2));
    return `${hash.slice(0, side)}...${hash.slice(-side)}`;
}

function detectOne(hash: string): Candidate[] {
    const trimmed = hash.trim();
    if (!trimmed) return [];
    const candidates: Candidate[] = [];

    const isHex = /^[0-9a-fA-F]+$/.test(trimmed);
    const isLowerHex = /^[0-9a-f]+$/.test(trimmed);
    const isB64 = /^[A-Za-z0-9+/=]+$/.test(trimmed);

    // crypt(3) style with prefix
    if (/^\$1\$.+\$.+/.test(trimmed)) {
        candidates.push({ name: "MD5-crypt", confidence: "High", reason: "$1$ プレフィックス (MD5-crypt)" });
    }
    if (/^\$2[aby]\$\d{2}\$/.test(trimmed)) {
        candidates.push({ name: "bcrypt", confidence: "High", reason: "$2a/$2b/$2y$ プレフィックス (bcrypt)" });
    }
    if (/^\$5\$.+\$.+/.test(trimmed)) {
        candidates.push({ name: "SHA-256 crypt", confidence: "High", reason: "$5$ プレフィックス (SHA-256 crypt)" });
    }
    if (/^\$6\$.+\$.+/.test(trimmed)) {
        candidates.push({ name: "SHA-512 crypt", confidence: "High", reason: "$6$ プレフィックス (SHA-512 crypt)" });
    }

    if (/^sha1\$/i.test(trimmed)) {
        candidates.push({ name: "SHA-1 (salted)", confidence: "Medium", reason: "sha1$... 形式 (Django など)" });
    }
    if (/^sha256\$/i.test(trimmed)) {
        candidates.push({ name: "SHA-256 (salted)", confidence: "Medium", reason: "sha256$... 形式 (Django など)" });
    }
    if (/^md5\$/i.test(trimmed)) {
        candidates.push({ name: "MD5 (salted)", confidence: "Low", reason: "md5$... 形式" });
    }

    // Length-based hex
    const len = trimmed.length;
    if (isHex) {
        if (len === 32) {
            candidates.push({ name: "MD5", confidence: isLowerHex ? "High" : "Medium", reason: "32 桁の 16 進数" });
            candidates.push({ name: "MD4 / NTLM", confidence: "Low", reason: "32 桁の 16 進数 (NTLM などでも使用)" });
        }
        if (len === 40) candidates.push({ name: "SHA-1", confidence: "High", reason: "40 桁の 16 進数" });
        if (len === 56) candidates.push({ name: "SHA-224", confidence: "Medium", reason: "56 桁の 16 進数" });
        if (len === 64) candidates.push({ name: "SHA-256", confidence: "High", reason: "64 桁の 16 進数" });
        if (len === 96) candidates.push({ name: "SHA-384", confidence: "Medium", reason: "96 桁の 16 進数" });
        if (len === 128) candidates.push({ name: "SHA-512", confidence: "High", reason: "128 桁の 16 進数" });
    } else if (isB64) {
        if (len === 22 || len === 24 || len === 27 || len === 44) {
            candidates.push({ name: "Base64-encoded hash", confidence: "Low", reason: `${len} 文字の Base64 っぽい文字列` });
        }
    }

    if (!candidates.length) {
        candidates.push({ name: "Unknown", confidence: "Low", reason: "既知パターンと一致しませんでした。" });
    }
    return candidates;
}

function badgeColor(conf: Candidate["confidence"]) {
    if (conf === "High") return "bg-green-500/20 text-green-200 border-green-500/40";
    if (conf === "Medium") return "bg-amber-500/20 text-amber-200 border-amber-500/40";
    return "bg-gray-500/20 text-gray-200 border-gray-500/40";
}

export default function HashIdentifierPanel() {
    const [input, setInput] = useState("");
    const [mode, setMode] = useState<Mode>("single");
    const [selectedSample, setSelectedSample] = useState("md5");
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<ResultRow[]>([]);
    const [activeHash, setActiveHash] = useState<ResultRow | null>(null);

    useEffect(() => {
        const lines = input.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length > 1) setMode("multi");
    }, [input]);

    function detect() {
        const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (!lines.length) {
            setError("ハッシュ値を入力してください。");
            setResults([]);
            setActiveHash(null);
            return;
        }
        setError(null);
        if (mode === "single") {
            const hash = lines[0];
            if (hash.length < 8) {
                setError("有効なハッシュとして解釈できませんでした。余計な文字や改行が含まれていないか確認してください。");
                return;
            }
            const candidates = detectOne(hash);
            const res = [{ hash, candidates }];
            setResults(res);
            setActiveHash(res[0]);
        } else {
            const res: ResultRow[] = lines.slice(0, 100).map(line => ({
                hash: line,
                candidates: detectOne(line),
            }));
            setResults(res);
            setActiveHash(res[0] || null);
        }
    }

    function clearAll() {
        setInput("");
        setResults([]);
        setActiveHash(null);
        setError(null);
    }

    function loadSample() {
        const sample = SAMPLES[selectedSample];
        if (!sample) return;
        setInput(sample.value);
        setMode("single");
        setTimeout(() => detect(), 0);
    }

    const exportCsv = () => {
        if (!results.length) return;
        const header = "hash,algorithm,confidence,reason\n";
        const rows = results.map(r => r.candidates.map(c => `"${r.hash.replace(/"/g, '""')}",${c.name},${c.confidence},"${c.reason.replace(/"/g, '""')}"`).join("\n")).join("\n");
        const csv = header + rows;
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "hash_detect.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Analyzer</div>
                <h3 className="text-2xl font-bold text-white">Hash Identifier</h3>
                <p className="text-gray-400 text-sm">入力されたハッシュの形式を推定します（長さ・文字種・プレフィックスから判定）。処理はブラウザ内のみで行われます。</p>
            </div>

            {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded-lg text-sm">
                    <AlertCircle size={18} />
                    <div>{error}</div>
                </div>
            )}

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <label className="flex items-center gap-2 text-gray-300">
                        <input type="radio" checked={mode === "single"} onChange={() => setMode("single")} />
                        単一ハッシュ判定
                    </label>
                    <label className="flex items-center gap-2 text-gray-300">
                        <input type="radio" checked={mode === "multi"} onChange={() => setMode("multi")} />
                        複数ハッシュ一括判定
                    </label>
                    <div className="flex items-center gap-2 ml-auto">
                        <select
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-100"
                            value={selectedSample}
                            onChange={e => setSelectedSample(e.target.value)}
                        >
                            {Object.entries(SAMPLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 hover:border-primary-500/60" onClick={loadSample}>Load</button>
                    </div>
                </div>
                <textarea
                    className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[120px]"
                    placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                    <button className="px-4 py-2 bg-primary-500 text-black rounded font-semibold" onClick={detect}>Detect Hash Type</button>
                    <button className="px-3 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700" onClick={clearAll}>
                        <RefreshCcw size={14} className="inline mr-1" /> Clear
                    </button>
                    <button className="px-3 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700" onClick={() => exportCsv()} disabled={!results.length}>
                        <FileDown size={14} className="inline mr-1" /> Export CSV
                    </button>
                </div>
            </div>

            {mode === "single" && activeHash && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                            <Fingerprint size={16} className="text-primary-400" />
                            <span>Hash: <code className="text-gray-100">{shorten(activeHash.hash, 60)}</code></span>
                        </div>
                        <button className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 flex items-center gap-1" onClick={() => navigator.clipboard?.writeText(activeHash.hash)}>
                            <Copy size={14} /> Copy Hash
                        </button>
                    </div>

                    <div className="overflow-auto border border-gray-800 rounded">
                        <table className="min-w-full text-xs text-gray-100">
                            <thead className="bg-gray-800 text-gray-300">
                                <tr>
                                    <th className="px-3 py-2 text-left">Algorithm</th>
                                    <th className="px-3 py-2 text-left">Confidence</th>
                                    <th className="px-3 py-2 text-left">Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeHash.candidates.map((c, idx) => (
                                    <tr key={idx} className="border-t border-gray-800">
                                        <td className="px-3 py-2 font-semibold">{c.name}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-1 rounded border text-xs ${badgeColor(c.confidence)}`}>{c.confidence}</span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-300">{c.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {activeHash.candidates[0] && (
                        <div className="bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-200 space-y-2">
                            <div className="font-semibold text-primary-300">About {activeHash.candidates[0].name}</div>
                            <p className="text-gray-300">{ALGO_INFO[activeHash.candidates[0].name] || "代表的なハッシュ形式です。"}</p>
                        </div>
                    )}
                </div>
            )}

            {mode === "multi" && results.length > 0 && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Fingerprint size={16} className="text-primary-400" />
                        <span>判定結果 ({results.length} 件)</span>
                    </div>
                    <div className="overflow-auto border border-gray-800 rounded">
                        <table className="min-w-full text-xs text-gray-100">
                            <thead className="bg-gray-800 text-gray-300">
                                <tr>
                                    <th className="px-3 py-2 text-left">#</th>
                                    <th className="px-3 py-2 text-left">Hash</th>
                                    <th className="px-3 py-2 text-left">Top Candidate</th>
                                    <th className="px-3 py-2 text-left">Confidence</th>
                                    <th className="px-3 py-2 text-left">Other Candidates</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, idx) => {
                                    const top = r.candidates[0];
                                    const others = Math.max(0, r.candidates.length - 1);
                                    return (
                                        <tr key={idx} className="border-t border-gray-800">
                                            <td className="px-3 py-2">{idx + 1}</td>
                                            <td className="px-3 py-2 break-all">{shorten(r.hash, 40)}</td>
                                            <td className="px-3 py-2 font-semibold">{top?.name || "-"}</td>
                                            <td className="px-3 py-2">
                                                {top && <span className={`px-2 py-1 rounded border text-xs ${badgeColor(top.confidence)}`}>{top.confidence}</span>}
                                            </td>
                                            <td className="px-3 py-2 text-gray-300">{others}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-xs text-gray-400">1行につき先頭 100 行まで判定します。CSV エクスポートで一覧を保存できます。</div>
                </div>
            )}
        </div>
    );
}
