import { useEffect, useState } from "react";
import { Globe2, RefreshCcw, Search } from "lucide-react";

type PtrAnswer = {
    name: string;
    type: number;
    TTL: number;
    data: string;
};

type ForwardCheck = {
    a: string[];
    aaaa: string[];
    consistent: boolean;
};

const TYPE_PTR = 12;
const TYPE_A = 1;
const TYPE_AAAA = 28;

function extractIp(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.includes("/")) return null; // CIDR not allowed here
    // If URL, try to parse
    try {
        const asUrl = trimmed.includes("://") ? new URL(trimmed) : new URL(`http://${trimmed}`);
        return asUrl.hostname;
    } catch {
        // fallthrough
    }
    return trimmed;
}

function isIpv4(ip: string): boolean {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    return parts.every(p => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
}

function isIpv6(ip: string): boolean {
    // Basic IPv6 validation (compressed allowed)
    const ipv6Regex = /^(([0-9a-f]{1,4}:){1,7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,7}:|([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:((:[0-9a-f]{1,4}){1,6})|:((:[0-9a-f]{1,4}){1,7}|:))$/i;
    return ipv6Regex.test(ip);
}

function expandIpv6(ip: string): string | null {
    if (!isIpv6(ip)) return null;
    const parts = ip.split("::");
    let head = parts[0] ? parts[0].split(":") : [];
    let tail = parts[1] ? parts[1].split(":") : [];
    if (parts.length === 1) {
        // already full?
        while (head.length < 8) head.unshift("0");
    } else {
        const missing = 8 - (head.length + tail.length);
        head = [...head, ...Array(missing).fill("0"), ...tail];
    }
    if (head.length !== 8) return null;
    return head.map(h => h.padStart(4, "0")).join(":");
}

function ipv6ToNibbleReverse(ip: string): string | null {
    const expanded = expandIpv6(ip);
    if (!expanded) return null;
    const hex = expanded.replace(/:/g, ""); // 32 hex chars
    const nibbles = hex.split("").reverse().join(".");
    return `${nibbles}.ip6.arpa`;
}

function ipv4ToReverse(ip: string): string {
    return `${ip.split(".").reverse().join(".")}.in-addr.arpa`;
}

async function dohQuery(name: string, type: number) {
    const resp = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}&cd=0`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
}

export default function ReverseDnsPanel() {
    const [input, setInput] = useState("8.8.8.8");
    const [ptr, setPtr] = useState<PtrAnswer | null>(null);
    const [forward, setForward] = useState<ForwardCheck | null>(null);
    const [authority, setAuthority] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function runLookup() {
        setError(null);
        setPtr(null);
        setForward(null);
        setAuthority(null);
        const ipCandidate = extractIp(input);
        if (!ipCandidate) {
            setError("IP アドレスを入力してください。");
            return;
        }
        const ip = ipCandidate.trim();
        const is4 = isIpv4(ip);
        const is6 = isIpv6(ip);
        if (!is4 && !is6) {
            setError("有効な IPv4 または IPv6 を入力してください。CIDR は非対応です。");
            return;
        }

        const reverseName = is4 ? ipv4ToReverse(ip) : ipv6ToNibbleReverse(ip);
        if (!reverseName) {
            setError("IPv6 の変換に失敗しました。形式を確認してください。");
            return;
        }
        setAuthority(reverseName);

        setLoading(true);
        try {
            const data = await dohQuery(reverseName, TYPE_PTR);
            if (data.Status !== 0 || !data.Answer) {
                setError("PTR レコードが見つかりませんでした。");
                setLoading(false);
                return;
            }
            const answer: PtrAnswer = data.Answer[0];
            setPtr(answer);

            // forward confirmation
            const hostname = answer.data.replace(/\.$/, "");
            const [aRes, aaaaRes] = await Promise.all([
                dohQuery(hostname, TYPE_A).catch(() => null),
                dohQuery(hostname, TYPE_AAAA).catch(() => null),
            ]);
            const aList: string[] = aRes?.Answer ? aRes.Answer.map((ans: any) => ans.data) : [];
            const aaaaList: string[] = aaaaRes?.Answer ? aaaaRes.Answer.map((ans: any) => ans.data) : [];
            const consistent = aList.includes(ip) || aaaaList.includes(ip);
            setForward({ a: aList, aaaa: aaaaList, consistent });
        } catch (e: any) {
            setError(`逆引き中にエラーが発生しました: ${e.message ?? e}`);
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
                        <Search size={18} /> Reverse DNS Lookup
                    </h4>
                    <p className="text-xs text-gray-400">IP アドレスから PTR を取得し、正引き整合も確認します。</p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1 flex items-center gap-1">
                    <Globe2 size={12} /> DoH: dns.google
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-gray-300">IP Address</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-100"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="8.8.8.8 または 2001:4860:4860::8888"
                    />
                    <button className="px-4 py-2 bg-primary-500 text-black rounded flex items-center gap-2" onClick={runLookup} disabled={loading}>
                        {loading ? <RefreshCcw size={14} className="animate-spin" /> : <Search size={14} />} Lookup
                    </button>
                </div>
                {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="bg-gray-950 border border-gray-800 rounded p-3">
                        <div className="text-sm text-gray-400">PTR Record</div>
                        <div className="text-lg text-white font-mono">{ptr ? ptr.data : "未取得"}</div>
                        {ptr && <div className="text-xs text-gray-500 mt-1">TTL: {ptr.TTL}s</div>}
                    </div>
                    <div className="bg-gray-950 border border-gray-800 rounded p-3">
                        <div className="text-sm text-gray-400">Authority Zone</div>
                        <div className="text-sm text-white font-mono">{authority || "-"}</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-1">
                        <div className="text-sm text-gray-400">Forward confirmation</div>
                        {forward ? (
                            <>
                                <div className="text-sm text-white">
                                    {forward.consistent ? "✓ PTR のホスト名は元の IP を指しています。" : "⚠ PTR のホスト名が元の IP を指していません。"}
                                </div>
                                <div className="text-xs text-gray-400">
                                    A: {forward.a.length ? forward.a.join(", ") : "なし"} / AAAA: {forward.aaaa.length ? forward.aaaa.join(", ") : "なし"}
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-gray-400">未確認</div>
                        )}
                    </div>
                    <div className="bg-gray-950 border border-gray-800 rounded p-3">
                        <div className="text-xs text-gray-500">ヒント: メールサーバー品質チェックでは PTR と正引きの一致が重要です。</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
