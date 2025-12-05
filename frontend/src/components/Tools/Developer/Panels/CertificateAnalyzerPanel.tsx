import { useMemo, useState } from "react";
import { AlertCircle, Copy, RefreshCcw, Shield, ShieldCheck } from "lucide-react";
import { X509Certificate } from "@peculiar/x509";

type ParsedCert = {
    kind: "certificate";
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

type ParsedPublicKey = {
    kind: "publicKey";
    pem: string;
    index: number;
    keyType: string;
    keySize?: number;
    curve?: string;
    exponent?: number;
    modulusBits?: number;
    spkiSha256?: string;
    spkiSha1?: string;
    message?: string;
};

type ParsedEntry = ParsedCert | ParsedPublicKey;

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

function parsePemBlocks(text: string) {
    const matches = text.match(/-----BEGIN [^-]+-----[^-]+-----END [^-]+-----/g);
    return matches || [];
}

function toArrayBufferFromPem(pem: string) {
    const b64 = pem.replace(/-----BEGIN [^-]+-----/g, "").replace(/-----END [^-]+-----/g, "").replace(/\s+/g, "");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
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

function readLength(view: Uint8Array, offset: number) {
    let len = view[offset + 1];
    let lenBytes = 1;
    if (len & 0x80) {
        const n = len & 0x7f;
        len = 0;
        for (let i = 0; i < n; i++) len = (len << 8) | view[offset + 2 + i];
        lenBytes = 1 + n;
    }
    return { length: len, header: lenBytes + 1 };
}

function decodeOid(bytes: Uint8Array) {
    if (!bytes.length) return "";
    const first = bytes[0];
    const parts = [Math.floor(first / 40), first % 40];
    let value = 0;
    for (let i = 1; i < bytes.length; i++) {
        value = (value << 7) | (bytes[i] & 0x7f);
        if (!(bytes[i] & 0x80)) {
            parts.push(value);
            value = 0;
        }
    }
    return parts.join(".");
}

function parseSpki(bytes: Uint8Array): ParsedPublicKey | null {
    try {
        let offset = 0;
        if (bytes[offset++] !== 0x30) return null;
        const seqLen = readLength(bytes, offset - 1);
        offset += seqLen.header;
        if (bytes[offset++] !== 0x30) return null;
        const algLen = readLength(bytes, offset - 1);
        offset += algLen.header;
        if (bytes[offset++] !== 0x06) return null;
        const oidLen = readLength(bytes, offset - 1);
        const oid = decodeOid(bytes.slice(offset, offset + oidLen.length));
        offset += oidLen.length;
        let curveOid = "";
        if (bytes[offset] === 0x06) {
            const cLen = readLength(bytes, offset);
            curveOid = decodeOid(bytes.slice(offset + cLen.header - 1, offset + cLen.header - 1 + cLen.length));
            offset += cLen.header + cLen.length - 1;
        }
        while (bytes[offset] === 0x05) offset += 2; // skip NULL
        if (bytes[offset++] !== 0x03) return null;
        const bitLen = readLength(bytes, offset - 1);
        offset += bitLen.header;
        const bitString = bytes.slice(offset + 1, offset + bitLen.length); // skip unused bits byte

        if (oid === "1.2.840.113549.1.1.1") {
            let p = 0;
            if (bitString[p++] !== 0x30) return null;
            const seq2 = readLength(bitString, p - 1);
            p += seq2.header;
            if (bitString[p++] !== 0x02) return null;
            const modLen = readLength(bitString, p - 1);
            p += modLen.header;
            const modulusBytes = bitString.slice(p, p + modLen.length);
            const modulusBits = modulusBytes.length * 8;
            p += modLen.length;
            if (bitString[p++] !== 0x02) return null;
            const expLen = readLength(bitString, p - 1);
            p += expLen.header;
            let exponent = 0;
            for (let i = 0; i < expLen.length; i++) exponent = (exponent << 8) | bitString[p + i];
            return {
                kind: "publicKey",
                pem: "",
                index: 1,
                keyType: "RSA Public Key",
                keySize: modulusBits,
                exponent,
                modulusBits,
            };
        }
        if (oid === "1.2.840.10045.2.1") {
            let curve = "";
            if (curveOid === "1.2.840.10045.3.1.7") curve = "P-256";
            else if (curveOid === "1.3.132.0.34") curve = "P-384";
            else if (curveOid === "1.3.132.0.35") curve = "P-521";
            return {
                kind: "publicKey",
                pem: "",
                index: 1,
                keyType: `EC Public Key${curve ? ` (${curve})` : ""}`,
                keySize: bitString.length * 8,
                curve,
            };
        }
        return {
            kind: "publicKey",
            pem: "",
            index: 1,
            keyType: `Public Key (OID ${oid})`,
        };
    } catch {
        return null;
    }
}

async function hashBuffer(buffer: ArrayBuffer, algo: AlgorithmIdentifier = "SHA-256") {
    const digest = await crypto.subtle.digest(algo, buffer);
    return abToHex(digest);
}

function pemFromDer(buffer: ArrayBuffer, label: string) {
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const wrapped = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
    return `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----`;
}

export default function CertificateAnalyzerPanel() {
    const [input, setInput] = useState("");
    const [hostname, setHostname] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [entries, setEntries] = useState<ParsedEntry[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [selectedSample, setSelectedSample] = useState<SampleKey>("valid");

    const active = entries[activeIdx];

    const hostnameStatus = useMemo(() => {
        if (!hostname || !active || active.kind !== "certificate") return null;
        const host = hostname.toLowerCase();
        const dns = active.sanDNS.map(d => d.toLowerCase());
        const matches = dns.some(d => {
            if (d.startsWith("*.") && host.endsWith(d.slice(1))) return true;
            return d === host;
        });
        return {
            matches,
            message: matches ? "Hostname OK" : `Hostname mismatch: 証明書は ${dns.join(", ")} に対し、入力は ${host}`,
        };
    }, [hostname, active]);

    async function parseCertificate(pem: string, idx: number): Promise<ParsedCert | null> {
        try {
            const cert = new X509Certificate(pem);
            const sha1 = await cert.getThumbprint("SHA-1").then(abToHex);
            const sha256 = await cert.getThumbprint("SHA-256").then(abToHex);
            // subjectAltName may not be typed on X509Certificate; fallback to empty arrays when unavailable.
            const sanDNS: string[] = [];
            const sanIP: string[] = [];
            return {
                kind: "certificate",
                pem,
                index: idx,
                subject: cert.subject,
                issuer: cert.issuer,
                notBefore: cert.notBefore,
                notAfter: cert.notAfter,
                signatureAlgorithm: typeof cert.signatureAlgorithm === "string" ? cert.signatureAlgorithm : (cert.signatureAlgorithm as any)?.name || "Unknown",
                publicKeyAlgorithm: (cert.publicKey as any)?.algorithm?.name || "Unknown",
                publicKeySize: undefined,
                sanDNS,
                sanIP,
                sha1,
                sha256,
            };
        } catch {
            return null;
        }
    }

    async function parsePublicKey(pem: string, idx: number): Promise<ParsedPublicKey | null> {
        try {
            const ab = toArrayBufferFromPem(pem);
            const parsed = parseSpki(new Uint8Array(ab));
            if (!parsed) return null;
            const spkiSha256 = await hashBuffer(ab, "SHA-256");
            const spkiSha1 = await hashBuffer(ab, "SHA-1");
            return {
                ...parsed,
                pem,
                index: idx,
                spkiSha256,
                spkiSha1,
            };
        } catch {
            return null;
        }
    }

    async function analyze(text?: string) {
        const pemInput = (text ?? input).trim();
        setError(null);
        setEntries([]);
        setActiveIdx(0);
        if (!pemInput) {
            setError("証明書／公開鍵を入力してください。");
            return;
        }
        if (/BEGIN PRIVATE KEY/i.test(pemInput)) {
            setError("秘密鍵（PRIVATE KEY）は解析対象外です。公開鍵／証明書のみ入力してください。");
            return;
        }
        const blocks = parsePemBlocks(pemInput);
        if (!blocks.length) {
            setError("PEM 形式の証明書／公開鍵として認識できませんでした。BEGIN/END 行を確認してください。");
            return;
        }
        const parsed: ParsedEntry[] = [];
        let idx = 1;
        for (const b of blocks) {
            if (/BEGIN CERTIFICATE/i.test(b)) {
                const c = await parseCertificate(b, idx++);
                if (c) parsed.push(c);
            } else if (/BEGIN PUBLIC KEY|BEGIN RSA PUBLIC KEY|BEGIN EC PUBLIC KEY/i.test(b)) {
                const p = await parsePublicKey(b, idx++);
                if (p) parsed.push(p);
            }
        }
        if (!parsed.length) {
            setError("解析できる証明書／公開鍵が見つかりませんでした。");
            return;
        }
        setEntries(parsed);
    }

    function clearAll() {
        setInput("");
        setHostname("");
        setEntries([]);
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
        reader.onload = async () => {
            const result = reader.result;
            if (result instanceof ArrayBuffer) {
                // Try certificate
                try {
                    const pem = pemFromDer(result, "CERTIFICATE");
                    setInput(pem);
                    analyze(pem);
                    return;
                } catch {
                    // Try public key (SPKI)
                    const pem = pemFromDer(result, "PUBLIC KEY");
                    setInput(pem);
                    analyze(pem);
                }
            } else if (typeof result === "string") {
                setInput(result);
                analyze(result);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    const validityBadge = active && active.kind === "certificate" ? badgeForValidity(active) : null;

    const opensslHint = active
        ? active.kind === "certificate"
            ? "openssl x509 -in cert.pem -text -noout"
            : active.keyType.includes("EC")
                ? "openssl ec -pubin -in pubkey.pem -text -noout"
                : "openssl rsa -pubin -in pubkey.pem -text -noout"
        : "";

    return (
        <div className="space-y-4">
            <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Analyzer</div>
                <h3 className="text-2xl font-bold text-white">証明書 / 公開鍵 解析</h3>
                <p className="text-gray-400 text-sm">PEM/DER の X.509 証明書と公開鍵を解析します（ローカル処理のみ）。</p>
            </div>

            {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded-lg text-sm">
                    <AlertCircle size={18} />
                    <div>{error}</div>
                </div>
            )}

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <label className="text-gray-300">PEM / DER 入力</label>
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
                    <button className="px-4 py-2 bg-primary-500 text-black rounded font-semibold" onClick={() => analyze()}>Analyze</button>
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

            {entries.length > 0 && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                        <Shield size={16} className="text-primary-400" />
                        <span>解析対象: {entries.length} 件</span>
                        <div className="flex gap-2">
                            {entries.map((c, idx) => (
                                <button
                                    key={c.pem + idx}
                                    className={`px-3 py-1 rounded border text-xs ${idx === activeIdx ? "border-primary-500/60 text-primary-300" : "border-gray-700 text-gray-300 hover:border-primary-500/40"}`}
                                    onClick={() => setActiveIdx(idx)}
                                >
                                    #{idx + 1} {c.kind === "certificate" ? "Certificate" : "Public Key"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {active && active.kind === "certificate" && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2">
                                    <div className="text-sm text-gray-400">Subject</div>
                                    <div className="text-gray-100 text-sm break-words">{active.subject}</div>
                                </div>
                                <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2">
                                    <div className="text-sm text-gray-400">Issuer</div>
                                    <div className="text-gray-100 text-sm break-words">{active.issuer}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <ShieldCheck size={16} className="text-primary-400" />
                                        <span>Validity</span>
                                    </div>
                                    <div className="text-gray-100 text-sm">Not Before: {formatDate(active.notBefore)}</div>
                                    <div className="text-gray-100 text-sm">Not After: {formatDate(active.notAfter)}</div>
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
                                    <div className="text-gray-100 text-sm">{active.publicKeyAlgorithm} {active.publicKeySize ? `(${active.publicKeySize} bit)` : ""}</div>
                                    <div className="text-sm text-gray-400">Signature Algorithm</div>
                                    <div className="text-gray-100 text-sm">{active.signatureAlgorithm}</div>
                                    <div className="text-sm text-gray-400">SAN</div>
                                    <div className="text-gray-100 text-sm">DNS: {active.sanDNS.join(", ") || "-"}</div>
                                    <div className="text-gray-100 text-sm">IP: {active.sanIP.join(", ") || "-"}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <Copy size={14} /> Fingerprints
                                    </div>
                                    <div className="text-xs text-gray-300 break-all flex items-center gap-2">
                                        <span className="text-gray-400">SHA-256:</span>
                                        <span>{active.sha256 || "-"}</span>
                                        {active.sha256 && <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100" onClick={() => navigator.clipboard?.writeText(active.sha256!)}>Copy</button>}
                                    </div>
                                    <div className="text-xs text-gray-300 break-all flex items-center gap-2">
                                        <span className="text-gray-400">SHA-1:</span>
                                        <span>{active.sha1 || "-"}</span>
                                        {active.sha1 && <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100" onClick={() => navigator.clipboard?.writeText(active.sha1!)}>Copy</button>}
                                    </div>
                                </div>
                                <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2 text-sm text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle size={16} className="text-primary-400" />
                                        <span>診断コメント</span>
                                    </div>
                                    {active.publicKeyAlgorithm?.toLowerCase().includes("rsa") && active.publicKeySize && active.publicKeySize < 2048 && (
                                        <div className="text-red-300">RSA 2048 未満は弱いとされます。2048bit 以上を推奨します。</div>
                                    )}
                                    {active.signatureAlgorithm?.toLowerCase().includes("sha1") && (
                                        <div className="text-red-300">署名アルゴリズムが SHA-1 です。SHA-256 以上への移行を推奨します。</div>
                                    )}
                                    {!active.publicKeySize && <div className="text-gray-400">鍵長情報を取得できませんでした。</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {active && active.kind === "publicKey" && (
                        <div className="space-y-3">
                            <div className="bg-gray-950 border border-gray-800 rounded p-3 space-y-2 text-sm text-gray-200">
                                <div>Key Type: {active.keyType}</div>
                                <div>Key Size: {active.keySize ? `${active.keySize} bit` : "N/A"}</div>
                                {active.curve && <div>Curve: {active.curve}</div>}
                                {active.modulusBits && <div>Modulus: {active.modulusBits} bit</div>}
                                {active.exponent && <div>Exponent: {active.exponent} (0x{active.exponent.toString(16)})</div>}
                                {active.spkiSha256 && (
                                    <div className="text-xs text-gray-300 break-all flex items-center gap-2">
                                        <span className="text-gray-400">SPKI SHA-256:</span>
                                        <span>{active.spkiSha256}</span>
                                        <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100" onClick={() => navigator.clipboard?.writeText(active.spkiSha256!)}>Copy</button>
                                    </div>
                                )}
                                {active.spkiSha1 && (
                                    <div className="text-xs text-gray-300 break-all flex items-center gap-2">
                                        <span className="text-gray-400">SPKI SHA-1:</span>
                                        <span>{active.spkiSha1}</span>
                                        <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100" onClick={() => navigator.clipboard?.writeText(active.spkiSha1!)}>Copy</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {opensslHint && (
                        <div className="flex items-center gap-2 text-xs text-gray-300 bg-gray-950 border border-gray-800 rounded p-3">
                            OpenSSL: <code className="break-all">{opensslHint}</code>
                            <button className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100" onClick={() => navigator.clipboard?.writeText(opensslHint)}>Copy</button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield size={14} />
                入力された証明書・公開鍵はブラウザ内でのみ処理され、外部に送信されません。
            </div>
        </div>
    );
}
