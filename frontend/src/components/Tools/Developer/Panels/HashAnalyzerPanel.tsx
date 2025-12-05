import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import CryptoJS from 'crypto-js';

type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';
type HashEncoding = 'hex' | 'base64';
type HashStatus = 'Pending' | 'Running' | 'Found' | 'Not found' | 'Stopped' | 'Error';

interface HashResult {
    hash: string;
    status: HashStatus;
    password: string;
    checked: number;
    elapsedMs: number;
}

const HASH_HEX_LENGTH: Record<HashAlgorithm, number> = {
    MD5: 32,
    'SHA-1': 40,
    'SHA-256': 64,
    'SHA-512': 128,
};

const HASH_BYTE_LENGTH: Record<HashAlgorithm, number> = {
    MD5: 16,
    'SHA-1': 20,
    'SHA-256': 32,
    'SHA-512': 64,
};

function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function formatNumber(n: number) {
    return n.toLocaleString();
}

function normalizeHash(hash: string, encoding: HashEncoding) {
    return encoding === 'hex' ? hash.trim().toLowerCase() : hash.trim();
}

function timestamp() {
    const d = new Date();
    return `[${d.toLocaleTimeString()}]`;
}

async function countLines(file: File) {
    const reader = file.stream().getReader();
    const decoder = new TextDecoder();
    let count = 0;
    let buffer = '';

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx = buffer.indexOf('\n');
            while (idx !== -1) {
                count++;
                buffer = buffer.slice(idx + 1);
                idx = buffer.indexOf('\n');
            }
        }
        buffer += decoder.decode();
        if (buffer.length > 0) count++;
    } finally {
        reader.releaseLock();
    }
    return count;
}

async function* iterateLines(file: File) {
    const reader = file.stream().getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                yield line;
            }
        }
        buffer += decoder.decode();
        if (buffer) {
            yield buffer;
        }
    } finally {
        reader.releaseLock();
    }
}

function arrayBufferToHex(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
}


async function hashCandidate(candidate: string, algorithm: HashAlgorithm) {
    if (algorithm === 'MD5') {
        const wordArray = CryptoJS.enc.Utf8.parse(candidate);
        const digest = CryptoJS.MD5(wordArray);
        return {
            hex: digest.toString(CryptoJS.enc.Hex),
            base64: digest.toString(CryptoJS.enc.Base64),
        };
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(candidate);
    const subtle = window.crypto?.subtle;
    if (!subtle) throw new Error('Web Crypto API is unavailable.');
    const digest = await subtle.digest(algorithm, data);
    return {
        hex: arrayBufferToHex(digest),
        base64: arrayBufferToBase64(digest),
    };
}

function parseHashes(input: string, multiple: boolean) {
    const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!multiple) return lines.slice(0, 1);
    return lines;
}

function validateHashes(hashes: string[], algorithm: HashAlgorithm, encoding: HashEncoding) {
    if (!hashes.length) return 'Enter at least one hash value.';
    for (const h of hashes) {
        const trimmed = h.trim();
        if (!trimmed) return 'Enter at least one hash value.';
        if (encoding === 'hex') {
            const expectedLen = HASH_HEX_LENGTH[algorithm];
            if (trimmed.length !== expectedLen || !/^[0-9a-fA-F]+$/.test(trimmed)) {
                return 'Invalid hash format for selected algorithm.';
            }
        } else {
            try {
                const decoded = atob(trimmed);
                const expectedBytes = HASH_BYTE_LENGTH[algorithm];
                if (decoded.length !== expectedBytes) return 'Invalid hash length for selected algorithm.';
            } catch {
                return 'Invalid base64 hash format.';
            }
        }
    }
    return null;
}

function csvEscape(value: string) {
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
}

export default function HashAnalyzerPanel() {
    const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
    const [encoding, setEncoding] = useState<HashEncoding>('hex');
    const [multiple, setMultiple] = useState(false);
    const [hashInput, setHashInput] = useState('');
    const [passwordFile, setPasswordFile] = useState<File | null>(null);
    const [results, setResults] = useState<HashResult[]>([]);
    const [running, setRunning] = useState(false);
    const [checkedTotal, setCheckedTotal] = useState(0);
    const [totalCandidates, setTotalCandidates] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [threads, setThreads] = useState(() => Math.max(1, Math.floor((navigator.hardwareConcurrency || 4) / 2)));

    const stopRef = useRef(false);

    const progressPercent = useMemo(() => {
        if (!totalCandidates) return 0;
        return Math.min(100, Math.floor((checkedTotal / totalCandidates) * 100));
    }, [checkedTotal, totalCandidates]);

    const canStart = useMemo(() => {
        if (running) return false;
        if (!passwordFile) return false;
        if (!hashInput.trim()) return false;
        return true;
    }, [running, passwordFile, hashInput]);

    function addLog(message: string) {
        setLogs(prev => [`${timestamp()} ${message}`, ...prev].slice(0, 200));
    }

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        setPasswordFile(f || null);
    }

    function updateProgress(processed: number, start: number) {
        const now = performance.now();
        const elapsed = now - start;
        setCheckedTotal(processed);
        setElapsedMs(elapsed);
        setSpeed(processed / Math.max(1, elapsed / 1000));
    }

    async function startAnalysis() {
        if (running) return;
        const hashes = parseHashes(hashInput, multiple);
        const validationError = validateHashes(hashes, algorithm, encoding);
        if (validationError) {
            setError(validationError);
            return;
        }
        if (!passwordFile) {
            setError('Choose a password list file.');
            return;
        }

        setError(null);
        stopRef.current = false;
        setRunning(true);
        setCheckedTotal(0);
        setElapsedMs(0);
        setSpeed(0);
        setTotalCandidates(0);

        const normalizedTargets = hashes.map(h => normalizeHash(h, encoding));
        const remaining = new Set(normalizedTargets);
        setResults(hashes.map(hash => ({
            hash,
            status: 'Running',
            password: '',
            checked: 0,
            elapsedMs: 0,
        })));

        addLog(`Analysis started (Algorithm: ${algorithm}, Wordlist: ${passwordFile.name}, Encoding: ${encoding}, Threads: ${threads})`);

        const total = await countLines(passwordFile);
        setTotalCandidates(total);

        const start = performance.now();
        let processed = 0;
        let lastUpdate = start;

        try {
            for await (const line of iterateLines(passwordFile)) {
                if (stopRef.current) break;
                const candidate = line.trim();
                if (!candidate) continue;

                processed++;

                const { hex, base64 } = await hashCandidate(candidate, algorithm);
                const candidateValue = encoding === 'hex' ? hex.toLowerCase() : base64;

                if (remaining.has(candidateValue)) {
                    const elapsedForHash = performance.now() - start;
                    remaining.delete(candidateValue);
                    setResults(prev => prev.map(r => {
                        if (normalizeHash(r.hash, encoding) === candidateValue) {
                            return {
                                ...r,
                                status: 'Found',
                                password: candidate,
                                checked: processed,
                                elapsedMs: elapsedForHash,
                            };
                        }
                        return r;
                    }));
                    addLog(`Match found for ${candidateValue.slice(0, 12)}...`);
                    if (remaining.size === 0) break;
                }

                const now = performance.now();
                if (processed % 250 === 0 || now - lastUpdate > 500) {
                    updateProgress(processed, start);
                    lastUpdate = now;
                }
            }
        } catch (e: any) {
            const msg = e?.message || 'Unexpected error during analysis.';
            setError(msg);
            addLog(`Error: ${msg}`);
            setResults(prev => prev.map(r => r.status === 'Running' ? { ...r, status: 'Error', elapsedMs: performance.now() - start } : r));
        }

        const stopped = stopRef.current;
        updateProgress(processed, start);

        setResults(prev => prev.map(r => {
            if (r.status === 'Found' || r.status === 'Error') return r;
            return {
                ...r,
                status: stopped ? 'Stopped' : 'Not found',
                checked: processed,
                elapsedMs: performance.now() - start,
            };
        }));

        const foundCount = normalizedTargets.length - remaining.size;
        addLog(stopped
            ? `Analysis stopped by user (${foundCount}/${normalizedTargets.length} found).`
            : `Analysis finished (${foundCount}/${normalizedTargets.length} found).`);

        setRunning(false);
    }

    function stopAnalysis() {
        if (!running) return;
        stopRef.current = true;
        addLog('Stop requested by user.');
    }

    function exportCsv() {
        if (!results.length) return;
        const header = 'hash,status,password,checked,elapsed_ms\n';
        const rows = results.map(r => [
            csvEscape(r.hash),
            r.status,
            csvEscape(r.password || ''),
            r.checked,
            Math.round(r.elapsedMs)
        ].join(','));
        const csv = header + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hash_analysis.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                        <h4 className="text-xl font-semibold text-white">Hash Analyzer (Dictionary Attack)</h4>
                        {error && <span className="text-xs text-red-400">{error}</span>}
                    </div>
                    <p className="text-sm text-gray-400">
                        Provide one or more target hashes and a password list (txt). The tool will hash each candidate and report any matches.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <label className="flex flex-col gap-1 text-sm text-gray-300">
                        Algorithm
                        <select
                            className="bg-gray-800 p-2 rounded text-white"
                            value={algorithm}
                            onChange={e => setAlgorithm(e.target.value as HashAlgorithm)}
                        >
                            <option value="MD5">MD5</option>
                            <option value="SHA-1">SHA-1</option>
                            <option value="SHA-256">SHA-256</option>
                            <option value="SHA-512">SHA-512</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-300">
                        Hash encoding
                        <select
                            className="bg-gray-800 p-2 rounded text-white"
                            value={encoding}
                            onChange={e => setEncoding(e.target.value as HashEncoding)}
                        >
                            <option value="hex">Hex</option>
                            <option value="base64">Base64</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-300">
                        Mode
                        <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={multiple}
                                    onChange={e => setMultiple(e.target.checked)}
                                />
                                Multiple hashes (one per line)
                            </label>
                        </div>
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-300">
                        Threads (hint)
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={Math.max(1, navigator.hardwareConcurrency || 8)}
                                value={threads}
                                onChange={e => setThreads(Math.max(1, Number(e.target.value) || 1))}
                                className="w-20 bg-gray-800 p-2 rounded text-white"
                            />
                            <span className="text-xs text-gray-500">UI only (workload not parallelized yet)</span>
                        </div>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">Hash</label>
                        <textarea
                            className="w-full bg-gray-900 p-3 rounded border border-gray-800 text-gray-100 min-h-[120px]"
                            placeholder={multiple ? 'Paste one hash per line' : 'Enter hash to analyze'}
                            value={hashInput}
                            onChange={e => setHashInput(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">Password list file (txt)</label>
                        <div className="flex flex-wrap items-center gap-3 bg-gray-900 border border-gray-800 rounded p-3">
                            <input
                                type="file"
                                accept=".txt"
                                onChange={handleFileChange}
                                className="text-sm text-gray-200"
                            />
                            <span className="text-sm text-gray-400">
                                {passwordFile ? `${passwordFile.name} (${formatNumber(passwordFile.size)} bytes)` : 'No file selected'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">Large lists are streamed; start/stop controls remain responsive.</p>
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                    <button
                        className="px-4 py-2 bg-primary-500 rounded text-black font-semibold disabled:opacity-60"
                        onClick={startAnalysis}
                        disabled={!canStart}
                    >
                        Start Analysis
                    </button>
                    <button
                        className="px-4 py-2 bg-gray-800 rounded text-gray-200 disabled:opacity-50"
                        onClick={stopAnalysis}
                        disabled={!running}
                    >
                        Stop
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Progress</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded overflow-hidden">
                        <div
                            className="h-full bg-primary-500 transition-all duration-200"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-300">
                        <span>Checked: {formatNumber(checkedTotal)}{totalCandidates ? ` / ${formatNumber(totalCandidates)}` : ''}</span>
                        <span>Speed: {formatNumber(Math.floor(speed))} candidates/sec</span>
                        <span>Elapsed: {formatTime(elapsedMs)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h5 className="text-lg font-semibold text-white">Results</h5>
                    <button
                        className="px-3 py-2 bg-gray-800 rounded text-gray-200 text-sm disabled:opacity-50"
                        onClick={exportCsv}
                        disabled={!results.length}
                    >
                        Export CSV
                    </button>
                </div>
                <div className="overflow-auto border border-gray-800 rounded">
                    <table className="min-w-full text-sm text-gray-200">
                        <thead className="bg-gray-800 text-gray-300">
                            <tr>
                                <th className="px-3 py-2 text-left">Hash</th>
                                <th className="px-3 py-2 text-left">Status</th>
                                <th className="px-3 py-2 text-left">Password</th>
                                <th className="px-3 py-2 text-left">Checked</th>
                                <th className="px-3 py-2 text-left">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.length === 0 && (
                                <tr>
                                    <td className="px-3 py-3 text-gray-500" colSpan={5}>No analysis yet.</td>
                                </tr>
                            )}
                            {results.map((r, idx) => (
                                <tr key={`${r.hash}-${idx}`} className="border-t border-gray-800">
                                    <td className="px-3 py-2 align-top break-all">{r.hash}</td>
                                    <td className="px-3 py-2 align-top">{r.status}</td>
                                    <td className="px-3 py-2 align-top break-all">{r.password || '-'}</td>
                                    <td className="px-3 py-2 align-top">{formatNumber(r.checked)}</td>
                                    <td className="px-3 py-2 align-top">{r.elapsedMs ? formatTime(r.elapsedMs) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                    <h5 className="text-lg font-semibold text-white">Log</h5>
                    <button
                        className="px-2 py-1 bg-gray-800 rounded text-gray-200 text-xs"
                        onClick={() => setLogs([])}
                        disabled={!logs.length}
                    >
                        Clear
                    </button>
                </div>
                <div className="bg-gray-950 border border-gray-800 rounded p-3 text-xs text-gray-200 max-h-56 overflow-auto">
                    {logs.length === 0 ? (
                        <p className="text-gray-500">No log entries yet.</p>
                    ) : (
                        <ul className="space-y-1">
                            {logs.map((l, i) => <li key={i}>{l}</li>)}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
