import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
    Activity,
    Globe,
    Wifi,
    Monitor,
    Cpu,
    Shield,
    Lock,
    Clock,
    Sparkles,
    MousePointerClick,
    ClipboardCheck,
} from "lucide-react";

type HeaderMap = Record<string, string | undefined>;

type GeoState = {
    status: "idle" | "pending" | "granted" | "denied" | "error";
    lat?: number;
    lon?: number;
    accuracy?: number;
    timestamp?: string;
    message?: string;
};

type BenchmarkResult = {
    durationMs: number;
    score: number;
};

const FALLBACK = "取得できませんでした";

function safe(v: any) {
    if (v === undefined || v === null || v === "") return FALLBACK;
    return v;
}

function formatBytesPerSecond(bytes: number, ms: number) {
    if (ms <= 0) return FALLBACK;
    const bps = (bytes * 8) / (ms / 1000);
    const mbps = bps / 1_000_000;
    return `${mbps.toFixed(2)} Mbps`;
}

function runCpuBenchmark(iterations = 5_000_000): BenchmarkResult {
    const start = performance.now();
    let acc = 0;
    for (let i = 0; i < iterations; i++) {
        acc += Math.sin(i) * Math.cos(i);
    }
    const end = performance.now();
    const durationMs = end - start;
    // relative score: lower is better, invert and scale
    const score = Math.max(0.1, 1000 / durationMs);
    return { durationMs, score: Number(score.toFixed(2)) };
}

export default function SystemInfo() {
    const [ip, setIp] = useState<string>(FALLBACK);
    const [headerInfo, setHeaderInfo] = useState<HeaderMap>({});
    const [speed, setSpeed] = useState<string>(FALLBACK);
    const [speedTesting, setSpeedTesting] = useState(false);
    const [geo, setGeo] = useState<GeoState>({ status: "idle" });
    const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);

    const navigatorInfo = useMemo(() => {
        const nav = navigator;
        const screen = window.screen;
        const mediaDark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : undefined;
        const mediaReduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : undefined;
        const connection = (nav as any).connection;
        const intl = Intl.DateTimeFormat().resolvedOptions();
        const langList = safe(nav.languages?.join(", "));
        const gpu = (() => {
            try {
                const canvas = document.createElement("canvas");
                const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
                if (!gl) return FALLBACK;
                const ext = gl.getExtension("WEBGL_debug_renderer_info");
                if (!ext) return FALLBACK;
                return gl.getParameter((ext as any).UNMASKED_RENDERER_WEBGL);
            } catch {
                return FALLBACK;
            }
        })();
        return {
            browser: {
                appCodeName: safe(nav.appCodeName),
                appName: safe(nav.appName),
                appVersion: safe(nav.appVersion),
                userAgent: safe(nav.userAgent),
                platform: safe(nav.platform),
                product: safe(nav.product),
            },
            device: {
                screen: `${screen.width} x ${screen.height}`,
                viewport: `${window.innerWidth} x ${window.innerHeight}`,
                colorDepth: safe(screen.colorDepth),
                pixelDepth: safe(screen.pixelDepth),
                devicePixelRatio: safe(window.devicePixelRatio),
                maxTouchPoints: safe((nav as any).maxTouchPoints),
                hardwareConcurrency: safe(nav.hardwareConcurrency),
                deviceMemory: safe((nav as any).deviceMemory),
                gpu,
            },
            privacy: {
                dnt: safe((nav as any).doNotTrack ?? headerInfo["dnt"]),
                cookieEnabled: safe(nav.cookieEnabled),
                javaEnabled: safe(nav.javaEnabled?.()),
                https: location.protocol === "https:" ? "Yes" : "No",
            },
            timeLocale: {
                nowLocal: new Date().toLocaleString(),
                nowIso: new Date().toISOString(),
                timeZone: safe(intl.timeZone),
                language: safe(nav.language),
                languages: langList,
                localeSample: (1234567.89).toLocaleString(),
                prefersDark: mediaDark === undefined ? FALLBACK : mediaDark ? "Yes" : "No",
                reduceMotion: mediaReduce === undefined ? FALLBACK : mediaReduce ? "Yes" : "No",
            },
            capabilities: {
                cookies: nav.cookieEnabled ? "有効" : "無効",
                localStorage: (() => {
                    try {
                        const key = "__diag_ls";
                        localStorage.setItem(key, "1");
                        localStorage.removeItem(key);
                        return "有効";
                    } catch {
                        return "無効";
                    }
                })(),
                sessionStorage: (() => {
                    try {
                        const key = "__diag_ss";
                        sessionStorage.setItem(key, "1");
                        sessionStorage.removeItem(key);
                        return "有効";
                    } catch {
                        return "無効";
                    }
                })(),
                clipboard: navigator.clipboard ? "有効" : "無効",
                geolocation: "geolocation" in navigator ? "有効" : "無効",
                wasm: typeof WebAssembly === "object" ? "有効" : "無効",
                webgl: (() => {
                    try {
                        const canvas = document.createElement("canvas");
                        return canvas.getContext("webgl") ? "有効" : "無効";
                    } catch {
                        return "無効";
                    }
                })(),
                serviceWorker: "serviceWorker" in navigator ? "有効" : "無効",
                notifications: "Notification" in window ? "有効" : "無効",
            },
            connection: {
                online: navigator.onLine ? "Online" : "Offline",
                port: location.port || (location.protocol === "https:" ? "443" : "80"),
                effectiveType: safe(connection?.effectiveType),
                downlink: safe(connection?.downlink),
                rtt: safe(connection?.rtt),
                saveData: safe(connection?.saveData),
            },
        };
    }, [headerInfo]);

    const summaryCards = useMemo(
        () => [
            { label: "Global IP", value: ip, icon: Globe },
            { label: "Connection Speed (Est.)", value: speed, icon: Wifi },
            { label: "OS / Platform", value: navigatorInfo.browser.platform, icon: Monitor },
            { label: "Browser", value: navigatorInfo.browser.appName, icon: Cpu },
            { label: "Resolution", value: navigatorInfo.device.screen, icon: Monitor },
            { label: "Time Zone", value: navigatorInfo.timeLocale.timeZone, icon: Clock },
        ],
        [ip, speed, navigatorInfo],
    );

    async function fetchHeaders() {
        try {
            const res = await fetch("/api/diagnostics");
            if (!res.ok) throw new Error("bad status");
            const data = await res.json();
            setHeaderInfo(
                Object.entries(data.headers || {}).reduce((acc: HeaderMap, [k, v]) => {
                    acc[k.toLowerCase()] = v as string;
                    return acc;
                }, {}),
            );
            if (data.ip) setIp(data.ip);
        } catch {
            setHeaderInfo({});
        }
    }

    async function fetchIpFallback() {
        const endpoints = [
            "https://api64.ipify.org?format=json",
            "https://api.ipify.org?format=json",
            "https://icanhazip.com/",
            "https://ifconfig.me/ip",
        ];
        for (const url of endpoints) {
            try {
                const res = await fetch(url, { cache: "no-store" });
                if (!res.ok) continue;
                const text = await res.text();
                const parsed = (() => {
                    try {
                        const j = JSON.parse(text);
                        return j.ip || j.address;
                    } catch {
                        return text.trim();
                    }
                })();
                if (parsed) {
                    setIp(parsed);
                    return;
                }
            } catch {
                // try next
            }
        }
        setIp(FALLBACK);
    }

    async function runSpeedTest() {
        setSpeedTesting(true);
        setSpeed("測定中...");
        try {
            const candidates: { url: string; bytes?: number }[] = [
                { url: `https://speed.cloudflare.com/__down?bytes=5242880&ts=${Date.now()}`, bytes: 5 * 1024 * 1024 },
                { url: `https://speed.cloudflare.com/__down?bytes=10485760&ts=${Date.now()}`, bytes: 10 * 1024 * 1024 },
                { url: `https://www.gstatic.com/webp/gallery3/1.png?cachebust=${Date.now()}` },
            ];

            const measureOnce = async (url: string, expectedBytes?: number) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 12000);
                const start = performance.now();
                const res = await fetch(url, { cache: "no-store", signal: controller.signal });
                const blob = await res.blob();
                clearTimeout(timeout);
                const end = performance.now();
                const size = expectedBytes || blob.size;
                const mbps = formatBytesPerSecond(size, end - start);
                return { mbps, size };
            };

            let bestTarget: { url: string; bytes?: number } | null = null;
            for (const c of candidates) {
                try {
                    await measureOnce(c.url, c.bytes); // probe success
                    bestTarget = c;
                    break;
                } catch {
                    continue;
                }
            }

            if (!bestTarget) throw new Error("no endpoint");

            const trials = 2;
            const results: number[] = [];
            for (let i = 0; i < trials; i++) {
                try {
                    const { mbps } = await measureOnce(bestTarget.url, bestTarget.bytes);
                    const val = Number((mbps as string).split(" ")[0]);
                    if (!Number.isNaN(val)) results.push(val);
                } catch {
                    // ignore single failure
                }
            }

            if (!results.length) throw new Error("failed measurements");
            const avg = results.reduce((a, b) => a + b, 0) / results.length;
            setSpeed(`${avg.toFixed(2)} Mbps (avg of ${results.length})`);
        } catch {
            setSpeed(FALLBACK);
        } finally {
            setSpeedTesting(false);
        }
    }

    function runGeolocation() {
        setGeo({ status: "pending" });
        if (!("geolocation" in navigator)) {
            setGeo({ status: "error", message: "取得できませんでした" });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => {
                setGeo({
                    status: "granted",
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: new Date(pos.timestamp).toLocaleString(),
                });
            },
            err => {
                setGeo({ status: err.code === err.PERMISSION_DENIED ? "denied" : "error", message: err.message });
            },
        );
    }

    useEffect(() => {
        fetchHeaders().finally(() => {
            if (ip === FALLBACK) fetchIpFallback();
        });
        setBenchmark(runCpuBenchmark());
    }, []);

    const rawJson = useMemo(
        () =>
            JSON.stringify(
                {
                    ip,
                    headers: headerInfo,
                    navigator: navigatorInfo,
                    geolocation: geo,
                    benchmark,
                },
                null,
                2,
            ),
        [ip, headerInfo, navigatorInfo, geo, benchmark],
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Activity className="text-primary-500" />
                    System Diagnostics
                </h2>
                <p className="text-gray-500 text-sm">環境情報をまとめて確認し、トラブルシュートに活用できます。</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {summaryCards.map(card => (
                    <div key={card.label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                        <div className="p-3 bg-gray-950 rounded-lg text-primary-400">
                            <card.icon size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
                            <p className="text-lg text-white font-mono break-all">{safe(card.value)}</p>
                        </div>
                        {card.label === "Connection Speed (Est.)" && (
                            <div className="flex flex-col items-end justify-start">
                                <button
                                    onClick={runSpeedTest}
                                    disabled={speedTesting}
                                    className={clsx(
                                        "px-3 py-2 rounded-lg text-xs font-semibold border border-primary-500/40",
                                        speedTesting ? "bg-gray-800 text-gray-400" : "bg-primary-500/20 text-primary-200 hover:bg-primary-500/30",
                                    )}
                                >
                                    {speedTesting ? "測定中..." : "再測定"}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-4">
                <h3 className="text-primary-400 font-semibold flex items-center gap-2">
                    <Globe size={18} /> Network
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-200">
                    <InfoRow label="Global IP" value={ip} />
                    <InfoRow label="Port" value={navigatorInfo.connection.port} />
                    <InfoRow label="Online" value={navigatorInfo.connection.online} />
                    <InfoRow label="Effective Type" value={navigatorInfo.connection.effectiveType} />
                    <InfoRow label="Downlink" value={navigatorInfo.connection.downlink} />
                    <InfoRow label="RTT" value={navigatorInfo.connection.rtt} />
                    <InfoRow label="Save-Data" value={navigatorInfo.connection.saveData} />
                    <InfoRow label="Connection Speed (Est.)" value={safe(speed)} />
                </div>
            </section>

            <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="text-primary-400 font-semibold flex items-center gap-2">
                    <Shield size={18} /> HTTP Headers / Server Side
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-200">
                    {["user-agent", "accept-language", "accept", "accept-encoding", "connection", "keep-alive", "referer", "dnt"].map(key => (
                        <InfoRow key={key} label={key} value={headerInfo[key] ?? FALLBACK} mono />
                    ))}
                </div>
            </section>

            <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="text-primary-400 font-semibold flex items-center gap-2">
                    <Cpu size={18} /> Browser & OS
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-200">
                    <InfoRow label="appCodeName" value={navigatorInfo.browser.appCodeName} />
                    <InfoRow label="appName" value={navigatorInfo.browser.appName} />
                    <InfoRow label="appVersion" value={navigatorInfo.browser.appVersion} />
                    <InfoRow label="platform" value={navigatorInfo.browser.platform} />
                    <InfoRow label="userAgent" value={navigatorInfo.browser.userAgent} mono />
                    <InfoRow label="product" value={navigatorInfo.browser.product} />
                </div>
            </section>

            <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="text-primary-400 font-semibold flex items-center gap-2">
                    <Monitor size={18} /> Device & Display
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-200">
                    <InfoRow label="Screen" value={navigatorInfo.device.screen} />
                    <InfoRow label="Viewport" value={navigatorInfo.device.viewport} />
                    <InfoRow label="Color Depth" value={navigatorInfo.device.colorDepth} />
                    <InfoRow label="Pixel Depth" value={navigatorInfo.device.pixelDepth} />
                    <InfoRow label="Device Pixel Ratio" value={navigatorInfo.device.devicePixelRatio} />
                    <InfoRow label="Max Touch Points" value={navigatorInfo.device.maxTouchPoints} />
                    <InfoRow label="GPU Renderer" value={navigatorInfo.device.gpu} />
                    <InfoRow label="Device Memory" value={navigatorInfo.device.deviceMemory} />
                    <InfoRow label="Hardware Concurrency" value={navigatorInfo.device.hardwareConcurrency} />
                </div>
            </section>

            <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="text-primary-400 font-semibold flex items-center gap-2">
                    <Lock size={18} /> Privacy & Security
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-200">
                    <InfoRow label="DNT" value={navigatorInfo.privacy.dnt} />
                    <InfoRow label="Cookies" value={navigatorInfo.privacy.cookieEnabled} />
                    <InfoRow label="Java Enabled" value={navigatorInfo.privacy.javaEnabled} />
                    <InfoRow label="HTTPS" value={navigatorInfo.privacy.https} />
                </div>
            </section>

            <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="text-primary-400 font-semibold flex items-center gap-2">
                    <Clock size={18} /> Time & Locale
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-200">
                    <InfoRow label="Local Time" value={navigatorInfo.timeLocale.nowLocal} />
                    <InfoRow label="ISO Time" value={navigatorInfo.timeLocale.nowIso} />
                    <InfoRow label="Time Zone" value={navigatorInfo.timeLocale.timeZone} />
                    <InfoRow label="Language" value={navigatorInfo.timeLocale.language} />
                    <InfoRow label="Languages" value={navigatorInfo.timeLocale.languages} />
                    <InfoRow label="Locale Sample" value={navigatorInfo.timeLocale.localeSample} />
                    <InfoRow label="Dark Mode Pref" value={navigatorInfo.timeLocale.prefersDark} />
                    <InfoRow label="Reduced Motion Pref" value={navigatorInfo.timeLocale.reduceMotion} />
                </div>
            </section>

            <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="text-primary-400 font-semibold flex items-center gap-2">
                    <Shield size={18} /> Capabilities
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-200">
                    {Object.entries(navigatorInfo.capabilities).map(([k, v]) => (
                        <InfoRow key={k} label={k} value={v} />
                    ))}
                </div>
            </section>

            <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="text-primary-400 font-semibold flex items-center gap-2">
                    <MousePointerClick size={18} /> Geolocation
                </h3>
                <button
                    onClick={runGeolocation}
                    className="px-3 py-2 bg-primary-500 text-black rounded-lg text-sm font-semibold hover:bg-primary-400"
                    disabled={geo.status === "pending"}
                >
                    {geo.status === "pending" ? "取得中..." : "位置情報を取得する（任意）"}
                </button>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-200">
                    <InfoRow label="Latitude" value={geo.lat ?? FALLBACK} />
                    <InfoRow label="Longitude" value={geo.lon ?? FALLBACK} />
                    <InfoRow label="Accuracy" value={geo.accuracy ?? FALLBACK} />
                    <InfoRow label="Timestamp" value={geo.timestamp ?? FALLBACK} />
                    {geo.message && <InfoRow label="Status" value={geo.message} />}
                </div>
            </section>

            <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="text-primary-400 font-semibold flex items-center gap-2">
                    <Sparkles size={18} /> Performance / Benchmark
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-200">
                    <InfoRow label="CPU Benchmark (JS)" value={benchmark ? `${benchmark.durationMs.toFixed(0)} ms` : FALLBACK} />
                    <InfoRow label="CPU Score (relative)" value={benchmark ? `${benchmark.score}x` : FALLBACK} />
                    <InfoRow label="Network Speed" value={speed} />
                </div>
            </section>

            <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="text-primary-400 font-semibold flex items-center gap-2">
                    <ClipboardCheck size={18} /> Raw JSON / Debug
                </h3>
                <pre className="text-xs text-gray-100 whitespace-pre-wrap bg-gray-950 border border-gray-800 rounded p-3">{rawJson}</pre>
            </section>
        </div>
    );
}

function InfoRow({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) {
    return (
        <div className="flex flex-col gap-1 bg-gray-950/60 border border-gray-800 rounded p-3">
            <span className="text-xs text-gray-500">{label}</span>
            <span className={clsx("text-sm text-white break-all", mono && "font-mono")}>{safe(value)}</span>
        </div>
    );
}
