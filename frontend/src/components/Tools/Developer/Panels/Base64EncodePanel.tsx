import { useCallback, useState, DragEvent } from "react";
import { Copy, RefreshCcw, Upload, Download, Link as LinkIcon } from "lucide-react";

type InputMode = "text" | "file";
type TextEncoding = "utf8" | "shift-jis" | "iso-8859-1" | "hex";

const MAX_DISPLAY = 10000;

function toBinaryString(bytes: Uint8Array) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return binary;
}

function bytesToBase64(bytes: Uint8Array) {
    return btoa(toBinaryString(bytes));
}

function wrap76(str: string) {
    return str.replace(/(.{76})/g, "$1\n");
}

function sanitizeBase64(str: string, removePadding: boolean, wrap: boolean) {
    let s = removePadding ? str.replace(/=+$/, "") : str;
    if (wrap) s = wrap76(s);
    return s;
}

function detectMime(file?: File | null) {
    if (file?.type) return file.type;
    return "application/octet-stream";
}

function encodingLabel(enc: TextEncoding) {
    if (enc === "utf8") return "UTF-8";
    if (enc === "shift-jis") return "Shift-JIS";
    if (enc === "iso-8859-1") return "ISO-8859-1";
    return "Hex";
}

export default function Base64EncodePanel() {
    const [mode, setMode] = useState<InputMode>("text");
    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [fileInfo, setFileInfo] = useState("");
    const [encoding, setEncoding] = useState<TextEncoding>("utf8");
    const [trimWhitespace, setTrimWhitespace] = useState(true);
    const [removePadding, setRemovePadding] = useState(false);
    const [wrap76chars, setWrap76chars] = useState(false);

    const [stdB64, setStdB64] = useState("");
    const [urlB64, setUrlB64] = useState("");
    const [mimeB64, setMimeB64] = useState("");
    const [dataUri, setDataUri] = useState("");
    const [info, setInfo] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const samples = [
        { label: "Hello World", value: "Hello World" },
        { label: "日本語", value: "こんにちは" },
        { label: "Hex sample", value: "48656c6c6f", enc: "hex" as TextEncoding },
    ];

    function copy(textValue: string) {
        if (!textValue) return;
        navigator.clipboard?.writeText(textValue);
    }

    const decodeInput = useCallback(
        async (): Promise<Uint8Array | null> => {
            setError(null);
            try {
                if (mode === "text") {
                    let input = text;
                    if (trimWhitespace) input = input.trim();
                    if (!input) throw new Error("エンコードするデータがありません。");
                    if (encoding === "hex") {
                        const cleaned = input.replace(/\s/g, "");
                        if (!/^[0-9a-fA-F]*$/.test(cleaned) || cleaned.length % 2 !== 0) {
                            throw new Error("Hex として解釈できません（奇数桁または無効な文字が含まれています）。");
                        }
                        const bytes = new Uint8Array(cleaned.length / 2);
                        for (let i = 0; i < cleaned.length; i += 2) {
                            bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
                        }
                        return bytes;
                    }
                    // For Shift-JIS/ISO-8859-1 we fall back to UTF-8 for MVP
                    return new TextEncoder().encode(input);
                }

                if (!file) throw new Error("ファイルを選択してください。");
                const buf = await file.arrayBuffer();
                return new Uint8Array(buf);
            } catch (e: any) {
                setError(e?.message || "入力をバイト列に変換できませんでした。");
                return null;
            }
        },
        [encoding, file, mode, text, trimWhitespace]
    );

    const encode = useCallback(
        async (bytes: Uint8Array, mime: string) => {
            const base = bytesToBase64(bytes);
            const urlSafe = base.replace(/\+/g, "-").replace(/\//g, "_");
            const std = sanitizeBase64(base, removePadding, wrap76chars);
            const url = sanitizeBase64(urlSafe, removePadding, false);
            const mimeWrapped = sanitizeBase64(base, removePadding, true);

            const dataUriValue = `data:${mime};base64,${url}`;

            setStdB64(std);
            setUrlB64(url);
            setMimeB64(mimeWrapped);
            setDataUri(dataUriValue);
            setInfo(`Input: ${bytes.length} bytes (${mode === "text" ? encodingLabel(encoding) : "file"})`);
        },
        [encoding, mode, removePadding, wrap76chars]
    );

    async function handleEncode() {
        setLoading(true);
        setError(null);
        setStdB64("");
        setUrlB64("");
        setMimeB64("");
        setDataUri("");
        setInfo("");
        try {
            const bytes = await decodeInput();
            if (!bytes) return;
            const mime = mode === "file" ? detectMime(file) : "text/plain";
            await encode(bytes, mime);
        } finally {
            setLoading(false);
        }
    }

    function handleClear() {
        setText("");
        setFile(null);
        setFileInfo("");
        setStdB64("");
        setUrlB64("");
        setMimeB64("");
        setDataUri("");
        setInfo("");
        setError(null);
    }

    function onFileChange(f?: File | null) {
        if (f) {
            setFile(f);
            setFileInfo(`${f.name} (${(f.size / 1024).toFixed(1)} KB)`);
        } else {
            setFile(null);
            setFileInfo("");
        }
    }

    function onDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) onFileChange(f);
    }

    function limited(value: string) {
        if (value.length <= MAX_DISPLAY) return value;
        return `${value.slice(0, MAX_DISPLAY)}\n... (長いため一部省略)`;
    }
    
    function downloadText(filename: string, content: string) {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <LinkIcon size={18} />
                        Base64 Encode
                    </h4>
                    <p className="text-xs text-gray-400">Text or files → Base64 (standard, URL-safe, MIME, Data URI).</p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1">
                    Local only. No data leaves your browser.
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                        <label className="flex items-center gap-2">
                            <input type="radio" name="b64-mode" value="text" checked={mode === "text"} onChange={() => setMode("text")} />
                            Text
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" name="b64-mode" value="file" checked={mode === "file"} onChange={() => setMode("file")} />
                            File
                        </label>
                    </div>

                    {mode === "text" ? (
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">Input Text</label>
                            <textarea
                                className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[180px]"
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder="ここにエンコードしたいテキストを入力してください。例: Hello World"
                            />
                            <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                                <label className="flex items-center gap-2">
                                    Encoding
                                    <select
                                        className="bg-gray-800 p-2 rounded text-white"
                                        value={encoding}
                                        onChange={e => setEncoding(e.target.value as TextEncoding)}
                                    >
                                        <option value="utf8">UTF-8</option>
                                        <option value="shift-jis">Shift-JIS</option>
                                        <option value="iso-8859-1">ISO-8859-1</option>
                                        <option value="hex">Hex (treat as bytes)</option>
                                    </select>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={trimWhitespace}
                                        onChange={e => setTrimWhitespace(e.target.checked)}
                                    />
                                    Trim whitespace
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">File</label>
                            <div
                                className="border-2 border-dashed border-gray-700 rounded-lg p-4 bg-gray-900 flex flex-col gap-2 text-sm text-gray-300 cursor-pointer hover:border-primary-500/60"
                                onDragOver={e => e.preventDefault()}
                                onDrop={onDrop}
                                onClick={() => document.getElementById("b64-file-input")?.click()}
                            >
                                <Upload size={18} className="text-gray-400" />
                                <p className="text-gray-400">ここにファイルをドロップ、またはクリックして選択</p>
                                <p className="text-xs text-gray-500">{fileInfo || "No file selected"}</p>
                                <input
                                    id="b64-file-input"
                                    className="hidden"
                                    type="file"
                                    onChange={e => onFileChange(e.target.files?.[0] || null)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                        <button
                            className="px-4 py-2 bg-primary-500 rounded text-black font-semibold disabled:opacity-60"
                            onClick={handleEncode}
                            disabled={loading}
                        >
                            {loading ? "Encoding..." : "Encode"}
                        </button>
                        <button
                            className="px-3 py-2 bg-gray-800 rounded text-gray-200 hover:bg-gray-700"
                            onClick={handleClear}
                        >
                            <RefreshCcw size={14} className="inline mr-1" />
                            Clear
                        </button>
                        <div className="flex gap-2 flex-wrap text-xs">
                            {samples.map(s => (
                                <button
                                    key={s.label}
                                    className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-gray-200 hover:border-primary-500/60"
                                    onClick={() => {
                                        setMode("text");
                                        setEncoding(s.enc || "utf8");
                                        setText(s.value);
                                    }}
                                >
                                    Load {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={removePadding} onChange={e => setRemovePadding(e.target.checked)} />
                            Remove '=' padding (URL-safe)
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={wrap76chars} onChange={e => setWrap76chars(e.target.checked)} />
                            Insert line breaks every 76 chars
                        </label>
                    </div>

                    {error && <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded text-sm">{error}</div>}
                    {info && <div className="text-xs text-gray-400">{info}</div>}
                </div>

                <div className="space-y-3">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-300">
                            <span>Standard Base64</span>
                            <div className="flex gap-2">
                                <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={() => copy(stdB64)}>
                                    <Copy size={12} className="inline mr-1" /> Copy
                                </button>
                            </div>
                        </div>
                        <textarea
                            readOnly
                            className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-xs text-gray-100 min-h-[80px]"
                            value={limited(stdB64)}
                            placeholder="Encoded Base64 will appear here"
                        />
                        {stdB64 && <p className="text-[11px] text-gray-500">Length: {stdB64.length} chars</p>}
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-300">
                            <span>URL-safe Base64</span>
                            <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={() => copy(urlB64)}>
                                <Copy size={12} className="inline mr-1" /> Copy
                            </button>
                        </div>
                        <textarea
                            readOnly
                            className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-xs text-gray-100 min-h-[80px]"
                            value={limited(urlB64)}
                            placeholder="URL-safe Base64"
                        />
                        {urlB64 && <p className="text-[11px] text-gray-500">Length: {urlB64.length} chars</p>}
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-300">
                            <span>MIME Base64 (76 chars/line)</span>
                            <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={() => copy(mimeB64)}>
                                <Copy size={12} className="inline mr-1" /> Copy
                            </button>
                        </div>
                        <textarea
                            readOnly
                            className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-xs text-gray-100 min-h-[80px]"
                            value={limited(mimeB64)}
                            placeholder="MIME-wrapped Base64"
                        />
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-300">
                            <span>Data URI</span>
                            <div className="flex gap-2">
                                <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={() => copy(dataUri)}>
                                    <Copy size={12} className="inline mr-1" /> Copy
                                </button>
                                <button
                                    className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200"
                                    disabled={!dataUri}
                                    onClick={() => downloadText("data-uri.txt", dataUri)}
                                >
                                    <Download size={12} className="inline mr-1" /> Save
                                </button>
                            </div>
                        </div>
                        <textarea
                            readOnly
                            className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-xs text-gray-100 min-h-[80px]"
                            value={limited(dataUri)}
                            placeholder="data:text/plain;base64,..."
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
