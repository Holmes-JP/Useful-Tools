import { useMemo, useState } from "react";
import { AlertCircle, Copy, RefreshCcw } from "lucide-react";

type DetectResult = {
    base64: { valid: boolean; error?: string; decoded?: Uint8Array };
    hex: { valid: boolean; error?: string; decoded?: Uint8Array };
    url: { valid: boolean; error?: string; decoded?: string };
    plain: boolean;
};

function tryBase64(input: string) {
    try {
        const cleaned = input.replace(/\s+/g, "");
        if (!/^[A-Za-z0-9+/=]+$/.test(cleaned) || cleaned.length % 4 !== 0) throw new Error("Invalid base64 characters or length");
        const bin = atob(cleaned);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return { valid: true, decoded: bytes } as const;
    } catch (e: any) {
        return { valid: false, error: e?.message || "Base64 decode failed" } as const;
    }
}

function tryHex(input: string) {
    try {
        const cleaned = input.replace(/\s+/g, "");
        if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0) throw new Error("Invalid hex or odd length");
        const bytes = new Uint8Array(cleaned.length / 2);
        for (let i = 0; i < cleaned.length; i += 2) {
            bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
        }
        return { valid: true, decoded: bytes } as const;
    } catch (e: any) {
        return { valid: false, error: e?.message || "Hex decode failed" } as const;
    }
}

function tryUrl(input: string, plusAsSpace: boolean) {
    try {
        const decoded = decodeURIComponent(plusAsSpace ? input.replace(/\+/g, " ") : input);
        return { valid: true, decoded } as const;
    } catch (e: any) {
        return { valid: false, error: e?.message || "URL decode failed" } as const;
    }
}

function bytesToHex(bytes?: Uint8Array) {
    if (!bytes) return "";
    return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join(" ");
}

function bytesToUtf8(bytes?: Uint8Array) {
    if (!bytes) return "";
    try {
        return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } catch {
        return "";
    }
}

function hexDump(bytes?: Uint8Array, bytesPerLine = 16) {
    if (!bytes) return "";
    let out = "";
    for (let i = 0; i < bytes.length; i += bytesPerLine) {
        const slice = bytes.slice(i, i + bytesPerLine);
        const hex = Array.from(slice).map(b => b.toString(16).padStart(2, "0")).join(" ");
        const ascii = Array.from(slice).map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : ".")).join("");
        out += `${i.toString(16).padStart(8, "0")}  ${hex.padEnd(bytesPerLine * 3 - 1, " ")}  |${ascii}|\n`;
    }
    return out.trimEnd();
}

function copyText(text: string) {
    if (!text) return;
    try {
        if (navigator && typeof navigator.clipboard?.writeText === "function") {
            navigator.clipboard.writeText(text).catch(() => {});
            return;
        }
    } catch {}
    // Fallback
    try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
    } catch {}
}

export default function EncodingInspectorPanel() {
    const [input, setInput] = useState("");
    const [plusAsSpace, setPlusAsSpace] = useState(true);
    const [autoAnalyze, setAutoAnalyze] = useState(true);
    const [analyzeKey, setAnalyzeKey] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [encodeInput, setEncodeInput] = useState("");

    const shouldAnalyze = useMemo(() => (autoAnalyze ? input : analyzeKey), [autoAnalyze, input, analyzeKey]);

    const detected = useMemo<DetectResult>(() => {
        if (!shouldAnalyze) return { base64: { valid: false }, hex: { valid: false }, url: { valid: false }, plain: true };
        const base64 = tryBase64(input);
        const hex = tryHex(input);
        const url = tryUrl(input, plusAsSpace);
        const plain = !base64.valid && !hex.valid && !url.valid;
        return { base64, hex, url, plain };
    }, [shouldAnalyze, input, plusAsSpace]);

    function clearAll() {
        setInput("");
        setError(null);
        setAnalyzeKey(k => k + 1);
    }

    function loadSample(value: string) {
        setInput(value);
        setAnalyzeKey(k => k + 1);
    }

    function runAnalyze() {
        setAnalyzeKey(k => k + 1);
    }

    const printableRatio = useMemo(() => {
        const utf8 = detected.base64.valid ? bytesToUtf8(detected.base64.decoded) : detected.hex.valid ? bytesToUtf8(detected.hex.decoded) : input;
        if (!utf8) return null;
        const chars = utf8.split("");
        const printable = chars.filter(c => {
            const code = c.charCodeAt(0);
            return code >= 32 && code <= 126;
        }).length;
        return Math.round((printable / chars.length) * 100);
    }, [detected, input]);

    const base64HexDump = useMemo(() => hexDump(detected.base64.decoded?.slice(0, 256)), [detected]);
    const hexHexDump = useMemo(() => hexDump(detected.hex.decoded?.slice(0, 256)), [detected]);

    const encodedUtils = useMemo(() => {
        const b64 = btoa(encodeInput);
        const hex = Array.from(new TextEncoder().encode(encodeInput)).map(b => b.toString(16).padStart(2, "0")).join(" ");
        const url = encodeURIComponent(encodeInput);
        return { b64, hex, url };
    }, [encodeInput]);

    return (
        <div className="space-y-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">Analyzer</div>
            <h3 className="text-2xl font-bold text-white">Base64 / Hex / URL Encode 判定・デコード</h3>
            <p className="text-gray-400 text-sm">文字列を貼り付けてエンコード形式を判定し、デコード結果をまとめて表示します（ブラウザ内処理のみ）。</p>

            {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded-lg text-sm">
                    <AlertCircle size={18} />
                    <div>{error}</div>
                </div>
            )}

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100" onClick={() => loadSample("SGVsbG8gV29ybGQh")}>
                        Load Sample (Base64)
                    </button>
                    <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100" onClick={() => loadSample("48656c6c6f20576f726c64")}>
                        Load Sample (Hex)
                    </button>
                    <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100" onClick={() => loadSample("%48%65%6C%6C%6F%20World")}>
                        Load Sample (URL)
                    </button>
                    <div className="flex items-center gap-2 ml-auto text-sm">
                        <label className="flex items-center gap-1 text-gray-300">
                            <input type="checkbox" checked={plusAsSpace} onChange={e => setPlusAsSpace(e.target.checked)} />
                            Treat "+" as space
                        </label>
                        <label className="flex items-center gap-1 text-gray-300">
                            <input type="checkbox" checked={autoAnalyze} onChange={e => setAutoAnalyze(e.target.checked)} />
                            Auto analyze
                        </label>
                        <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100" onClick={runAnalyze}>
                            Analyze
                        </button>
                        <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100" onClick={clearAll}>
                            <RefreshCcw size={14} className="inline mr-1" /> Clear
                        </button>
                    </div>
                </div>
                <textarea
                    className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[140px] font-mono"
                    placeholder="SGVsbG8gV29ybGQh"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onPaste={() => autoAnalyze && setAnalyzeKey(k => k + 1)}
                />
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-2">
                <div className="text-sm text-gray-300 font-semibold">Detected Encodings</div>
                <div className="text-sm text-gray-200 space-y-1">
                    <div>{detected.base64.valid ? "✔ Base64 (valid)" : `✘ Base64: ${detected.base64.error || "invalid"}`}</div>
                    <div>{detected.hex.valid ? "✔ Hex (valid)" : `✘ Hex: ${detected.hex.error || "invalid"}`}</div>
                    <div>{detected.url.valid ? "✔ URL-encoded (valid)" : `✘ URL: ${detected.url.error || "invalid"}`}</div>
                    {detected.plain && <div>Plain text (No encoding detected)</div>}
                </div>
                {printableRatio !== null && (
                    <div className="text-xs text-gray-400">Printable: {printableRatio}%</div>
                )}
            </div>

            {detected.base64.valid && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        Base64 Decoded
                        <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-xs" onClick={() => copyText(bytesToUtf8(detected.base64.decoded))}><Copy size={12} className="inline mr-1" />Copy UTF-8</button>
                        <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-xs" onClick={() => copyText(bytesToHex(detected.base64.decoded))}><Copy size={12} className="inline mr-1" />Copy Hex</button>
                    </div>
                    <div className="text-xs text-gray-100 break-words bg-gray-950 border border-gray-800 rounded p-2">
                        {bytesToUtf8(detected.base64.decoded)}
                    </div>
                    <div className="text-xs text-gray-300">Hex: {bytesToHex(detected.base64.decoded)}</div>
                    <pre className="bg-gray-950 border border-gray-800 rounded p-2 text-[11px] text-gray-100 overflow-auto">{base64HexDump || "Hex dump unavailable"}</pre>
                    <div className="text-xs text-gray-400">length: {detected.base64.decoded?.length || 0} bytes</div>
                </div>
            )}

            {detected.hex.valid && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        Hex Decoded
                        <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-xs" onClick={() => copyText(bytesToUtf8(detected.hex.decoded))}><Copy size={12} className="inline mr-1" />Copy UTF-8</button>
                        <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-xs" onClick={() => copyText(bytesToHex(detected.hex.decoded))}><Copy size={12} className="inline mr-1" />Copy Hex</button>
                    </div>
                    <div className="text-xs text-gray-100 break-words bg-gray-950 border border-gray-800 rounded p-2">
                        {bytesToUtf8(detected.hex.decoded)}
                    </div>
                    <div className="text-xs text-gray-300">Bytes: {bytesToHex(detected.hex.decoded)}</div>
                    <pre className="bg-gray-950 border border-gray-800 rounded p-2 text-[11px] text-gray-100 overflow-auto">{hexHexDump || "Hex dump unavailable"}</pre>
                    <div className="text-xs text-gray-400">length: {detected.hex.decoded?.length || 0} bytes</div>
                </div>
            )}

            {detected.url.valid && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        URL Decoded
                        <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-xs" onClick={() => copyText(detected.url.decoded || "")}><Copy size={12} className="inline mr-1" />Copy</button>
                    </div>
                    <div className="text-xs text-gray-100 break-words bg-gray-950 border border-gray-800 rounded p-2">
                        {detected.url.decoded}
                    </div>
                </div>
            )}

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-2">
                <div className="text-sm text-gray-300 font-semibold">Encode Utility</div>
                <input
                    className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-sm text-gray-100"
                    placeholder="Hello"
                    value={encodeInput}
                    onChange={e => setEncodeInput(e.target.value)}
                />
                <div className="text-xs text-gray-300">Base64: {encodedUtils.b64} <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-xs" onClick={() => copyText(encodedUtils.b64)}><Copy size={12} className="inline mr-1" />Copy</button></div>
                <div className="text-xs text-gray-300">Hex: {encodedUtils.hex} <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-xs" onClick={() => copyText(encodedUtils.hex)}><Copy size={12} className="inline mr-1" />Copy</button></div>
                <div className="text-xs text-gray-300">URL: {encodedUtils.url} <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-xs" onClick={() => copyText(encodedUtils.url)}><Copy size={12} className="inline mr-1" />Copy</button></div>
            </div>

            <div className="text-xs text-gray-500 flex items-center gap-2">
                <AlertCircle size={14} />
                入力はブラウザ内のみで処理されます。Paste→自動判定→デコード結果を確認できます。
            </div>
        </div>
    );
}
