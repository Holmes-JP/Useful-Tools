import { useMemo, useState } from "react";
import { Copy, RefreshCcw, Link as LinkIcon, Info } from "lucide-react";

type Mode = "encode" | "decode";
type Strategy = "encodeURIComponent" | "encodeURI" | "form";

const symbolTable = [
    { char: "space", encoded: "%20 / +" },
    { char: "&", encoded: "%26" },
    { char: "=", encoded: "%3D" },
    { char: "?", encoded: "%3F" },
    { char: "/", encoded: "%2F" },
    { char: ":", encoded: "%3A" },
];

function detectEncoded(str: string) {
    const percentCount = (str.match(/%[0-9A-Fa-f]{2}/g) || []).length;
    return percentCount >= Math.max(1, Math.floor(str.length * 0.05));
}

function tryDecode(str: string, plusAsSpace: boolean) {
    try {
        const s = plusAsSpace ? str.replace(/\+/g, " ") : str;
        return decodeURIComponent(s);
    } catch {
        return null;
    }
}

function tryEncode(str: string, strategy: Strategy, plusAsSpace: boolean) {
    const f = strategy === "encodeURI" ? encodeURI : encodeURIComponent;
    let encoded = f(str);
    if (strategy === "form") {
        encoded = encodeURIComponent(str).replace(/%20/g, "+");
    }
    if (!plusAsSpace) encoded = encoded.replace(/\+/g, "%2B");
    return encoded;
}

export default function UrlEncoderPanel() {
    const [input, setInput] = useState("日本語 & param=1 2 3");
    const [output, setOutput] = useState("");
    const [mode, setMode] = useState<Mode>("encode");
    const [strategy, setStrategy] = useState<Strategy>("encodeURIComponent");
    const [plusAsSpace, setPlusAsSpace] = useState(true);
    const [autoDetect, setAutoDetect] = useState(true);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [doubleEncoded, setDoubleEncoded] = useState<string | null>(null);

    function copy(text: string) {
        if (!text) return;
        navigator.clipboard?.writeText(text);
    }

    function handleTransform(direction?: Mode) {
        const useMode = direction || mode;
        const text = input;
        if (useMode === "encode") {
            const encoded = tryEncode(text, strategy, plusAsSpace);
            setOutput(encoded);
            const decodedAgain = tryDecode(encoded, plusAsSpace);
            if (decodedAgain && detectEncoded(decodedAgain)) {
                setDoubleEncoded(`多重エンコードの可能性: ${decodedAgain}`);
            } else {
                setDoubleEncoded(null);
            }
        } else {
            const decoded = tryDecode(text, plusAsSpace);
            if (decoded === null) {
                setOutput("Invalid percent-encoding detected.");
                setDoubleEncoded(null);
                return;
            }
            setOutput(decoded);
            if (detectEncoded(decoded)) {
                setDoubleEncoded(`デコード後も %xx が残っています。さらにデコードで元に戻る可能性があります。 → ${tryDecode(decoded, plusAsSpace) || ""}`);
            } else {
                setDoubleEncoded(null);
            }
        }
    }

    function handleClear() {
        setInput("");
        setOutput("");
        setSuggestion(null);
        setDoubleEncoded(null);
    }

    useMemo(() => {
        if (!autoDetect) {
            setSuggestion(null);
            return;
        }
        const looksEncoded = detectEncoded(input);
        setSuggestion(looksEncoded ? "エンコード文字列と判定 → Decode を推奨" : "平文と判定 → Encode を推奨");
    }, [autoDetect, input]);

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <LinkIcon size={18} /> URL Encoder / Decoder
                    </h4>
                    <p className="text-xs text-gray-400">encodeURIComponent / encodeURI / form-urlencoded (+ as space) に対応。</p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1">双方向で変換できます</div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded px-3 py-2">
                    <label className="flex items-center gap-2">
                        <input type="radio" name="mode" value="encode" checked={mode === "encode"} onChange={() => setMode("encode")} />
                        Encode
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="radio" name="mode" value="decode" checked={mode === "decode"} onChange={() => setMode("decode")} />
                        Decode
                    </label>
                </div>
                <label className="flex items-center gap-2">
                    Strategy
                    <select className="bg-gray-900 border border-gray-800 rounded p-2 text-white" value={strategy} onChange={e => setStrategy(e.target.value as Strategy)}>
                        <option value="encodeURIComponent">encodeURIComponent</option>
                        <option value="encodeURI">encodeURI</option>
                        <option value="form">Form URL Encoded (+ as space)</option>
                    </select>
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={plusAsSpace} onChange={e => setPlusAsSpace(e.target.checked)} />
                    Treat + as space
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={autoDetect} onChange={e => setAutoDetect(e.target.checked)} />
                    Auto detect encoded input
                </label>
                {suggestion && <span className="text-xs text-primary-400 flex items-center gap-1"><Info size={12} /> {suggestion}</span>}
            </div>

            <div className="space-y-2">
                <label className="text-sm text-gray-300">Original Input</label>
                <textarea
                    className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[140px]"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="日本語 & param=1 2 3"
                />
            </div>

            <div className="flex gap-2 flex-wrap">
                <button className="px-4 py-2 bg-primary-500 rounded text-black font-semibold" onClick={() => handleTransform("encode")}>
                    Encode
                </button>
                <button className="px-4 py-2 bg-primary-500 rounded text-black font-semibold" onClick={() => handleTransform("decode")}>
                    Decode
                </button>
                <button className="px-3 py-2 bg-gray-800 rounded text-gray-200 hover:bg-gray-700" onClick={handleClear}>
                    <RefreshCcw size={14} className="inline mr-1" />
                    Clear
                </button>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-300">
                    <label>Output</label>
                    <div className="flex gap-2">
                        <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={() => copy(output)}>
                            <Copy size={12} className="inline mr-1" /> Copy
                        </button>
                        <button
                            className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200"
                            onClick={() => {
                                setInput(output);
                                setOutput("");
                            }}
                        >
                            Swap (set as input)
                        </button>
                    </div>
                </div>
                <textarea
                    className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[140px]"
                    value={output}
                    onChange={e => setOutput(e.target.value)}
                    placeholder="Encoded/Decoded result"
                />
                {doubleEncoded && <p className="text-xs text-amber-300">{doubleEncoded}</p>}
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
                <h5 className="text-sm font-semibold text-gray-300 mb-2">記号エスケープ一覧</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-200">
                    {symbolTable.map(item => (
                        <div key={item.char} className="flex items-center justify-between bg-gray-950 border border-gray-800 rounded p-2">
                            <span>{item.char}</span>
                            <span className="text-primary-400">{item.encoded}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
