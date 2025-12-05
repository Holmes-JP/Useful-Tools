import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, FileSearch, RefreshCcw, ShieldAlert } from "lucide-react";

type Status = "match" | "warn" | "mismatch";
type Tab = "overview" | "signature" | "preview";

type AnalyzedFile = {
    id: string;
    file: File;
    name: string;
    ext: string;
    size: number;
    typeLabel: string;
    mime: string;
    status: Status;
    statusMessage: string;
    magicReason: string;
    hexDump: string;
    previewText?: string;
    previewImage?: string;
    isText: boolean;
};

const MAX_FILES = 20;
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

const EXT_EXPECTED: Record<string, { mime: string; label: string }> = {
    jpg: { mime: "image/jpeg", label: "JPEG 画像" },
    jpeg: { mime: "image/jpeg", label: "JPEG 画像" },
    png: { mime: "image/png", label: "PNG 画像" },
    gif: { mime: "image/gif", label: "GIF 画像" },
    webp: { mime: "image/webp", label: "WebP 画像" },
    pdf: { mime: "application/pdf", label: "PDF ドキュメント" },
    zip: { mime: "application/zip", label: "ZIP アーカイブ" },
    mp4: { mime: "video/mp4", label: "MP4 動画" },
    mp3: { mime: "audio/mpeg", label: "MP3 音声" },
    txt: { mime: "text/plain", label: "テキスト" },
    docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Office 文書 (docx)" },
    xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "Office 文書 (xlsx)" },
    pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", label: "Office 文書 (pptx)" },
};

function formatSize(bytes: number) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
}

function getExtension(name: string) {
    const idx = name.lastIndexOf(".");
    return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

function hexDump(bytes: Uint8Array, bytesPerLine = 16) {
    let out = "";
    for (let i = 0; i < bytes.length; i += bytesPerLine) {
        const slice = bytes.slice(i, i + bytesPerLine);
        const hex = Array.from(slice).map(b => b.toString(16).padStart(2, "0")).join(" ");
        const ascii = Array.from(slice)
            .map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
            .join("");
        out += `${i.toString(16).padStart(8, "0")}  ${hex.padEnd(bytesPerLine * 3 - 1, " ")}  |${ascii}|\n`;
    }
    return out.trimEnd();
}

function detectType(bytes: Uint8Array): { label: string; mime: string; reason: string } {
    const b = bytes;
    const startsWith = (...vals: number[]) => vals.every((v, i) => b[i] === v);

    if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { label: "PNG 画像", mime: "image/png", reason: "89 50 4E 47 ('PNG')" };
    if (startsWith(0xff, 0xd8, 0xff)) return { label: "JPEG 画像", mime: "image/jpeg", reason: "FF D8 FF (JPEG SOI)" };
    if (startsWith(0x47, 0x49, 0x46, 0x38)) return { label: "GIF 画像", mime: "image/gif", reason: "GIF8 シグネチャ" };
    if (startsWith(0x52, 0x49, 0x46, 0x46) && b.slice(8, 12).toString() === "87,69,66,80") return { label: "WebP 画像", mime: "image/webp", reason: "RIFF....WEBP" };
    if (startsWith(0x25, 0x50, 0x44, 0x46)) return { label: "PDF ドキュメント", mime: "application/pdf", reason: "%PDF-" };
    if (startsWith(0x50, 0x4b, 0x03, 0x04) || startsWith(0x50, 0x4b, 0x05, 0x06) || startsWith(0x50, 0x4b, 0x07, 0x08)) return { label: "ZIP アーカイブ", mime: "application/zip", reason: "PK\x03\x04 (ZIP)" };
    if (startsWith(0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c)) return { label: "7z アーカイブ", mime: "application/x-7z-compressed", reason: "7z シグネチャ" };
    if (startsWith(0x1f, 0x8b)) return { label: "GZIP 圧縮", mime: "application/gzip", reason: "1F 8B (GZIP)" };
    if (startsWith(0x4d, 0x5a)) return { label: "Windows 実行ファイル (PE)", mime: "application/vnd.microsoft.portable-executable", reason: "MZ ヘッダ" };
    if (startsWith(0x7f, 0x45, 0x4c, 0x46)) return { label: "Linux ELF バイナリ", mime: "application/x-elf", reason: "7F 45 4C 46 (ELF)" };
    if (startsWith(0x43, 0x57, 0x53)) return { label: "SWF/Flash", mime: "application/x-shockwave-flash", reason: "CWS/FWS ヘッダ" };
    if (startsWith(0xd4, 0xc3, 0xb2, 0xa1) || startsWith(0xa1, 0xb2, 0xc3, 0xd4)) return { label: "PCAP キャプチャ", mime: "application/vnd.tcpdump.pcap", reason: "PCAP マジック" };

    // Text detection
    const sample = b.slice(0, 512);
    const nulCount = sample.filter(x => x === 0).length;
    const printable = sample.filter(x => x >= 9 && x <= 126 || x === 10 || x === 13).length;
    const textRatio = sample.length ? printable / sample.length : 0;
    if (nulCount === 0 && textRatio > 0.8) return { label: "テキストファイル (推定)", mime: "text/plain", reason: "NUL なし、印字可能文字が多い" };

    return { label: "未知/未判定", mime: "application/octet-stream", reason: "既知のマジックと一致しません" };
}

function statusFrom(ext: string, detected: { label: string; mime: string }) {
    const expected = EXT_EXPECTED[ext];
    if (!ext) return { status: "warn" as Status, message: "拡張子なし / 判定困難" };
    if (!expected) return { status: "warn" as Status, message: `拡張子 .${ext} は未マップ。中身: ${detected.label}` };
    if (expected.mime === detected.mime || expected.label === detected.label) return { status: "match" as Status, message: "拡張子と実際のファイル種別は一致しています。" };
    return { status: "mismatch" as Status, message: `拡張子は ".${ext}" ですが、実際は "${detected.label}" と判定されました。` };
}

function badge(status: Status) {
    if (status === "match") return { color: "bg-green-500/20 text-green-200 border-green-500/40", text: "正常" };
    if (status === "warn") return { color: "bg-amber-500/20 text-amber-200 border-amber-500/40", text: "要注意" };
    return { color: "bg-red-500/20 text-red-200 border-red-500/40", text: "不一致" };
}

export default function FileTypeAnalyzerPanel() {
    const [files, setFiles] = useState<AnalyzedFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>("overview");

    const activeFile = useMemo(() => files.find(f => f.id === activeId) || files[0], [files, activeId]);

    useEffect(() => {
        return () => {
            files.forEach(f => {
                if (f.previewImage) URL.revokeObjectURL(f.previewImage);
            });
        };
    }, [files]);

    async function handleFiles(fileList: FileList | null) {
        if (!fileList) return;
        const arr = Array.from(fileList).slice(0, MAX_FILES);
        const analyzed: AnalyzedFile[] = [];
        for (const file of arr) {
            if (file.size > MAX_SIZE_BYTES) {
                setError(`ファイルサイズが大きすぎます (${file.name}). 最大 ${Math.floor(MAX_SIZE_BYTES / (1024 * 1024))}MB まで解析可能です。`);
                continue;
            }
            try {
                const buffer = new Uint8Array(await file.arrayBuffer());
                const head = buffer.slice(0, 256);
                const detected = detectType(head);
                const ext = getExtension(file.name);
                const st = statusFrom(ext, detected);
                const dump = hexDump(buffer.slice(0, 128));
                const isText = detected.mime.startsWith("text/");
                let previewText: string | undefined;
                let previewImage: string | undefined;
                if (isText) {
                    const td = new TextDecoder("utf-8", { fatal: false });
                    previewText = td.decode(buffer.slice(0, 4000));
                } else if (detected.mime.startsWith("image/")) {
                    previewImage = URL.createObjectURL(file);
                }

                analyzed.push({
                    id: file.name + ":" + file.size + ":" + Math.random().toString(36).slice(2, 7),
                    file,
                    name: file.name,
                    ext,
                    size: file.size,
                    typeLabel: detected.label,
                    mime: detected.mime,
                    status: st.status,
                    statusMessage: st.message,
                    magicReason: detected.reason,
                    hexDump: dump,
                    previewText,
                    previewImage,
                    isText,
                });
            } catch (e: any) {
                setError(`ファイルの読み込みに失敗しました (${file.name})`);
            }
        }
        if (analyzed.length) {
            setError(null);
            setFiles(analyzed);
            setActiveId(analyzed[0].id);
        }
    }

    function onDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    }
    function onDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
    }

    function clearAll() {
        setFiles([]);
        setActiveId(null);
        setError(null);
        setTab("overview");
    }

    return (
        <div className="space-y-4">
            <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Analyzer</div>
                <h3 className="text-2xl font-bold text-white">File Type Analyzer</h3>
                <p className="text-gray-400 text-sm">マジックナンバーから実際のファイル種別を推定し、拡張子不一致を検出します（ローカル処理のみ）。</p>
            </div>

            {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded-lg text-sm">
                    <AlertCircle size={18} />
                    <div>{error}</div>
                </div>
            )}

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div
                    className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center text-gray-400 hover:border-primary-500/60 transition-colors cursor-pointer"
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                >
                    ここにファイルをドラッグ＆ドロップ
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <input type="file" multiple onChange={e => handleFiles(e.target.files)} className="text-sm text-gray-200" />
                    <button className="px-4 py-2 bg-primary-500 text-black rounded font-semibold" onClick={() => handleFiles((document.querySelector("input[type='file']") as HTMLInputElement)?.files || null)}>
                        Analyze Files
                    </button>
                    <button className="px-3 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700" onClick={clearAll}>
                        <RefreshCcw size={14} className="inline mr-1" /> Clear
                    </button>
                    <div className="text-xs text-gray-500 ml-auto">最大 {MAX_FILES} 件 / {Math.floor(MAX_SIZE_BYTES / (1024 * 1024))}MB まで</div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <FileSearch size={16} className="text-primary-400" />
                        <span>解析結果 ({files.length} 件)</span>
                    </div>
                    <div className="overflow-auto border border-gray-800 rounded">
                        <table className="min-w-full text-xs text-gray-100">
                            <thead className="bg-gray-800 text-gray-300">
                                <tr>
                                    <th className="px-3 py-2 text-left">ファイル名</th>
                                    <th className="px-3 py-2 text-left">拡張子</th>
                                    <th className="px-3 py-2 text-left">実タイプ</th>
                                    <th className="px-3 py-2 text-left">MIME</th>
                                    <th className="px-3 py-2 text-left">サイズ</th>
                                    <th className="px-3 py-2 text-left">ステータス</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map(f => {
                                    const b = badge(f.status);
                                    return (
                                        <tr key={f.id} className={`border-t border-gray-800 cursor-pointer hover:bg-gray-800/50 ${activeFile?.id === f.id ? "bg-gray-800/60" : ""}`} onClick={() => setActiveId(f.id)}>
                                            <td className="px-3 py-2 break-all">{f.name}</td>
                                            <td className="px-3 py-2">{f.ext || "-"}</td>
                                            <td className="px-3 py-2">{f.typeLabel}</td>
                                            <td className="px-3 py-2 text-gray-300">{f.mime}</td>
                                            <td className="px-3 py-2">{formatSize(f.size)}</td>
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-1 rounded border text-xs ${b.color}`}>{b.text}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeFile && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                        <span className="font-semibold text-white">{activeFile.name}</span>
                        <span className="text-gray-400">{formatSize(activeFile.size)}</span>
                        <span className="text-gray-400">拡張子: {activeFile.ext || "なし"}</span>
                        <span className="text-gray-400">実タイプ: {activeFile.typeLabel}</span>
                        <span className="text-gray-400">MIME: {activeFile.mime}</span>
                        <span className={`px-2 py-1 rounded border text-xs ${badge(activeFile.status).color}`}>{badge(activeFile.status).text}</span>
                    </div>
                    <div className="text-sm text-gray-300">
                        {activeFile.statusMessage}
                        <div className="text-xs text-gray-400">判定理由: {activeFile.magicReason}</div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <button
                            className={`px-3 py-2 rounded border ${tab === "overview" ? "border-primary-500/60 text-primary-300" : "border-gray-700 text-gray-300"}`}
                            onClick={() => setTab("overview")}
                        >
                            Overview
                        </button>
                        <button
                            className={`px-3 py-2 rounded border ${tab === "signature" ? "border-primary-500/60 text-primary-300" : "border-gray-700 text-gray-300"}`}
                            onClick={() => setTab("signature")}
                        >
                            Signature / Magic
                        </button>
                        <button
                            className={`px-3 py-2 rounded border ${tab === "preview" ? "border-primary-500/60 text-primary-300" : "border-gray-700 text-gray-300"}`}
                            onClick={() => setTab("preview")}
                        >
                            Content Preview
                        </button>
                    </div>

                    {tab === "overview" && (
                        <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2 text-sm text-gray-200">
                            <div>ファイル名: {activeFile.name}</div>
                            <div>拡張子: {activeFile.ext || "なし"}</div>
                            <div>サイズ: {formatSize(activeFile.size)} ({activeFile.size} bytes)</div>
                            <div>実際のタイプ: {activeFile.typeLabel}</div>
                            <div>推定 MIME: {activeFile.mime}</div>
                            <div>整合性: {activeFile.statusMessage}</div>
                        </div>
                    )}

                    {tab === "signature" && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <CheckCircle2 size={16} className="text-primary-400" />
                                判定に使用したシグネチャ
                            </div>
                            <pre className="bg-gray-950 border border-gray-800 rounded p-3 text-xs text-gray-100 font-mono overflow-auto">
                                {activeFile.hexDump || "N/A"}
                            </pre>
                            <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 flex items-center gap-1" onClick={() => navigator.clipboard?.writeText(activeFile.hexDump)}>
                                <Copy size={14} /> HEX ダンプをコピー
                            </button>
                            <div className="text-xs text-gray-400">先頭 128 バイトを表示しています。</div>
                        </div>
                    )}

                    {tab === "preview" && (
                        <div className="space-y-3">
                            {activeFile.previewImage && (
                                <div className="bg-gray-950 border border-gray-800 rounded p-3">
                                    <img src={activeFile.previewImage} alt="preview" className="max-h-64 object-contain mx-auto" />
                                </div>
                            )}
                            {activeFile.isText && (
                                <pre className="bg-gray-950 border border-gray-800 rounded p-3 text-xs text-gray-100 max-h-64 overflow-auto">
                                    {activeFile.previewText}
                                </pre>
                            )}
                            {!activeFile.previewImage && !activeFile.isText && (
                                <div className="text-sm text-gray-400">安全なプレビューはありません。メタ情報のみ表示しています。</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldAlert size={14} />
                アップロードされたファイルはブラウザ内のみで解析され、外部に送信されません。
            </div>
        </div>
    );
}
