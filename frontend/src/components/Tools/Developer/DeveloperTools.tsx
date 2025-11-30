import { useState, useEffect } from 'react';
import { calculate } from 'ip-subnet-calculator';
import CryptoJS from 'crypto-js';
import { QRCodeCanvas } from 'qrcode.react';
import { Network, Lock, QrCode, Copy, Download } from 'lucide-react';
import clsx from 'clsx';

// --- Subnet Calculator ---
const SubnetCalc = () => {
    const [ip, setIp] = useState('192.168.1.1');
    const [mask, setMask] = useState(24);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        try {
            const calc = calculate(ip, mask);
            // エラー修正: calcがnullまたは空の場合のチェックを追加
            if (calc && calc.length > 0) {
                setResult(calc[0]);
            } else {
                setResult(null);
            }
        } catch (e) {
            setResult(null);
        }
    }, [ip, mask]);

    const Row = ({ label, value }: any) => (
        <div className="flex justify-between border-b border-gray-700 py-2 last:border-0">
            <span className="text-gray-400 text-sm">{label}</span>
            <span className="text-white font-mono select-all">{value}</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-surface p-6 rounded-xl border border-gray-700">
                <h3 className="text-primary-400 font-bold mb-4 flex items-center gap-2">
                    <Network size={20} /> IPv4 CIDR Calculator
                </h3>
                <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">IP Address</label>
                        <input 
                            type="text" 
                            value={ip} 
                            onChange={(e) => setIp(e.target.value)} 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white font-mono"
                        />
                    </div>
                    <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-1">CIDR (/{mask})</label>
                        <input 
                            type="number" 
                            min="0" max="32"
                            value={mask} 
                            onChange={(e) => setMask(Number(e.target.value))} 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white font-mono text-center"
                        />
                    </div>
                </div>

                {result ? (
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-1">
                        <Row label="Network Address" value={result.ipLowStr} />
                        <Row label="Broadcast Address" value={result.ipHighStr} />
                        <Row label="Subnet Mask" value={result.prefixMaskStr} />
                        <Row label="Wildcard Mask" value={result.invertedMaskStr} />
                        <Row label="Hosts Count" value={(result.ipHigh - result.ipLow - 1).toLocaleString()} />
                        <Row label="Host Range" value={`${result.ipLowStr.replace(/\d+$/, (m:any) => parseInt(m)+1)} - ${result.ipHighStr.replace(/\d+$/, (m:any) => parseInt(m)-1)}`} />
                    </div>
                ) : (
                    <div className="text-center text-red-400 py-4">Invalid IP Address</div>
                )}
            </div>
        </div>
    );
};

// --- Hash Generator ---
const HashGen = () => {
    const [input, setInput] = useState('');
    
    const hashes = [
        { label: 'MD5', val: input ? CryptoJS.MD5(input).toString() : '' },
        { label: 'SHA-1', val: input ? CryptoJS.SHA1(input).toString() : '' },
        { label: 'SHA-256', val: input ? CryptoJS.SHA256(input).toString() : '' },
        { label: 'SHA-512', val: input ? CryptoJS.SHA512(input).toString() : '' },
    ];

    const copy = (text: string) => {
        if(!text) return;
        navigator.clipboard.writeText(text);
        alert('Copied!');
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-surface p-6 rounded-xl border border-gray-700">
                <h3 className="text-primary-400 font-bold mb-4 flex items-center gap-2">
                    <Lock size={20} /> Hash Generator
                </h3>
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full h-24 bg-gray-900 border border-gray-600 rounded p-3 text-white font-mono mb-6 focus:border-primary-500 focus:outline-none"
                    placeholder="Enter text to hash..."
                />
                
                <div className="space-y-4">
                    {hashes.map(h => (
                        <div key={h.label}>
                            <label className="text-xs text-gray-500 block mb-1">{h.label}</label>
                            <div className="flex gap-2">
                                <input 
                                    readOnly 
                                    value={h.val} 
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded p-2 text-xs font-mono text-gray-300 truncate"
                                />
                                <button onClick={() => copy(h.val)} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded">
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- QR Generator ---
const QrGen = () => {
    const [text, setText] = useState('https://usefulhub.net');
    const [size] = useState(256);
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');

    const download = () => {
        const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
        if(canvas) {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = 'qrcode.png';
            a.click();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-surface p-6 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-8">
                
                <div className="flex-1 space-y-4">
                    <h3 className="text-primary-400 font-bold flex items-center gap-2">
                        <QrCode size={20} /> QR Code Generator
                    </h3>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Content (URL or Text)</label>
                        <textarea 
                            value={text} 
                            onChange={(e) => setText(e.target.value)}
                            className="w-full h-24 bg-gray-900 border border-gray-600 rounded p-3 text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Foreground</label>
                            <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-full h-10 bg-gray-800 rounded cursor-pointer" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Background</label>
                            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-10 bg-gray-800 rounded cursor-pointer" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center bg-gray-800 p-6 rounded-xl">
                    <div className="bg-white p-2 rounded shadow-lg mb-4">
                        <QRCodeCanvas 
                            id="qr-canvas"
                            value={text} 
                            size={size} 
                            fgColor={fgColor} 
                            bgColor={bgColor} 
                            level={"H"}
                        />
                    </div>
                    <button 
                        onClick={download}
                        className="flex items-center gap-2 bg-primary-500 text-black font-bold px-6 py-2 rounded-full hover:bg-primary-400 transition"
                    >
                        <Download size={18} /> Download PNG
                    </button>
                </div>

            </div>
        </div>
    );
};

export default function DeveloperTools() {
    const [tab, setTab] = useState<'network' | 'hash' | 'qr'>('network');

    const tabs = [
        { id: 'network', label: 'Network Calc', icon: Network },
        { id: 'hash', label: 'Hash Generator', icon: Lock },
        { id: 'qr', label: 'QR Code', icon: QrCode },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Network className="text-primary-500" />
                    Dev & Network Tools
                </h2>
                <p className="text-gray-500 text-sm">
                    Utilities for Developers & Network Engineers
                </p>
            </div>

            <div className="flex justify-center gap-2 md:gap-4 overflow-x-auto pb-2">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id as any)}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap",
                            tab === t.id 
                                ? "bg-primary-500 text-black shadow-lg" 
                                : "bg-surface text-gray-400 hover:bg-gray-800"
                        )}
                    >
                        <t.icon size={18} />
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {tab === 'network' && <SubnetCalc />}
                {tab === 'hash' && <HashGen />}
                {tab === 'qr' && <QrGen />}
            </div>
        </div>
    );
}
