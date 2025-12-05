import { useEffect, useState } from "react";
import { Calculator, Info, Router } from "lucide-react";

type CidrResult = {
    network: string;
    broadcast: string;
    netmask: string;
    wildcard: string;
    hostRange: string;
    totalHosts: number;
    usableHosts: number;
    binary: string;
};

function ipToInt(ip: string): number | null {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) return null;
    return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function intToIp(num: number): string {
    return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join(".");
}

function toBinary(ipInt: number): string {
    return [24, 16, 8, 0].map(shift => ((ipInt >>> shift) & 255).toString(2).padStart(8, "0")).join(".");
}

function calcCidr(input: string): { result?: CidrResult; error?: string } {
    const trimmed = input.trim();
    if (!trimmed) return { error: "CIDR を入力してください (例: 192.168.10.0/24)" };

    const [ipStr, maskStr] = trimmed.includes("/") ? trimmed.split("/") : [trimmed, ""];
    const prefix = maskStr ? Number(maskStr) : NaN;
    const ipInt = ipToInt(ipStr);
    if (ipInt === null) return { error: "無効な IPv4 アドレスです。" };
    if (Number.isNaN(prefix) || prefix < 0 || prefix > 32) return { error: "プレフィックス長は 0〜32 で指定してください。" };

    const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const network = (ipInt & maskInt) >>> 0;
    const broadcast = (network | (~maskInt >>> 0)) >>> 0;

    const totalHosts = 2 ** (32 - prefix);
    let usableHosts: number;
    let hostRange: string;

    if (prefix === 32) {
        usableHosts = 1;
        hostRange = `${intToIp(ipInt)}（単一IP）`;
    } else if (prefix === 31) {
        usableHosts = 2;
        hostRange = `${intToIp(network)} 〜 ${intToIp(broadcast)}（/31 P2P 用）`;
    } else {
        usableHosts = Math.max(0, totalHosts - 2);
        const firstHost = network + 1;
        const lastHost = broadcast - 1;
        hostRange = `${intToIp(firstHost)} 〜 ${intToIp(lastHost)}`;
    }

    const result: CidrResult = {
        network: intToIp(network),
        broadcast: intToIp(broadcast),
        netmask: intToIp(maskInt),
        wildcard: intToIp(~maskInt >>> 0),
        hostRange,
        totalHosts,
        usableHosts,
        binary: toBinary(network),
    };
    return { result };
}

const presets = ["10.0.0.0/8", "172.16.0.0/16", "192.168.1.0/24", "192.168.1.0/30", "192.168.1.0/31", "192.168.1.1/32"];

export default function CidrCalculatorPanel() {
    const [cidr, setCidr] = useState("192.168.10.0/24");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CidrResult | null>(null);

    useEffect(() => {
        const { result, error: err } = calcCidr(cidr);
        setError(err ?? null);
        setResult(result ?? null);
    }, [cidr]);

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Router size={18} /> CIDR Calculator
                    </h4>
                    <p className="text-xs text-gray-400">CIDR を入力してネットワーク / ブロードキャスト / ホスト範囲を一括算出します。</p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1 flex items-center gap-1">
                    <Info size={12} /> /31・/32 もサポート
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-gray-300">Input CIDR</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-gray-100"
                        value={cidr}
                        onChange={e => setCidr(e.target.value)}
                        placeholder="192.168.10.0/24"
                    />
                    <button
                        className="px-4 py-2 bg-primary-500 text-black rounded flex items-center gap-2"
                        onClick={() => {
                            const { result, error: err } = calcCidr(cidr);
                            setError(err ?? null);
                            setResult(result ?? null);
                        }}
                    >
                        <Calculator size={14} /> 自動計算
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                    {presets.map(preset => (
                        <button key={preset} className="px-2 py-1 bg-gray-800 rounded border border-gray-700 hover:border-primary-500 text-gray-200" onClick={() => setCidr(preset)}>
                            {preset}
                        </button>
                    ))}
                </div>
                {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>

            {result && !error && (
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="bg-gray-950 border border-gray-800 rounded p-3">
                            <div className="text-sm text-gray-400">Network Address</div>
                            <div className="text-lg text-white font-mono">{result.network}</div>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 rounded p-3">
                            <div className="text-sm text-gray-400">Broadcast Address</div>
                            <div className="text-lg text-white font-mono">{result.broadcast}</div>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 rounded p-3">
                            <div className="text-sm text-gray-400">Host Range</div>
                            <div className="text-lg text-white font-mono">{result.hostRange}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="bg-gray-950 border border-gray-800 rounded p-3">
                            <div className="text-sm text-gray-400">Subnet Mask</div>
                            <div className="text-lg text-white font-mono">{result.netmask}</div>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 rounded p-3">
                            <div className="text-sm text-gray-400">Wildcard Mask</div>
                            <div className="text-lg text-white font-mono">{result.wildcard}</div>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 rounded p-3 grid grid-cols-2 gap-2">
                            <div>
                                <div className="text-sm text-gray-400">Total Hosts</div>
                                <div className="text-lg text-white font-mono">{result.totalHosts}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">Usable Hosts</div>
                                <div className="text-lg text-white font-mono">{result.usableHosts}</div>
                            </div>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 rounded p-3">
                            <div className="text-sm text-gray-400">Binary (network)</div>
                            <div className="text-sm text-white font-mono break-all">{result.binary}</div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
