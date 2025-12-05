import { useEffect, useState } from "react";
import { Globe2, RefreshCcw, Search } from "lucide-react";

type GeoResponse = {
    ip?: string;
    city?: string;
    region?: string;
    country?: string;
    country_name?: string;
    latitude?: number;
    longitude?: number;
    org?: string;
    asn?: string | number;
    network?: string;
    timezone?: string;
    version?: string;
    provider?: string;
    error?: string;
};

type DnsAnswer = { data: string; type: number; TTL: number };

type ForwardCheck = {
    a: string[];
    aaaa: string[];
    consistent: boolean;
};

const TYPE_PTR = 12;
const TYPE_A = 1;
const TYPE_AAAA = 28;

function extractHost(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
        const url = trimmed.includes("://") ? new URL(trimmed) : new URL(`http://${trimmed}`);
        return url.hostname.replace(/\.$/, "");
    } catch {
        if (/^[\w.-]+\.[A-Za-z]{2,}$/.test(trimmed)) return trimmed;
        return trimmed; // might be IP
    }
}

function isIpv4(ip: string): boolean {
    const parts = ip.split(".");
    return parts.length === 4 && parts.every(p => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
}

function isIpv6(ip: string): boolean {
    const regex =
        /^(([0-9a-f]{1,4}:){1,7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,7}:|([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:((:[0-9a-f]{1,4}){1,6})|:((:[0-9a-f]{1,4}){1,7}|:))$/i;
    return regex.test(ip);
}

function expandIpv6(ip: string): string | null {
    if (!isIpv6(ip)) return null;
    const parts = ip.split("::");
    let head = parts[0] ? parts[0].split(":") : [];
    let tail = parts[1] ? parts[1].split(":") : [];
    if (parts.length === 1) {
        while (head.length < 8) head.unshift("0");
    } else {
        const missing = 8 - (head.length + tail.length);
        head = [...head, ...Array(missing).fill("0"), ...tail];
    }
    if (head.length !== 8) return null;
    return head.map(h => h.padStart(4, "0")).join(":");
}

function ipv6Reverse(ip: string): string | null {
    const expanded = expandIpv6(ip);
    if (!expanded) return null;
    const hex = expanded.replace(/:/g, "");
    const nibbles = hex.split("").reverse().join(".");
    return `${nibbles}.ip6.arpa`;
}

function ipv4Reverse(ip: string): string {
    return `${ip.split(".").reverse().join(".")}.in-addr.arpa`;
}

async function dohResolve(name: string, type: number): Promise<DnsAnswer[]> {
    const resp = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}&cd=0`);
    if (!resp.ok) throw new Error(`DNS HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.Status !== 0 || !data.Answer) return [];
    return data.Answer as DnsAnswer[];
}

async function fetchGeo(targetIp: string, isV6: boolean): Promise<GeoResponse | null> {
    // Provider 1: ipapi.co
    try {
        const res = await fetch(`https://ipapi.co/${targetIp}/json/`);
        const json = await res.json();
        if (!json.error) {
            return {
                ...json,
                provider: "ipapi.co",
            };
        }
    } catch {
        // ignore and try next
    }

    // Provider 2: ipinfo.io (limited without token)
    try {
        const res = await fetch(`https://ipinfo.io/${targetIp}/json`);
        const json = await res.json();
        if (!json.error) {
            let lat: number | undefined;
            let lon: number | undefined;
            if (json.loc && typeof json.loc === "string" && json.loc.includes(",")) {
                const [la, lo] = json.loc.split(",");
                lat = Number(la);
                lon = Number(lo);
            }
            let asn: string | undefined;
            let org = json.org as string | undefined;
            if (org && org.startsWith("AS")) {
                const parts = org.split(" ");
                asn = parts.shift();
                org = parts.join(" ");
            }
            return {
                ip: json.ip,
                city: json.city,
                region: json.region,
                country: json.country,
                country_name: json.country,
                latitude: lat,
                longitude: lon,
                org: org || json.org,
                asn,
                network: json.bogon ? undefined : undefined,
                timezone: json.timezone,
                version: isV6 ? "IPv6" : "IPv4",
                provider: "ipinfo.io",
            };
        }
    } catch {
        // ignore
    }

    return null;
}

export default function GeoLookupPanel() {
    const [input, setInput] = useState("8.8.8.8");
    const [resolvedIp, setResolvedIp] = useState<string | null>(null);
    const [ptr, setPtr] = useState<string | null>(null);
    const [ptrTtl, setPtrTtl] = useState<number | null>(null);
    const [forward, setForward] = useState<ForwardCheck | null>(null);
    const [geo, setGeo] = useState<GeoResponse | null>(null);
    const [raw, setRaw] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function resolveDomain(host: string): Promise<string | null> {
        try {
            const a = await dohResolve(host, TYPE_A);
            if (a.length) return a[0].data;
            const aaaa = await dohResolve(host, TYPE_AAAA);
            if (aaaa.length) return aaaa[0].data;
            return null;
        } catch {
            return null;
        }
    }

    async function runLookup() {
        setError(null);
        setResolvedIp(null);
        setPtr(null);
        setPtrTtl(null);
        setForward(null);
        setGeo(null);
        setRaw("");
        const host = extractHost(input);
        if (!host) {
            setError("IP またはドメイン/URL を入力してください。");
            return;
        }

        let targetIp = host;
        const isIp = isIpv4(host) || isIpv6(host);
        if (!isIp) {
            const resolved = await resolveDomain(host);
            if (!resolved) {
                setError("ドメインを IP に解決できませんでした。");
                return;
            }
            targetIp = resolved;
        }

        if (!isIpv4(targetIp) && !isIpv6(targetIp)) {
            setError("有効な IP に解決できませんでした。");
            return;
        }

        setResolvedIp(targetIp);
        setLoading(true);

        // Geo lookup with fallback
        try {
            const geoData = await fetchGeo(targetIp, isIpv6(targetIp));
            if (!geoData) {
                setError("GeoIP lookup failed (all providers).");
            } else {
                setGeo(geoData);
                setRaw(JSON.stringify(geoData, null, 2));
            }
        } catch (e: any) {
            setError(`GeoIP lookup 中にエラーが発生しました: ${e.message ?? e}`);
        }

        // PTR & forward confirmation (run even if geo failed)
        try {
            const reverseName = isIpv4(targetIp) ? ipv4Reverse(targetIp) : ipv6Reverse(targetIp);
            if (reverseName) {
                const ptrAns = await dohResolve(reverseName, TYPE_PTR);
                if (ptrAns.length) {
                    const first = ptrAns[0];
                    const hostName = first.data.replace(/\.$/, "");
                    setPtr(hostName);
                    setPtrTtl(first.TTL);
                    const [aRes, aaaaRes] = await Promise.all([
                        dohResolve(hostName, TYPE_A).catch(() => []),
                        dohResolve(hostName, TYPE_AAAA).catch(() => []),
                    ]);
                    const aList = aRes.map(a => a.data);
                    const aaaaList = aaaaRes.map(a => a.data);
                    const consistent = aList.includes(targetIp) || aaaaList.includes(targetIp);
                    setForward({ a: aList, aaaa: aaaaList, consistent });
                }
            }
        } catch (e: any) {
            setError(prev => prev ?? `PTR 取得中にエラーが発生しました: ${e.message ?? e}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        runLookup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Search size={18} /> IP → Geo Lookup
                    </h4>
                    <p className="text-xs text-gray-400">IP/ドメイン/URL から位置情報・ISP・ASN・PTR を確認します。</p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1 flex items-center gap-1">
                    <Globe2 size={12} /> Geo API: ipapi.co → ipinfo.io (fallback) / DoH: dns.google
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-gray-300">Input (IP / Domain / URL)</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-100"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="8.8.8.8 または example.com"
                    />
                    <button className="px-4 py-2 bg-primary-500 text-black rounded flex items-center gap-2" onClick={runLookup} disabled={loading}>
                        {loading ? <RefreshCcw size={14} className="animate-spin" /> : <Search size={14} />} Lookup
                    </button>
                </div>
                {resolvedIp && <p className="text-xs text-gray-400">Resolved IP: {resolvedIp}</p>}
                {geo?.provider && <p className="text-xs text-gray-400">Provider: {geo.provider}</p>}
                {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>

            {geo && !error && (
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-1">
                            <div className="text-sm text-gray-400">Basic</div>
                            <div className="text-sm text-white">IP: {geo.ip || resolvedIp}</div>
                            <div className="text-sm text-white">Version: {geo.version || (isIpv6(resolvedIp || "") ? "IPv6" : "IPv4")}</div>
                            <div className="text-sm text-white">Timezone: {geo.timezone || "-"}</div>
                            {ptr && (
                                <div className="text-sm text-white">
                                    PTR: {ptr} {ptrTtl ? <span className="text-xs text-gray-500">TTL {ptrTtl}s</span> : null}
                                </div>
                            )}
                            {forward && (
                                <div className="text-xs text-gray-300">
                                    Forward-confirmation: {forward.consistent ? "✓ 一致" : "⚠ 不一致"} (A: {forward.a.join(", ") || "なし"} / AAAA:{" "}
                                    {forward.aaaa.join(", ") || "なし"})
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-1">
                            <div className="text-sm text-gray-400">Geo Location</div>
                            <div className="text-sm text-white">Country: {geo.country_name || geo.country || "-"}</div>
                            <div className="text-sm text-white">Region: {geo.region || "-"}</div>
                            <div className="text-sm text-white">City: {geo.city || "-"}</div>
                            <div className="text-sm text-white">
                                Lat / Lon: {geo.latitude ?? "-"}, {geo.longitude ?? "-"}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-1">
                            <div className="text-sm text-gray-400">ISP / ASN</div>
                            <div className="text-sm text-white">ISP/Org: {geo.org || "-"}</div>
                            <div className="text-sm text-white">ASN: {geo.asn || "-"}</div>
                            <div className="text-sm text-white">Network: {geo.network || "-"}</div>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-1">
                            <div className="text-sm text-gray-400">Security (簡易)</div>
                            <div className="text-xs text-gray-300">Hosting/VPN/Proxy 判定は利用 API に依存します。現在の無料 API では未提供です。</div>
                        </div>
                    </div>
                </div>
            )}

            {raw && (
                <details className="bg-gray-950 border border-gray-800 rounded p-3">
                    <summary className="text-sm text-gray-200 cursor-pointer">Raw JSON (provider response)</summary>
                    <pre className="mt-2 text-xs text-gray-100 whitespace-pre-wrap">{raw}</pre>
                </details>
            )}
        </section>
    );
}
