import { useEffect, useState } from "react";
import { Globe2, RefreshCcw, Search } from "lucide-react";

type Event = {
    eventAction: string;
    eventDate: string;
};

type NameServer = {
    ldhName?: string;
};

type Entity = {
    roles?: string[];
    vcardArray?: any[];
};

type RdapResponse = {
    handle?: string;
    ldhName?: string;
    status?: string[];
    events?: Event[];
    nameservers?: NameServer[];
    entities?: Entity[];
    port43?: string;
    notices?: { title?: string; description?: string[] }[];
    errorCode?: number;
    title?: string;
    description?: string[];
};

function extractDomain(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
        const url = trimmed.includes("://") ? new URL(trimmed) : new URL(`http://${trimmed}`);
        return url.hostname.replace(/\.$/, "");
    } catch {
        // maybe plain domain
        if (/^[\w.-]+\.[A-Za-z]{2,}$/.test(trimmed)) return trimmed;
    }
    return null;
}

function humanSince(dateStr?: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const diff = date.getTime() - Date.now();
    const days = Math.round(diff / 86400000);
    if (Number.isNaN(days)) return "";
    if (days > 0) return `（あと ${days}日）`;
    return `（${Math.abs(days)}日前）`;
}

function pickEvent(events: Event[] | undefined, action: string) {
    return events?.find(e => e.eventAction === action)?.eventDate;
}

function findRegistrar(entities: Entity[] | undefined): string | undefined {
    const registrar = entities?.find(e => e.roles?.includes("registrar"));
    if (registrar?.vcardArray && registrar.vcardArray[1]) {
        const org = registrar.vcardArray[1].find((item: any[]) => item[0] === "fn");
        if (org) return org[3];
    }
    return undefined;
}

function parseNameServers(names: NameServer[] | undefined) {
    return names?.map(ns => ns.ldhName).filter(Boolean) as string[] | undefined;
}

function statusDescription(code: string) {
    if (code.includes("clientTransferProhibited")) return "移管防止ロックが有効です。";
    if (code.includes("clientHold")) return "クライアントによる一時停止（要確認）。";
    if (code.includes("serverHold")) return "レジストリによる停止。重大な問題の可能性。";
    if (code.includes("pendingDelete")) return "削除待ち。まもなく解放されます。";
    if (code.includes("ok")) return "正常状態。";
    return "";
}

export default function WhoisLookupPanel() {
    const [input, setInput] = useState("example.com");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [rdap, setRdap] = useState<RdapResponse | null>(null);
    const [raw, setRaw] = useState<string>("");

    async function lookup() {
        const domain = extractDomain(input);
        if (!domain) {
            setError("有効なドメイン名を入力してください。");
            setRdap(null);
            return;
        }
        setError(null);
        setLoading(true);
        setRdap(null);
        setRaw("");
        try {
            const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`);
            const data: RdapResponse = await res.json();
            if (data.errorCode || data.title === "Not Found") {
                setError("WHOIS 情報が見つかりませんでした。");
            } else {
                setRdap(data);
                setRaw(JSON.stringify(data, null, 2));
            }
        } catch (e: any) {
            setError(`WHOIS 取得中にエラーが発生しました: ${e.message ?? e}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        lookup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const created = pickEvent(rdap?.events, "registration");
    const updated = pickEvent(rdap?.events, "last changed");
    const expires = pickEvent(rdap?.events, "expiration");
    const registrar = findRegistrar(rdap?.entities);
    const nameservers = parseNameServers(rdap?.nameservers);
    const statusList = rdap?.status;

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Search size={18} /> WHOIS Lookup
                    </h4>
                    <p className="text-xs text-gray-400">ドメインの登録情報（Registrar / 期限 / ネームサーバー）を表示します。</p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1 flex items-center gap-1">
                    <Globe2 size={12} /> RDAP: rdap.org
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-gray-300">Domain</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-100"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="example.com または https://example.com/path"
                    />
                    <button className="px-4 py-2 bg-primary-500 text-black rounded flex items-center gap-2" onClick={lookup} disabled={loading}>
                        {loading ? <RefreshCcw size={14} className="animate-spin" /> : <Search size={14} />} Lookup
                    </button>
                </div>
                {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>

            {rdap && !error && (
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-1">
                            <div className="text-sm text-gray-400">Domain</div>
                            <div className="text-lg text-white font-mono">{rdap.ldhName}</div>
                            {rdap.handle && <div className="text-xs text-gray-500">Handle: {rdap.handle}</div>}
                        </div>
                        <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-1">
                            <div className="text-sm text-gray-400">Registrar</div>
                            <div className="text-sm text-white">{registrar || rdap.port43 || "N/A"}</div>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2">
                            <div className="text-sm text-gray-400">Status</div>
                            <div className="flex flex-wrap gap-2">
                                {statusList?.map(st => (
                                    <span key={st} className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-primary-200" title={statusDescription(st)}>
                                        {st}
                                    </span>
                                )) || <span className="text-xs text-gray-500">-</span>}
                            </div>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-1">
                            <div className="text-sm text-gray-400">Name Servers</div>
                            <div className="text-sm text-white space-y-1">
                                {nameservers?.length
                                    ? nameservers.map(ns => (
                                          <div key={ns} className="font-mono">
                                              {ns}
                                          </div>
                                      ))
                                    : "N/A"}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="bg-gray-950 border border-gray-800 rounded p-3">
                            <div className="text-sm text-gray-400">Created</div>
                            <div className="text-sm text-white">{created || "-"}</div>
                            <div className="text-xs text-gray-500">{humanSince(created)}</div>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 rounded p-3">
                            <div className="text-sm text-gray-400">Updated</div>
                            <div className="text-sm text-white">{updated || "-"}</div>
                            <div className="text-xs text-gray-500">{humanSince(updated)}</div>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 rounded p-3">
                            <div className="text-sm text-gray-400">Expires</div>
                            <div className="text-sm text-white">{expires || "-"}</div>
                            <div className="text-xs text-gray-500">{humanSince(expires)}</div>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 rounded p-3">
                            <div className="text-sm text-gray-400">Notices</div>
                            <div className="text-xs text-gray-300 space-y-1">
                                {rdap.notices?.length
                                    ? rdap.notices.map((n, idx) => (
                                          <div key={idx} className="border-b border-gray-800 pb-1">
                                              <div className="text-primary-200">{n.title}</div>
                                              <div>{n.description?.join(" ")}</div>
                                          </div>
                                      ))
                                    : "N/A"}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {raw && (
                <details className="bg-gray-950 border border-gray-800 rounded p-3">
                    <summary className="text-sm text-gray-200 cursor-pointer">Raw WHOIS (RDAP JSON)</summary>
                    <pre className="mt-2 text-xs text-gray-100 whitespace-pre-wrap">{raw}</pre>
                </details>
            )}
        </section>
    );
}
