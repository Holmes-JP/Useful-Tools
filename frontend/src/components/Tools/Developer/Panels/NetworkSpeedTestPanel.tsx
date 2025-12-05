import { useMemo, useState } from "react";
import { Activity, Gauge, Globe2, RefreshCcw, Wifi, Upload, Download, Timer } from "lucide-react";
import clsx from "clsx";

type Mode = "quick" | "advanced";
type SpeedResult = {
    download?: number;
    upload?: number;
    pingAvg?: number;
    jitter?: number;
    loss?: number;
    finishedAt?: string;
    detail: Record<string, any>;
};

const FALLBACK = "取得できませんでした";

const downloadPresets: Record<Mode, { size: number; parallel: number; runs: number }> = {
    quick: { size: 2 * 1024 * 1024, parallel: 3, runs: 2 }, // ≒12MB
    advanced: { size: 3 * 1024 * 1024, parallel: 4, runs: 3 }, // ≒36MB
};

const uploadPresets: Record<Mode, { size: number; parallel: number; runs: number }> = {
    quick: { size: 2 * 1024 * 1024, parallel: 1, runs: 2 }, // ≒4MB
    advanced: { size: 3 * 1024 * 1024, parallel: 2, runs: 2 }, // ≒12MB+
};

const pingPresets: Record<Mode, number> = {
    quick: 10,
    advanced: 20,
};

function mbps(bytes: number, ms: number) {
    if (!bytes || !ms || ms <= 0) return null;
    return (bytes * 8) / (ms / 1000) / 1_000_000;
}

function formatVal(value?: number) {
    if (value === undefined || value === null || Number.isNaN(value)) return FALLBACK;
    if (value >= 100) return `${value.toFixed(0)}`;
    return value.toFixed(2);
}

function nowString() {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function randomPayload(size: number) {
    const arr = new Uint8Array(size);
    const chunk = 65536;
    for (let offset = 0; offset < size; offset += chunk) {
        const slice = arr.subarray(offset, Math.min(size, offset + chunk));
        crypto.getRandomValues(slice);
    }
    return arr;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(id);
    }
}

async function measureDownload(mode: Mode): Promise<{ mbps?: number; samples: number[] }> {
    const preset = downloadPresets[mode];
    const samples: number[] = [];
    // try Cloudflare first, fallback to gstatic
    const urls = [
        (sz: number) => `https://speed.cloudflare.com/__down?bytes=${sz}&ts=${Date.now()}`,
        () => `https://www.gstatic.com/webp/gallery3/1.png?cachebust=${Date.now()}`, // unknown size
    ];
    for (let run = 0; run < preset.runs; run++) {
        for (const urlBuilder of urls) {
            const targets = Array.from({ length: preset.parallel }, () => urlBuilder(preset.size));
            const start = performance.now();
            try {
                await Promise.all(
                    targets.map(async u => {
                        const res = await fetchWithTimeout(u, { cache: "no-store" });
                        await res.arrayBuffer();
                    }),
                );
                const end = performance.now();
                const totalBytes = urlBuilder === urls[0] ? preset.size * preset.parallel : preset.parallel * 1_048_576; // rough for fallback
                const val = mbps(totalBytes, end - start);
                if (val) samples.push(val);
                break;
            } catch {
                // try next url
                continue;
            }
        }
    }
    const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : undefined;
    return { mbps: avg, samples };
}

async function measureUpload(mode: Mode): Promise<{ mbps?: number; samples: number[] }> {
    const preset = uploadPresets[mode];
    const samples: number[] = [];
    const payload = randomPayload(preset.size);
    const blob = new Blob([payload], { type: "application/octet-stream" });
    const targets = ["https://httpbin.org/post", "https://postman-echo.com/post"];

    for (let run = 0; run < preset.runs; run++) {
        for (const url of targets) {
            try {
                const start = performance.now();
                await fetchWithTimeout(url, { method: "POST", body: blob, cache: "no-store" });
                const end = performance.now();
                const totalBytes = preset.size;
                const val = mbps(totalBytes, end - start);
                if (val) samples.push(val);
                break;
            } catch {
                continue;
            }
        }
    }
    const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : undefined;
    return { mbps: avg, samples };
}

async function measurePing(mode: Mode): Promise<{ ping?: number; jitter?: number; loss?: number; samples: number[] }> {
    const attempts = pingPresets[mode];
    const samples: number[] = [];
    let failures = 0;
    const endpoints = ["https://api.ipify.org?format=json", "https://httpbin.org/get"];

    for (let i = 0; i < attempts; i++) {
        const t0 = performance.now();
        try {
            let success = false;
            for (const ep of endpoints) {
                try {
                    const res = await fetchWithTimeout(ep, {}, 4000);
                    if (res.ok) {
                        success = true;
                        break;
                    }
                } catch {
                    continue;
                }
            }
            if (!success) throw new Error("ping failed");
            const t1 = performance.now();
            samples.push(t1 - t0);
        } catch {
            failures += 1;
        }
    }
    const ping = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : undefined;
    const jitter = samples.length ? Math.max(...samples) - Math.min(...samples) : undefined;
    const loss = attempts ? (failures / attempts) * 100 : undefined;
    return { ping, jitter, loss, samples };
}

export default function NetworkSpeedTestPanel() {
    const [mode, setMode] = useState<Mode>("quick");
    const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
    const [results, setResults] = useState<SpeedResult>({ detail: {} });
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const pushLog = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
    };

    const summaryCards = useMemo(
        () => [
            { label: "Download", value: results.download ? `${formatVal(results.download)} Mbps` : FALLBACK, icon: Download },
            { label: "Upload", value: results.upload ? `${formatVal(results.upload)} Mbps` : FALLBACK, icon: Upload },
            { label: "Ping (avg)", value: results.pingAvg ? `${formatVal(results.pingAvg)} ms` : FALLBACK, icon: Timer },
            { label: "Jitter", value: results.jitter ? `${formatVal(results.jitter)} ms` : FALLBACK, icon: Activity },
            { label: "Packet Loss", value: results.loss === undefined ? FALLBACK : `${formatVal(results.loss)} %`, icon: Gauge },
            { label: "Finished", value: results.finishedAt || FALLBACK, icon: Globe2 },
        ],
        [results],
    );

    async function startTest() {
        setStatus("running");
        setError(null);
        setResults({ detail: {} });
        setLogs([]);
        pushLog(`モード: ${mode.toUpperCase()} でテスト開始`);
        try {
            pushLog("Ping 測定開始");
            const pingRes = await measurePing(mode);
            pushLog(`Ping 測定完了: 成功 ${pingRes.samples.length} 回, 失敗 ${(pingPresets[mode] ?? 0) - pingRes.samples.length} 回`);

            pushLog("Download 測定開始");
            const downRes = await measureDownload(mode);
            pushLog(`Download 測定完了: サンプル ${downRes.samples.length} 件`);

            pushLog("Upload 測定開始");
            const upRes = await measureUpload(mode);
            pushLog(`Upload 測定完了: サンプル ${upRes.samples.length} 件`);

            setResults({
                download: downRes.mbps,
                upload: upRes.mbps,
                pingAvg: pingRes.ping,
                jitter: pingRes.jitter,
                loss: pingRes.loss,
                finishedAt: nowString(),
                detail: {
                    pingSamples: pingRes.samples,
                    downloadSamples: downRes.samples,
                    uploadSamples: upRes.samples,
                },
            });
            pushLog("テスト完了");
            setStatus("done");
        } catch (e: any) {
            setError(e?.message || "テストに失敗しました");
            pushLog(`エラー: ${e?.message || "Unknown"}`);
            setStatus("error");
        }
    }

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Wifi size={18} /> Network Speed Test
                    </h4>
                    <p className="text-xs text-gray-400">ブラウザのみで下り / 上り / 遅延を簡易計測します（Quick/Advanced）。</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={mode}
                        onChange={e => setMode(e.target.value as Mode)}
                        className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-gray-100"
                    >
                        <option value="quick">Quick (軽負荷)</option>
                        <option value="advanced">Advanced (やや精度優先)</option>
                    </select>
                    <button
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2",
                            status === "running" ? "bg-gray-700 text-gray-300" : "bg-primary-500 text-black hover:bg-primary-400",
                        )}
                        onClick={startTest}
                        disabled={status === "running"}
                    >
                        {status === "running" ? (
                            <>
                                <RefreshCcw size={14} className="animate-spin" /> Testing...
                            </>
                        ) : (
                            "Start Test"
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {summaryCards.map(card => (
                    <div key={card.label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                        <div className="p-3 bg-gray-950 rounded-lg text-primary-400">
                            <card.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
                            <p className="text-lg text-white font-mono break-all">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <h5 className="text-primary-400 font-semibold flex items-center gap-2">
                    <Activity size={16} /> Details
                </h5>
                <div className="text-sm text-gray-200 space-y-2">
                    <div>Download samples: {results.detail.downloadSamples ? (results.detail.downloadSamples as number[]).map((v: number) => v.toFixed(2)).join(", ") : FALLBACK}</div>
                    <div>Upload samples: {results.detail.uploadSamples ? (results.detail.uploadSamples as number[]).map((v: number) => v.toFixed(2)).join(", ") : FALLBACK}</div>
                    <div>Ping samples (ms): {results.detail.pingSamples ? (results.detail.pingSamples as number[]).map((v: number) => v.toFixed(1)).join(", ") : FALLBACK}</div>
                </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <h5 className="text-primary-400 font-semibold flex items-center gap-2">
                    <Globe2 size={16} /> Raw Data
                </h5>
                <pre className="text-xs text-gray-100 whitespace-pre-wrap bg-gray-950 border border-gray-800 rounded p-3">
                    {JSON.stringify(results, null, 2)}
                </pre>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <h5 className="text-primary-400 font-semibold flex items-center gap-2">
                    <RefreshCcw size={16} /> Live Logs
                </h5>
                <div className="text-xs text-gray-200 bg-gray-950 border border-gray-800 rounded p-3 space-y-1 max-h-60 overflow-auto">
                    {logs.length ? logs.map((l, i) => <div key={i}>{l}</div>) : <div className="text-gray-500">ログはまだありません。</div>}
                </div>
            </div>
        </section>
    );
}
