import { useMemo, useState } from "react";
import { AlertCircle, Copy, RefreshCcw, Shield, ShieldCheck } from "lucide-react";
import { X509Certificate } from "@peculiar/x509";

type ParsedCert = {
    pem: string;
    index: number;
    subject: string;
    issuer: string;
    notBefore: Date;
    notAfter: Date;
    signatureAlgorithm: string;
    publicKeyAlgorithm: string;
    publicKeySize?: number;
    sanDNS: string[];
    sanIP: string[];
    sha1?: string;
    sha256?: string;
};

type SampleKey = "valid";

const SAMPLE_CERTS: Record<SampleKey, { label: string; pem: string }> = {
    valid: {
        label: "Valid server cert (RSA, SHA-256)",
        pem: `-----BEGIN CERTIFICATE-----
MIIC0jCCAbqgAwIBAgIUSQ1zAm1N9EJnKZ+ztAuqMUqWjBMwDQYJKoZIhvcNAQEL
BQAwJjESMBAGA1UEAwwJRXhhbXBsZSBDQTESMBAGA1UECgwJRXhhbXBsZSBJbmMw
HhcNMjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjAaMRgwFgYDVQQDDA93d3cu
ZXhhbXBsZS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCwhlmx
hCgUu4PNF3vfcHCJ70NBFntCR7JXtKquuYWRusf1Mf8Wc+umv3WxXb7Htahyn0ZD
koM9q6fK5P+4Xgsuw/rldN6+b+XW3o2yfcjbzZ+ycnTXB8L2p7bWv7jIvUiBDT0r
46JOrPXjaU0/8p/Dig7MHPVwzTsOslAr8GEnY2vMAM3GvI6pq3G1aqXpqYKf88fr
3sVob1H1fvySjkLS1Slgz7cT8DLfNXoOIYSmJw/9CrIv8cs3uXMZEDmXokolGV2z
ihbDN6VlY1UkFjY+gxnrgDG2LZK+Si3YzvC/kYcR/SQd8B7EDcZ8onmpwUVYuJZj
AgMBAAGjUzBRMB0GA1UdDgQWBBSR5yiwjHIMw0yJRrnMs5iTBY/MZDAfBgNVHSME
GDAWgBTXV7AKS2j7X8dpjfRBuXKc2tJAQjAPBgNVHRMBAf8EBTADAQH/MA0GCSqG
SIb3DQEBCwUAA4IBAQBGOCvXTEBbQfwqvTGC7MBxE+KCT+/0Xlc3HBpBHMhrjQzP
yiYskM8eJzNcGkm9xs1ZKrX2NoBiS7xu8MzOBd5pRSzevMT8OhtapnvjdvZvVtST
h0FbL+nnVuRM58zc9qtbxA9qPbS4nnYJ40OdHeqj4yi6o0p0qVc1YDZcplJWLv7Q
+V1WM4cpwk9wxWhU7Cq19Ah/LbH5dLIdhjmK0Y/gj8HcKPNaWJ0KNmI6ArG/qbFd
MPWHJ9D2B3r1lM/LB0tBkDFc7mq4UByz3/6EtmW9oJubkgCp9dS7ReRZH6hv9RAB
wfHEb4AQyL/37xUV+XDjlN4g3KJd
-----END CERTIFICATE-----`,
    },
};

function parsePemChain(text: string) {
    const matches = text.match(/-----BEGIN CERTIFICATE-----[^-]+-----END CERTIFICATE-----/g);
    return matches || [];
}

function formatDate(d: Date) {
    return `${d.toISOString()} / ${d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`;
}

function badgeForValidity(cert: ParsedCert) {
    const now = Date.now();
    const start = cert.notBefore.getTime();
    const end = cert.notAfter.getTime();
    if (now < start) return { color: "bg-blue-500/20 text-blue-200", text: `まだ有効開始前（開始まで ${Math.ceil((start - now) / 86400000)} 日）` };
    if (now > end) return { color: "bg-red-500/20 text-red-200", text: `期限切れ（${Math.ceil((now - end) / 86400000)} 日経過）` };
    const days = Math.floor((end - now) / 86400000);
    if (days < 30) return { color: "bg-amber-500/20 text-amber-200", text: `有効（残り ${days} 日：更新推奨）` };
    return { color: "bg-green-500/20 text-green-200", text: `有効（残り ${days} 日）` };
}

function abToHex(data: ArrayBuffer) {
    return Array.from(new Uint8Array(data)).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase().match(/.{1,2}/g)?.join(":") || "";
}

export default function CertificateAnalyzerPanel() {
    const [input, setInput] = useState("");
    const [hostname, setHostname] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [certs, setCerts] = useState<ParsedCert[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [selectedSample, setSelectedSample] = useState<SampleKey>("valid");

    const activeCert = certs[activeIdx];

    const hostnameStatus = useMemo(() => {
        if (!hostname || !activeCert) return null;
        const host = hostname.toLowerCase();
        const dns = activeCert.sanDNS.map(d => d.toLowerCase());
        const matches = dns.some(d => {
            if (d.startsWith("*.") && host.endsWith(d.slice(1))) return true;
            return d === host;
        });
        return {
            matches,
            message: matches ? "Hostname OK" : `Hostname mismatch: 証明書は ${dns.join(", ")} に対し、入力は ${host}`,
        };
    }, [hostname, activeCert]);

    async function analyze(text?: string) {
        const pemInput = (text ?? input).trim();
        setError(null);
        setCerts([]);
        setActiveIdx(0);
        if (!pemInput) {
            setError("証明書を入力してください。");
            return;
        }
        const chain = parsePemChain(pemInput);
        if (!chain.length) {
            setError("PEM 形式の証明書として認識できませんでした。BEGIN/END 行が正しいか確認してください。");
            return;
        }
        const parsed: ParsedCert[] = [];
        for (let i = 0; i < chain.length; i++) {
            try {
                const cert = new X509Certificate(chain[i]);
                const sha1 = await cert.getThumbprint("SHA-1").then(abToHex);
                const sha256 = await cert.getThumbprint("SHA-256").then(abToHex);
                
                // Extract SAN from certificate extensions - simplified approach
                let sanDNS: string[] = [];
                let sanIP: string[] = [];
                try {
                    // Try to find SubjectAltName extension
                    const extensions = cert.extensions || [];
                    for (const ext of extensions) {
                        const extId = (ext as any).oid || (ext as any).extnID;
                        if (extId === "2.5.29.17" || extId === "subjectAltName") {
                            const value = (ext as any).value || (ext as any).extnValue;
                            if (value) {
                                sanDNS = (value as any).dnsNames || [];
                                sanIP = (value as any).ipAddresses || [];
                                break;
                            }
                        }
                    }
                } catch (e) {
                    // No SAN found
                }
                
                const sigAlg = cert.signatureAlgorithm?.name ? String(cert.signatureAlgorithm.name) : "Unknown";
                const pubKeySize = (cert.publicKey?.algorithm as any)?.modulusLength || undefined;
                
                parsed.push({
                    pem: chain[i],
                    index: i + 1,
                    subject: cert.subject,
                    issuer: cert.issuer,
                    notBefore: cert.notBefore,
                    notAfter: cert.notAfter,
                    signatureAlgorithm: sigAlg,
                    publicKeyAlgorithm: cert.publicKey?.algorithm?.name ? String(cert.publicKey.algorithm.name) : "Unknown",
                    publicKeySize: pubKeySize,
                    sanDNS,
                    sanIP,
                    sha1,
                    sha256,
                });
            } catch (e: any) {
                setError("証明書の解析に失敗しました。破損しているか、サポートされていない形式の可能性があります。");
                return;
            }
        }
        setCerts(parsed);
    }

    function clearAll() {
        setInput("");
        setHostname("");
        setCerts([]);
        setActiveIdx(0);
        setError(null);
    }

    function loadSample() {
        const s = SAMPLE_CERTS[selectedSample];
        if (!s) return;
        setInput(s.pem);
        setTimeout(() => analyze(s.pem), 0);
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === "string") {
                setInput(result);
                analyze(result);
            } else if (result instanceof ArrayBuffer) {
                const b64 = btoa(String.fromCharCode(...new Uint8Array(result)));
                const pem = `-----BEGIN CERTIFICATE-----\n${b64.match(/.{1,64}/g)?.join("\n")}\n-----END CERTIFICATE-----`;
                setInput(pem);
                analyze(pem);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    const validityBadge = activeCert ? badgeForValidity(activeCert) : null;

    return (
        <div className="space-y-4">
            <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Analyzer</div>
                <h3 className="text-2xl font-bold text-white">Certificate Analyzer</h3>
                <p className="text-gray-400 text-sm">PEM/DER の X.509 証明書を解析し、期限や SAN を確認します。処理はブラウザ内のみで行われます。</p>
            </div>

            {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded-lg text-sm">
                    <AlertCircle size={18} />
                    <div>{error}</div>
                </div>
            )}

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <label className="text-gray-300">Certificate (PEM)</label>
                    <div className="flex items-center gap-2 ml-auto">
                        <input type="file" accept=".pem,.crt,.cer,.der" onChange={onFileChange} className="text-xs text-gray-300" />
                        <select
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-100"
                            value={selectedSample}
                            onChange={e => setSelectedSample(e.target.value as SampleKey)}
                        >
                            {Object.entries(SAMPLE_CERTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 hover:border-primary-500/60" onClick={loadSample}>Load</button>
                    </div>
                </div>
                <textarea
                    className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[180px]"
                    placeholder="-----BEGIN CERTIFICATE-----"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />
                <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 bg-primary-500 text-black rounded font-semibold" onClick={() => analyze()}>Analyze Certificate</button>
                    <button className="px-3 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700" onClick={clearAll}>
                        <RefreshCcw size={14} className="inline mr-1" /> Clear
                    </button>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <label>Hostname (CN/SAN check)</label>
                        <input
                            type="text"
                            className="bg-gray-950 border border-gray-800 rounded px-2 py-1 text-gray-100"
                            value={hostname}
                            onChange={e => setHostname(e.target.value)}
                            placeholder="www.example.com"
                        />
                    </div>
                </div>
            </div>

            {certs.length > 0 && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                        <Shield size={16} className="text-primary-400" />
                        <span>チェーン内証明書: {certs.length} 枚</span>
                        <div className="flex gap-2">
                            {certs.map((c, idx) => (
                                <button
                                    key={idx}
                                    className={`px-3 py-1 rounded border text-xs ${idx === activeIdx ? "border-primary-500/60 text-primary-300" : "border-gray-700 text-gray-300 hover:border-primary-500/40"}`}
                                    onClick={() => setActiveIdx(idx)}
                                >
                                    #{c.index}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeCert && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2">
                                    <div className="text-sm text-gray-400">Subject</div>
                                    <div className="text-gray-100 text-sm break-words">{activeCert.subject}</div>
                                </div>
                                <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2">
                                    <div className="text-sm text-gray-400">Issuer</div>
                                    <div className="text-gray-100 text-sm break-words">{activeCert.issuer}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <ShieldCheck size={16} className="text-primary-400" />
                                        <span>Validity</span>
                                    </div>
                                    <div className="text-gray-100 text-sm">Not Before: {formatDate(activeCert.notBefore)}</div>
                                    <div className="text-gray-100 text-sm">Not After: {formatDate(activeCert.notAfter)}</div>
                                    {validityBadge && (
                                        <div className={`inline-flex px-2 py-1 rounded border text-xs ${validityBadge.color}`}>{validityBadge.text}</div>
                                    )}
                                    {hostnameStatus && (
                                        <div className={`inline-flex px-2 py-1 rounded border text-xs ${hostnameStatus.matches ? "bg-green-500/20 text-green-200 border-green-500/40" : "bg-red-500/20 text-red-200 border-red-500/40"}`}>
                                            {hostnameStatus.message}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2">
                                    <div className="text-sm text-gray-400">Public Key</div>
                                    <div className="text-gray-100 text-sm">{activeCert.publicKeyAlgorithm} {activeCert.publicKeySize ? `(${activeCert.publicKeySize} bit)` : ""}</div>
                                    <div className="text-sm text-gray-400">Signature Algorithm</div>
                                    <div className="text-gray-100 text-sm">{activeCert.signatureAlgorithm}</div>
                                    <div className="text-sm text-gray-400">SAN</div>
                                    <div className="text-gray-100 text-sm">DNS: {activeCert.sanDNS.join(", ") || "-"}</div>
                                    <div className="text-gray-100 text-sm">IP: {activeCert.sanIP.join(", ") || "-"}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <Copy size={14} /> Fingerprints
                                    </div>
                                    <div className="text-xs text-gray-300 break-all flex items-center gap-2">
                                        <span className="text-gray-400">SHA-256:</span>
                                        <span>{activeCert.sha256 || "-"}</span>
                                        {activeCert.sha256 && <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100" onClick={() => navigator.clipboard?.writeText(activeCert.sha256!)}>Copy</button>}
                                    </div>
                                    <div className="text-xs text-gray-300 break-all flex items-center gap-2">
                                        <span className="text-gray-400">SHA-1:</span>
                                        <span>{activeCert.sha1 || "-"}</span>
                                        {activeCert.sha1 && <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100" onClick={() => navigator.clipboard?.writeText(activeCert.sha1!)}>Copy</button>}
                                    </div>
                                </div>
                                <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2 text-sm text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle size={16} className="text-primary-400" />
                                        <span>診断コメント</span>
                                    </div>
                                    {activeCert.publicKeySize && activeCert.publicKeySize < 2048 && (
                                        <div className="text-red-300">RSA 2048 未満は弱いとされます。2048bit 以上を推奨します。</div>
                                    )}
                                    {activeCert.signatureAlgorithm?.toLowerCase().includes("sha1") && (
                                        <div className="text-red-300">署名アルゴリズムが SHA-1 です。SHA-256 以上への移行を推奨します。</div>
                                    )}
                                    {!activeCert.publicKeySize && <div className="text-gray-400">鍵長情報を取得できませんでした。</div>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield size={14} />
                入力された証明書データはブラウザ内でのみ処理され、外部に送信されません。
            </div>
        </div>
    );
}
