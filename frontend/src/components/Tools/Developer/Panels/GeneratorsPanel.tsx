import { useMemo, useState, type ChangeEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

type RsaAlgorithm = 'RSA-PSS' | 'RSA-OAEP';
type KeyFormat = 'PEM' | 'JWK';
type GeneratorView = 'uuid' | 'password' | 'hash' | 'keys';
type HashAlgorithm = 'SHA-256' | 'SHA-1' | 'MD5' | 'SHA-384' | 'SHA-512';
type HashMode = 'text' | 'file';

export default function GeneratorsPanel({ view }: { view?: GeneratorView }) {
    const [uuidCount, setUuidCount] = useState(3);
    const [uuidResults, setUuidResults] = useState<string[]>([]);

    const [includeLower, setIncludeLower] = useState(true);
    const [includeUpper, setIncludeUpper] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [passwordLength, setPasswordLength] = useState(16);
    const [passwordCount, setPasswordCount] = useState(3);
    const [passwords, setPasswords] = useState<string[]>([]);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const [algorithm, setAlgorithm] = useState<RsaAlgorithm>('RSA-PSS');
    const [keySize, setKeySize] = useState<number>(2048);
    const [keyFormat, setKeyFormat] = useState<KeyFormat>('PEM');
    const [publicKey, setPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [keyError, setKeyError] = useState<string | null>(null);
    const [keyLoading, setKeyLoading] = useState(false);

    const [hashAlgorithm, setHashAlgorithm] = useState<HashAlgorithm>('SHA-256');
    const [hashMode, setHashMode] = useState<HashMode>('text');
    const [hashText, setHashText] = useState('');
    const [hashFile, setHashFile] = useState<File | null>(null);
    const [hashFileName, setHashFileName] = useState('');
    const [hashHex, setHashHex] = useState('');
    const [hashBase64, setHashBase64] = useState('');
    const [hashShowBase64, setHashShowBase64] = useState(false);
    const [hashUppercase, setHashUppercase] = useState(false);
    const [hashLoading, setHashLoading] = useState(false);
    const [hashError, setHashError] = useState<string | null>(null);

    const passwordPools = useMemo(() => ({
        lower: 'abcdefghijklmnopqrstuvwxyz',
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        numbers: '0123456789',
        symbols: '!@#$%^&*()-_=+[]{};:,.<>?'
    }), []);

    function clampCount(value: number, min: number, max: number) {
        if (!Number.isFinite(value)) return min;
        return Math.max(min, Math.min(max, Math.floor(value)));
    }

    function copyText(text: string) {
        if (!text) return;
        navigator.clipboard?.writeText(text);
    }

    function downloadText(filename: string, text: string) {
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleGenerateUUIDs() {
        const total = clampCount(uuidCount, 1, 50);
        const list = Array.from({ length: total }, () => uuidv4());
        setUuidResults(list);
    }

    function buildPasswordPool() {
        let pool = '';
        const parts: string[] = [];
        if (includeLower) parts.push(passwordPools.lower);
        if (includeUpper) parts.push(passwordPools.upper);
        if (includeNumbers) parts.push(passwordPools.numbers);
        if (includeSymbols) parts.push(passwordPools.symbols);
        pool = parts.join('');
        return { pool, parts };
    }

    function generatePasswords() {
        const { pool, parts } = buildPasswordPool();
        if (!pool) {
            setPasswordError('Select at least one character set');
            setPasswords([]);
            return;
        }
        setPasswordError(null);

        const len = clampCount(passwordLength, 4, 128);
        const total = clampCount(passwordCount, 1, 20);
        const generated: string[] = [];

        for (let c = 0; c < total; c++) {
            const chars: string[] = [];

            // Ensure each selected group is represented at least once when possible.
            parts.slice(0, Math.min(parts.length, len)).forEach(group => {
                const idx = Math.floor(Math.random() * group.length);
                chars.push(group[idx]);
            });

            while (chars.length < len) {
                const idx = Math.floor(Math.random() * pool.length);
                chars.push(pool[idx]);
            }

            // Shuffle to avoid predictable placement of required characters.
            for (let i = chars.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [chars[i], chars[j]] = [chars[j], chars[i]];
            }

            generated.push(chars.join(''));
        }

        setPasswords(generated);
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

    function toPem(buffer: ArrayBuffer, label: string) {
        const base64 = arrayBufferToBase64(buffer);
        const wrapped = base64.match(/.{1,64}/g)?.join('\n') ?? base64;
        return `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----`;
    }

    function bufferToWordArray(buffer: ArrayBuffer) {
        return CryptoJS.lib.WordArray.create(new Uint8Array(buffer) as any);
    }

    async function computeHash(buffer: ArrayBuffer, algo: HashAlgorithm) {
        if (algo === 'MD5') {
            const wordArray = bufferToWordArray(buffer);
            const md5 = CryptoJS.MD5(wordArray);
            return {
                hex: md5.toString(CryptoJS.enc.Hex),
                base64: md5.toString(CryptoJS.enc.Base64),
            };
        }

        const subtle = window.crypto?.subtle;
        if (!subtle) {
            throw new Error('Web Crypto API is unavailable.');
        }

        const digest = await subtle.digest(algo, buffer);
        return {
            hex: arrayBufferToHex(digest),
            base64: arrayBufferToBase64(digest),
        };
    }

    async function handleGenerateHash() {
        setHashError(null);
        setHashHex('');
        setHashBase64('');
        setHashLoading(true);

        try {
            let buffer: ArrayBuffer | null = null;
            if (hashMode === 'text') {
                const encoder = new TextEncoder();
                buffer = encoder.encode(hashText).buffer;
            } else {
                if (!hashFile) throw new Error('Choose a file to hash.');
                buffer = await hashFile.arrayBuffer();
            }

            const { hex, base64 } = await computeHash(buffer, hashAlgorithm);
            setHashHex(hex);
            setHashBase64(base64);
        } catch (e: any) {
            setHashError(e?.message || 'Failed to generate hash');
        } finally {
            setHashLoading(false);
        }
    }

    function handleHashFileChange(e: ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        setHashFile(f || null);
        setHashFileName(f ? f.name : '');
    }

    async function generateKeyPair() {
        setKeyError(null);
        setKeyLoading(true);
        setPublicKey('');
        setPrivateKey('');

        try {
            const subtle = window.crypto?.subtle;
            if (!subtle) throw new Error('Web Crypto API is unavailable in this browser.');

            const keyUsages: KeyUsage[] = algorithm === 'RSA-OAEP' ? ['encrypt', 'decrypt'] : ['sign', 'verify'];
            const keyPair = await subtle.generateKey(
                {
                    name: algorithm,
                    modulusLength: keySize,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: 'SHA-256',
                },
                true,
                keyUsages
            );

            if (keyFormat === 'PEM') {
                const spki = await subtle.exportKey('spki', keyPair.publicKey);
                const pkcs8 = await subtle.exportKey('pkcs8', keyPair.privateKey);
                setPublicKey(toPem(spki, 'PUBLIC KEY'));
                setPrivateKey(toPem(pkcs8, 'PRIVATE KEY'));
            } else {
                const pubJwk = await subtle.exportKey('jwk', keyPair.publicKey);
                const privJwk = await subtle.exportKey('jwk', keyPair.privateKey);
                setPublicKey(JSON.stringify(pubJwk, null, 2));
                setPrivateKey(JSON.stringify(privJwk, null, 2));
            }
        } catch (e: any) {
            setKeyError(e?.message || 'Failed to generate key pair');
        } finally {
            setKeyLoading(false);
        }
    }

    const showUUID = !view || view === 'uuid';
    const showPassword = !view || view === 'password';
    const showHash = !view || view === 'hash';
    const showKeys = !view || view === 'keys';

    return (
        <div className="space-y-6">
            {showUUID && (
                <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xl font-semibold text-white">UUID / GUID</h4>
                        <p className="text-xs text-gray-400">Generate 1 - 50 at once</p>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                            Count
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={uuidCount}
                                onChange={e => setUuidCount(Number(e.target.value))}
                                className="w-20 bg-gray-800 p-2 rounded text-white"
                            />
                        </label>
                        <button
                            className="px-4 py-2 bg-primary-500 rounded text-black font-semibold"
                            onClick={handleGenerateUUIDs}
                        >
                            Generate UUID
                        </button>
                        <button
                            className="px-3 py-2 bg-gray-800 rounded text-gray-200"
                            disabled={!uuidResults.length}
                            onClick={() => copyText(uuidResults.join('\n'))}
                        >
                            Copy All
                        </button>
                    </div>
                    <textarea
                        readOnly
                        className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[140px]"
                        placeholder="Generated UUIDs will appear here"
                        value={uuidResults.join('\n')}
                    />
                </section>
            )}

            {showPassword && (
                <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <h4 className="text-xl font-semibold text-white">Strong Password</h4>
                        {passwordError && <span className="text-xs text-red-400">{passwordError}</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-wrap gap-3 items-center">
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input type="checkbox" checked={includeLower} onChange={e => setIncludeLower(e.target.checked)} />
                                Lowercase
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input type="checkbox" checked={includeUpper} onChange={e => setIncludeUpper(e.target.checked)} />
                                Uppercase
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input type="checkbox" checked={includeNumbers} onChange={e => setIncludeNumbers(e.target.checked)} />
                                Numbers
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input type="checkbox" checked={includeSymbols} onChange={e => setIncludeSymbols(e.target.checked)} />
                                Symbols
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-3 items-center">
                            <label className="flex items-center gap-2 text-sm text-gray-300 whitespace-nowrap">
                                Length
                                <span className="px-2 py-1 bg-gray-800 rounded text-white">{passwordLength} chars</span>
                            </label>
                            <input
                                type="range"
                                min={4}
                                max={128}
                                value={passwordLength}
                                onChange={e => setPasswordLength(Number(e.target.value))}
                                className="flex-1 accent-primary-500"
                            />
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                Count
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={passwordCount}
                                    onChange={e => setPasswordCount(Number(e.target.value))}
                                    className="w-20 bg-gray-800 p-2 rounded text-white"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button className="px-4 py-2 bg-primary-500 rounded text-black font-semibold" onClick={generatePasswords}>
                            Generate Passwords
                        </button>
                        <button
                            className="px-3 py-2 bg-gray-800 rounded text-gray-200"
                            disabled={!passwords.length}
                            onClick={() => copyText(passwords.join('\n'))}
                        >
                            Copy All
                        </button>
                    </div>

                    <textarea
                        readOnly
                        className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[160px]"
                        placeholder="Generated passwords will appear here"
                        value={passwords.join('\n')}
                    />
                </section>
            )}

            {showHash && (
                <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xl font-semibold text-white">Hash Generator</h4>
                        {hashError && <span className="text-xs text-red-400">{hashError}</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="flex flex-col gap-1 text-sm text-gray-300">
                            Algorithm
                            <select
                                className="bg-gray-800 p-2 rounded text-white"
                                value={hashAlgorithm}
                                onChange={e => setHashAlgorithm(e.target.value as HashAlgorithm)}
                            >
                                <option value="SHA-256">SHA-256</option>
                                <option value="SHA-1">SHA-1</option>
                                <option value="MD5">MD5</option>
                                <option value="SHA-384">SHA-384</option>
                                <option value="SHA-512">SHA-512</option>
                            </select>
                        </label>

                        <label className="flex flex-col gap-1 text-sm text-gray-300">
                            Mode
                            <div className="flex gap-3 bg-gray-800 p-2 rounded">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="hash-mode"
                                        value="text"
                                        checked={hashMode === 'text'}
                                        onChange={() => setHashMode('text')}
                                    />
                                    Text
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="hash-mode"
                                        value="file"
                                        checked={hashMode === 'file'}
                                        onChange={() => setHashMode('file')}
                                    />
                                    File
                                </label>
                            </div>
                        </label>

                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={hashUppercase}
                                    onChange={e => setHashUppercase(e.target.checked)}
                                />
                                Uppercase (hex)
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={hashShowBase64}
                                    onChange={e => setHashShowBase64(e.target.checked)}
                                />
                                Show as Base64
                            </label>
                        </div>
                    </div>

                    {hashMode === 'text' ? (
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">Input</label>
                            <textarea
                                className="w-full bg-gray-900 p-3 rounded border border-gray-800 text-gray-100"
                                rows={4}
                                value={hashText}
                                onChange={e => setHashText(e.target.value)}
                                placeholder="Type or paste text to hash"
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">File</label>
                            <div className="flex flex-wrap items-center gap-3 bg-gray-900 border border-gray-800 rounded p-3">
                                <input
                                    type="file"
                                    onChange={handleHashFileChange}
                                    className="text-sm text-gray-200"
                                />
                                <span className="text-sm text-gray-400">{hashFileName || 'No file selected'}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            className="px-4 py-2 bg-primary-500 rounded text-black font-semibold disabled:opacity-60"
                            onClick={handleGenerateHash}
                            disabled={hashLoading || (hashMode === 'file' && !hashFile)}
                        >
                            {hashLoading ? 'Generating…' : 'Generate Hash'}
                        </button>
                        <button
                            className="px-3 py-2 bg-gray-800 rounded text-gray-200 disabled:opacity-50"
                            disabled={!(hashShowBase64 ? hashBase64 : hashHex)}
                            onClick={() => {
                                const value = hashShowBase64 ? hashBase64 : hashUppercase ? hashHex.toUpperCase() : hashHex.toLowerCase();
                                copyText(value);
                            }}
                        >
                            Copy
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">Hash</label>
                        <input
                            readOnly
                            className="w-full bg-gray-950 p-3 rounded border border-gray-800 text-gray-100"
                            value={hashShowBase64 ? hashBase64 : (hashUppercase ? hashHex.toUpperCase() : hashHex.toLowerCase())}
                            placeholder="Hash will appear here"
                        />
                    </div>
                </section>
            )}

            {showKeys && (
                <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h4 className="text-xl font-semibold text-white">CryptoKey / RSA Key Pair</h4>
                        {keyError && <span className="text-xs text-red-400">{keyError}</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="flex flex-col gap-1 text-sm text-gray-300">
                            Algorithm
                            <select
                                className="bg-gray-800 p-2 rounded text-white"
                                value={algorithm}
                                onChange={e => setAlgorithm(e.target.value as RsaAlgorithm)}
                            >
                                <option value="RSA-PSS">RSA-PSS</option>
                                <option value="RSA-OAEP">RSA-OAEP</option>
                            </select>
                        </label>

                        <label className="flex flex-col gap-1 text-sm text-gray-300">
                            Key size
                            <select
                                className="bg-gray-800 p-2 rounded text-white"
                                value={keySize}
                                onChange={e => setKeySize(Number(e.target.value))}
                            >
                                <option value={2048}>2048</option>
                                <option value={3072}>3072</option>
                                <option value={4096}>4096</option>
                            </select>
                        </label>

                        <label className="flex flex-col gap-1 text-sm text-gray-300">
                            Format
                            <select
                                className="bg-gray-800 p-2 rounded text-white"
                                value={keyFormat}
                                onChange={e => setKeyFormat(e.target.value as KeyFormat)}
                            >
                                <option value="PEM">PEM</option>
                                <option value="JWK">JWK</option>
                            </select>
                        </label>
                    </div>

                    <button
                        className="px-4 py-2 bg-primary-500 rounded text-black font-semibold"
                        onClick={generateKeyPair}
                        disabled={keyLoading}
                    >
                        {keyLoading ? 'Generating…' : 'Generate Key Pair'}
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Public Key</span>
                                <div className="flex gap-2">
                                    <button
                                        className="px-2 py-1 bg-gray-800 rounded text-gray-200 text-xs"
                                        disabled={!publicKey}
                                        onClick={() => copyText(publicKey)}
                                    >
                                        Copy
                                    </button>
                                    <button
                                        className="px-2 py-1 bg-gray-800 rounded text-gray-200 text-xs"
                                        disabled={!publicKey}
                                        onClick={() =>
                                            downloadText(keyFormat === 'PEM' ? 'public_key.pem' : 'public_key.jwk', publicKey)
                                        }
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                            <textarea
                                readOnly
                                className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[200px]"
                                placeholder="-----BEGIN PUBLIC KEY-----"
                                value={publicKey}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Private Key</span>
                                <div className="flex gap-2">
                                    <button
                                        className="px-2 py-1 bg-gray-800 rounded text-gray-200 text-xs"
                                        disabled={!privateKey}
                                        onClick={() => copyText(privateKey)}
                                    >
                                        Copy
                                    </button>
                                    <button
                                        className="px-2 py-1 bg-gray-800 rounded text-gray-200 text-xs"
                                        disabled={!privateKey}
                                        onClick={() =>
                                            downloadText(keyFormat === 'PEM' ? 'private_key.pem' : 'private_key.jwk', privateKey)
                                        }
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                            <textarea
                                readOnly
                                className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[200px]"
                                placeholder="-----BEGIN PRIVATE KEY-----"
                                value={privateKey}
                            />
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
