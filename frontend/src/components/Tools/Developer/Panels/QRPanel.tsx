import { useState, useRef, DragEvent } from "react";
import { Copy, Download, RefreshCcw, Upload, QrCode } from "lucide-react";
import { useQRGenerator } from "../../../../hooks/useQRGenerator";
import { EC_LEVELS, ErrorCorrectionLevel, QRGenerateResult } from "../../../../types/qr";

export default function QRPanel() {
    const [qrTab, setQrTab] = useState<"generate" | "decode">("generate");

    const [generateText, setGenerateText] = useState("https://example.com");
    const [encoding, setEncoding] = useState<"utf8" | "shift-jis" | "binary">("utf8");
    const [ecLevel, setEcLevel] = useState<ErrorCorrectionLevel>("M");
    const [qrSize, setQrSize] = useState(256);
    const [margin, setMargin] = useState(2);
    const [fgColor, setFgColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("#ffffff");
    const [transparentBg, setTransparentBg] = useState(false);
    const [generated, setGenerated] = useState<QRGenerateResult | null>(null);
    const [genError, setGenError] = useState<string | null>(null);
    const [genLoading, setGenLoading] = useState(false);

    const [decodeError, setDecodeError] = useState<string | null>(null);
    const [decodedText, setDecodedText] = useState<string | null>(null);
    const [decodeLoading, setDecodeLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { generateQR, decodeQR, downloadQR, generateWifiQR, generatevCard } = useQRGenerator();

    const samples = [
        { label: "URL", value: "https://example.com" },
        { label: "WiFi", value: generateWifiQR("MySSID", "mypassword", "WPA") },
        { label: "Text", value: "Hello World" },
        {
            label: "vCard",
            value: generatevCard("Jane Doe", "+1-555-0101", "jane@example.com", "https://example.com", "1-2-3 Tokyo", "Example Inc"),
        },
    ];

    async function handleGenerate() {
        setGenError(null);
        setGenLoading(true);
        setGenerated(null);
        try {
            const res = await generateQR({
                text: generateText,
                size: qrSize,
                errorCorrectionLevel: ecLevel,
                margin,
                foregroundColor: fgColor,
                backgroundColor: bgColor,
                transparentBackground: transparentBg,
                encoding,
            });
            setGenerated(res);
        } catch (e: any) {
            setGenError(e?.message || "QR generation failed");
        } finally {
            setGenLoading(false);
        }
    }

    async function copyImageToClipboard(dataUrl: string) {
        try {
            if (typeof ClipboardItem === "undefined" || !navigator.clipboard) return;
            const resp = await fetch(dataUrl);
            const blob = await resp.blob();
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        } catch (e) {
            console.error(e);
        }
    }

    async function handleDecodeFile(file: File) {
        setDecodeError(null);
        setDecodeLoading(true);
        setDecodedText(null);
        const result = await decodeQR(file);
        setDecodeLoading(false);
        if (result.isValid) {
            setDecodedText(result.text);
        } else {
            setDecodeError(result.error || "QRコードを検出できませんでした。画像サイズやコントラストを確認してください。");
        }
    }

    function onDropFile(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) {
            handleDecodeFile(e.dataTransfer.files[0]);
        }
    }

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <QrCode size={18} />
                        QR Code Generator / Decoder
                    </h4>
                    <p className="text-xs text-gray-400">Generate or decode QR codes locally in your browser.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border ${qrTab === "generate" ? "bg-primary-500 text-black border-primary-500" : "bg-gray-800 text-gray-200 border-gray-700 hover:border-primary-500/60"}`}
                        onClick={() => setQrTab("generate")}
                    >
                        Generate
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border ${qrTab === "decode" ? "bg-primary-500 text-black border-primary-500" : "bg-gray-800 text-gray-200 border-gray-700 hover:border-primary-500/60"}`}
                        onClick={() => setQrTab("decode")}
                    >
                        Decode
                    </button>
                </div>
            </div>

            {qrTab === "generate" ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-400">All processing happens in your browser.</p>
                        <div className="flex gap-2 flex-wrap justify-end">
                            {samples.map(s => (
                                <button
                                    key={s.label}
                                    className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 hover:border-primary-500/60"
                                    onClick={() => setGenerateText(s.value)}
                                >
                                    Load {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">Data</label>
                        <textarea
                            className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[140px]"
                            value={generateText}
                            onChange={e => setGenerateText(e.target.value)}
                            placeholder="https://example.com&#10;WIFI:T:WPA;S:MySSID;P:mypassword;;"
                        />
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                            <label className="flex items-center gap-2">
                                Encoding
                                <select
                                    className="bg-gray-800 p-2 rounded text-white"
                                    value={encoding}
                                    onChange={e => setEncoding(e.target.value as any)}
                                >
                                    <option value="utf8">UTF-8</option>
                                    <option value="shift-jis">Shift-JIS</option>
                                    <option value="binary">Binary (hex)</option>
                                </select>
                            </label>
                            <label className="flex items-center gap-2">
                                Error correction
                                <select
                                    className="bg-gray-800 p-2 rounded text-white"
                                    value={ecLevel}
                                    onChange={e => setEcLevel(e.target.value as ErrorCorrectionLevel)}
                                >
                                    {Object.entries(EC_LEVELS).map(([level, meta]) => (
                                        <option key={level} value={level}>
                                            {meta.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex items-center gap-2">
                                Size
                                <input
                                    type="number"
                                    min={128}
                                    max={1024}
                                    step={32}
                                    value={qrSize}
                                    onChange={e => setQrSize(Number(e.target.value))}
                                    className="w-24 bg-gray-800 p-2 rounded text-white"
                                />
                            </label>
                            <label className="flex items-center gap-2">
                                Margin
                                <input
                                    type="range"
                                    min={0}
                                    max={8}
                                    value={margin}
                                    onChange={e => setMargin(Number(e.target.value))}
                                    className="accent-primary-500"
                                />
                                <span>{margin}px</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">Foreground</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-12 h-10 rounded" />
                                <span className="text-xs text-gray-400">{fgColor}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">Background</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={bgColor}
                                    disabled={transparentBg}
                                    onChange={e => setBgColor(e.target.value)}
                                    className="w-12 h-10 rounded"
                                />
                                <span className="text-xs text-gray-400">{transparentBg ? "transparent" : bgColor}</span>
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input type="checkbox" checked={transparentBg} onChange={e => setTransparentBg(e.target.checked)} />
                            Transparent background (PNG)
                        </label>
                    </div>

                    {genError && <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded text-sm">{genError}</div>}

                    <div className="flex gap-2 flex-wrap">
                        <button
                            className="px-4 py-2 bg-primary-500 rounded text-black font-semibold disabled:opacity-60"
                            onClick={handleGenerate}
                            disabled={genLoading}
                        >
                            {genLoading ? "Generating..." : "Generate QR"}
                        </button>
                        <button
                            className="px-3 py-2 bg-gray-800 rounded text-gray-200 hover:bg-gray-700"
                            onClick={() => {
                                setGenerateText("");
                                setGenerated(null);
                                setGenError(null);
                            }}
                        >
                            <RefreshCcw size={14} className="inline mr-1" />
                            Clear
                        </button>
                    </div>

                    {generated && (
                        <div className="space-y-3 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-300">Result</h4>
                            <div className="flex justify-center bg-white p-4 rounded">
                                <img src={generated.dataUrl} alt="Generated QR" style={{ maxWidth: "100%", maxHeight: 320 }} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-400">
                                <div>Data size: {generated.dataSize} bytes</div>
                                <div>Error correction: {generated.errorCorrectionLevel}</div>
                                <div>Size: {generated.size}x{generated.size}px</div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm hover:bg-gray-700"
                                    onClick={() => downloadQR(generated.dataUrl, "qr.png", "png")}
                                >
                                    <Download size={14} className="inline mr-1" /> Download PNG
                                </button>
                                <button
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm hover:bg-gray-700"
                                    onClick={() => downloadQR(generated.svgString, "qr.svg", "svg")}
                                >
                                    <Download size={14} className="inline mr-1" /> Download SVG
                                </button>
                                <button
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm hover:bg-gray-700"
                                    onClick={() => navigator.clipboard?.writeText(generated.base64)}
                                >
                                    <Copy size={14} className="inline mr-1" /> Copy Base64
                                </button>
                                <button
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm hover:bg-gray-700 disabled:opacity-50"
                                    disabled={!navigator.clipboard}
                                    onClick={() => copyImageToClipboard(generated.dataUrl)}
                                >
                                    <Copy size={14} className="inline mr-1" /> Copy Image
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">Upload or drop an image (PNG/JPEG/WebP).</p>
                    </div>

                    <div
                        className="flex items-center justify-center border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-primary-500/60 cursor-pointer"
                        onDragOver={e => e.preventDefault()}
                        onDrop={onDropFile}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleDecodeFile(e.target.files[0])} />
                        <div className="text-center text-gray-400">
                            <Upload size={24} className="mx-auto mb-2" />
                            <p className="text-sm">Click to choose or drop an image</p>
                            <p className="text-xs text-gray-500">PNG / JPEG / WebP</p>
                        </div>
                    </div>

                    {decodeError && (
                        <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded-lg text-sm space-y-1">
                            <p>{decodeError}</p>
                            <p className="text-xs text-red-300">Tips: make the QR larger, increase contrast, or use error level H when embedding a logo.</p>
                        </div>
                    )}

                    {decodeLoading && <div className="text-center text-gray-400">Decoding...</div>}

                    {decodedText && (
                        <div className="space-y-3 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-300">Decoded Text</h4>
                            <div className="bg-gray-950 border border-gray-800 rounded p-3">
                                <p className="text-gray-100 text-sm break-words">{decodedText}</p>
                            </div>
                            <button
                                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm hover:bg-gray-700"
                                onClick={() => navigator.clipboard?.writeText(decodedText)}
                            >
                                <Copy size={14} className="inline mr-1" /> Copy
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

