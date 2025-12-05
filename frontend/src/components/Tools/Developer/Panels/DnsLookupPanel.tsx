import { useEffect, useMemo, useState } from "react";
import { Globe2, RefreshCcw, Search } from "lucide-react";

type RecordType = "A" | "AAAA" | "CNAME" | "MX" | "NS" | "TXT" | "CAA" | "SOA";
type DnsAnswer = {
    name: string;
    type: number;
    TTL: number;
    data: string;
};

const recordTypeNumbers: Record<RecordType, number> = {
    A: 1,
    AAAA: 28,
    CNAME: 5,
    MX: 15,
    NS: 2,
    TXT: 16,
    CAA: 257,
    SOA: 6,
};

const typeLabel: Record<number, string> = Object.entries(recordTypeNumbers).reduce((acc, [k, v]) => {
    acc[v] = k;
    return acc;
}, {} as Record<number, string>);

const emptyResults: Record<RecordType, DnsAnswer[]> = {
    A: [],
    AAAA: [],
    CNAME: [],
    MX: [],
    NS: [],
    TXT: [],
    CAA: [],
    SOA: [],
};

function extractHostname(input: string): { host: string; punycode: string } | null {
    try {
        const url = input.includes("://") ? new URL(input) : new URL(`http://${input}`);
        const host = url.hostname.trim().replace(/\.$/, "");
        if (!host) return null;
        return { host, punycode: host }; // URL already punycode-encodes IDN
    } catch {
        return null;
    }
}

function humanTtl(ttl: number) {
    if (ttl < 60) return `${ttl}s`;
    if (ttl < 3600) return `${(ttl / 60).toFixed(1)}m`;
    if (ttl < 86400) return `${(ttl / 3600).toFixed(1)}h`;
    return `${(ttl / 86400).toFixed(1)}d`;
}

export default function DnsLookupPanel() {
    const [input, setInput] = useState("example.com");
    const [selectedTypes, setSelectedTypes] = useState<RecordType[]>(["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA"]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<Record<RecordType, DnsAnswer[]>>(emptyResults);
    const [resolvedHost, setResolvedHost] = useState<string | null>(null);

    const allTypes: RecordType[] = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "CAA", "SOA"];

    async function runLookup() {
        const hostInfo = extractHostname(input);
        if (!hostInfo) {
            setError("有効なドメインを入力してください。");
            setResults(emptyResults);
            return;
        }
        setResolvedHost(hostInfo.punycode);
        setError(null);
        setLoading(true);
        const newResults: Record<RecordType, DnsAnswer[]> = { ...emptyResults };

        for (const type of selectedTypes) {
            try {
                const resp = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostInfo.punycode)}&type=${recordTypeNumbers[type]}&cd=0`);
                if (!resp.ok) throw new Error(`DNS query failed (${resp.status})`);
                const data = await resp.json();
                if (data.Status !== 0 || !data.Answer) {
                    newResults[type] = [];
                    continue;
                }
                newResults[type] = data.Answer as DnsAnswer[];
            } catch (e: any) {
                setError(`DNS lookup でエラーが発生しました: ${e.message ?? e}`);
                setLoading(false);
                return;
            }
        }
        setResults(newResults);
        setLoading(false);
    }

    useEffect(() => {
        runLookup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const recordCards = useMemo(() => {
        return selectedTypes.map(type => {
            const answers = results[type] ?? [];
            return (
                <div key={type} className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-300 font-semibold">{type} レコード</div>
                        <div className="text-xs text-gray-500">{answers.length ? `${answers.length} 件` : "0 件"}</div>
                    </div>
                    {answers.length === 0 ? (
                        <p className="text-xs text-gray-500">なし</p>
                    ) : (
                        <div className="space-y-2">
                            {answers.map((ans, idx) => (
                                <div key={idx} className="bg-gray-900 border border-gray-800 rounded p-2 text-sm text-gray-100">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>TTL: {ans.TTL}s ({humanTtl(ans.TTL)})</span>
                                        <span>{typeLabel[ans.type] ?? ans.type}</span>
                                    </div>
                                    <div className="mt-1 font-mono break-all text-primary-200">
                                        {type === "MX" ? ans.data.replace(/\s+/, " ") : ans.data}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        });
    }, [results, selectedTypes]);

    function toggleType(t: RecordType) {
        setSelectedTypes(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
    }

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Search size={18} /> DNS Lookup
                    </h4>
                    <p className="text-xs text-gray-400">ドメインの A / AAAA / MX / TXT / NS / CNAME / SOA / CAA を取得します。</p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1 flex items-center gap-1">
                    <Globe2 size={12} /> DoH: dns.google
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-gray-300">Domain</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-100"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="example.com または https://www.example.com/path"
                    />
                    <button className="px-4 py-2 bg-primary-500 text-black rounded flex items-center gap-2" onClick={runLookup} disabled={loading}>
                        {loading ? <RefreshCcw size={14} className="animate-spin" /> : <Search size={14} />} Lookup
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                    {allTypes.map(t => (
                        <label key={t} className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded px-2 py-1 text-gray-200 cursor-pointer">
                            <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} />
                            {t}
                        </label>
                    ))}
                    <button
                        className="px-2 py-1 bg-gray-800 rounded border border-gray-700 hover:border-primary-500 text-gray-200"
                        onClick={() => setSelectedTypes(allTypes)}
                    >
                        ALL
                    </button>
                    <button
                        className="px-2 py-1 bg-gray-800 rounded border border-gray-700 hover:border-primary-500 text-gray-200"
                        onClick={() => setSelectedTypes(["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA"])}
                    >
                        Common
                    </button>
                </div>
                {resolvedHost && <p className="text-xs text-gray-400">Query: {resolvedHost}</p>}
                {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>

            {selectedTypes.length === 0 ? (
                <p className="text-sm text-gray-400">取得するレコードタイプを選択してください。</p>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">{recordCards}</div>
            )}
        </section>
    );
}
