import { useMemo, useState, type ChangeEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

type RsaAlgorithm = 'RSA-PSS' | 'RSA-OAEP';
type KeyFormat = 'PEM' | 'JWK';
type GeneratorView = 'uuid' | 'password' | 'hash' | 'keys' | 'crypto';
type HashAlgorithm = 'SHA-256' | 'SHA-1' | 'MD5' | 'SHA-384' | 'SHA-512';
type HashMode = 'text' | 'file';
type AesVariant = 'AES-128' | 'AES-192' | 'AES-256';
type AesMode = 'ECB' | 'CBC' | 'GCM';
type AesDirection = 'encrypt' | 'decrypt';
type Encoding = 'utf8' | 'hex' | 'base64';
type HmacAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export default function GeneratorsPanel({ view }: { view?: GeneratorView }) {
    const [cryptoTab, setCryptoTab] = useState<'aes' | 'hmac'>('aes');
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

    const [aesVariant, setAesVariant] = useState<AesVariant>('AES-256');
    const [aesMode, setAesMode] = useState<AesMode>('CBC');
    const [aesDirection, setAesDirection] = useState<AesDirection>('encrypt');
    const [aesKey, setAesKey] = useState('');
    const [aesKeyEnc, setAesKeyEnc] = useState<Encoding>('hex');
    const [aesIv, setAesIv] = useState('');
    const [aesIvEnc, setAesIvEnc] = useState<Encoding>('hex');
    const [aesNonce, setAesNonce] = useState('');
    const [aesNonceEnc, setAesNonceEnc] = useState<Encoding>('hex');
    const [aesAad, setAesAad] = useState('');
    const [aesAadEnc, setAesAadEnc] = useState<Encoding>('utf8');
    const [aesTag, setAesTag] = useState('');
    const [aesTagEnc, setAesTagEnc] = useState<Encoding>('hex');
    const [aesInput, setAesInput] = useState('');
    const [aesInputEnc, setAesInputEnc] = useState<Encoding>('utf8');
    const [aesOutput, setAesOutput] = useState('');
    const [aesOutputEnc, setAesOutputEnc] = useState<'hex' | 'base64' | 'utf8'>('base64');
    const [aesPadding, setAesPadding] = useState<'pkcs7' | 'none'>('pkcs7');
    const [aesError, setAesError] = useState<string | null>(null);

    const [hmacAlgo, setHmacAlgo] = useState<HmacAlgo>('SHA-256');
    const [hmacMode, setHmacMode] = useState<'generate' | 'verify'>('generate');
    const [hmacMessage, setHmacMessage] = useState('');
    const [hmacMsgEnc, setHmacMsgEnc] = useState<Encoding>('utf8');
    const [hmacKey, setHmacKey] = useState('');
    const [hmacKeyEnc, setHmacKeyEnc] = useState<Encoding>('utf8');
    const [hmacResultHex, setHmacResultHex] = useState('');
    const [hmacResultB64, setHmacResultB64] = useState('');
    const [hmacExpected, setHmacExpected] = useState('');
    const [hmacExpectedEnc, setHmacExpectedEnc] = useState<'hex' | 'base64'>('hex');
    const [hmacVerify, setHmacVerify] = useState<'idle' | 'ok' | 'ng'>('idle');
    const [hmacError, setHmacError] = useState<string | null>(null);

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

    function arrayBufferToHex(buffer: ArrayBuffer | ArrayBufferLike) {
        const bytes = new Uint8Array(buffer as ArrayBuffer);
        return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }

    function arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike) {
        const bytes = new Uint8Array(buffer as ArrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i += 0x8000) {
            binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + 0x8000)));
        }
        return btoa(binary);
    }

    function toPem(buffer: ArrayBuffer | ArrayBufferLike, label: string) {
        const base64 = arrayBufferToBase64(buffer);
        const wrapped = base64.match(/.{1,64}/g)?.join('\n') ?? base64;
        return `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----`;
    }

    function bufferToWordArray(buffer: ArrayBuffer) {
        return CryptoJS.lib.WordArray.create(new Uint8Array(buffer) as any);
    }

    function encodeBytes(bytes: Uint8Array, enc: Encoding | 'hex' | 'base64') {
        if (enc === 'hex') return arrayBufferToHex(bytes.buffer);
        if (enc === 'base64') return arrayBufferToBase64(bytes.buffer);
        return new TextDecoder().decode(bytes);
    }

    function decodeInput(str: string, enc: Encoding | 'hex' | 'base64'): Uint8Array | null {
        try {
            if (enc === 'utf8') {
                return new TextEncoder().encode(str);
            }
            if (enc === 'hex') {
                const cleaned = str.trim();
                if (!/^[0-9a-fA-F]*$/.test(cleaned) || cleaned.length % 2 !== 0) throw new Error('hex');
                const bytes = new Uint8Array(cleaned.length / 2);
                for (let i = 0; i < cleaned.length; i += 2) bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
                return bytes;
            }
            if (enc === 'base64') {
                const bin = atob(str.trim());
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                return bytes;
            }
            return null;
        } catch {
            return null;
        }
    }

    function randomBytes(length: number) {
        const arr = new Uint8Array(length);
        crypto.getRandomValues(arr);
        return arr;
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

    function handleRandomKey() {
        const bytes = aesVariant === 'AES-128' ? 16 : aesVariant === 'AES-192' ? 24 : 32;
        const key = randomBytes(bytes);
        setAesKey(encodeBytes(key, aesKeyEnc));
    }

    function handleRandomIv() {
        const iv = randomBytes(16);
        setAesIv(encodeBytes(iv, aesIvEnc));
    }

    function handleRandomNonce() {
        const nonce = randomBytes(12);
        setAesNonce(encodeBytes(nonce, aesNonceEnc));
    }

    function validateAesKey(): Uint8Array | null {
        const required = aesVariant === 'AES-128' ? 16 : aesVariant === 'AES-192' ? 24 : 32;
        const keyBytes = decodeInput(aesKey, aesKeyEnc);
        if (!keyBytes || keyBytes.length !== required) {
            setAesError(`AES-${required * 8} requires a ${required}-byte key (current: ${keyBytes ? keyBytes.length : 0} bytes).`);
            return null;
        }
        return keyBytes;
    }

    function getIvOrNonce(): Uint8Array | null {
        if (aesMode === 'ECB') return new Uint8Array();
        if (aesMode === 'CBC') {
            const ivBytes = decodeInput(aesIv, aesIvEnc);
            if (!ivBytes || ivBytes.length !== 16) {
                setAesError('CBC requires a 16-byte IV.');
                return null;
            }
            return ivBytes;
        }
        const nonceBytes = decodeInput(aesNonce, aesNonceEnc);
        if (!nonceBytes || nonceBytes.length < 8) {
            setAesError('GCM requires a nonce (12 bytes recommended).');
            return null;
        }
        return nonceBytes;
    }

    async function handleAes() {
        setAesError(null);
        setAesOutput('');
        if (aesMode !== 'GCM' && aesTag) {
            setAesTag('');
        }
        try {
            const keyBytes = validateAesKey();
            if (!keyBytes) return;
            const dataBytes = decodeInput(aesInput, aesInputEnc);
            if (!dataBytes) {
                setAesError('Input data is empty or could not be decoded. Check the encoding.');
                return;
            }

            if ((aesMode === 'ECB' || aesMode === 'CBC') && aesPadding === 'none' && dataBytes.length % 16 !== 0) {
                setAesError('No padding selected: data length must be a multiple of 16 bytes.');
                return;
            }
            if (aesDirection === 'decrypt' && (aesMode === 'ECB' || aesMode === 'CBC') && dataBytes.length % 16 !== 0) {
                setAesError('Ciphertext length must be a multiple of 16 bytes for ECB/CBC.');
                return;
            }

            const iv = getIvOrNonce();
            if (iv === null) return;

            if (aesMode === 'GCM') {
                const algo = { name: 'AES-GCM', iv, additionalData: aesAad ? decodeInput(aesAad, aesAadEnc) || undefined : undefined, tagLength: 128 } as AesGcmParams;
                const key = await crypto.subtle.importKey('raw', keyBytes as any, { name: 'AES-GCM', length: keyBytes.length * 8 }, false, [aesDirection === 'encrypt' ? 'encrypt' : 'decrypt']);

                if (aesDirection === 'encrypt') {
                    const cipherBuf = await crypto.subtle.encrypt(algo, key, dataBytes as any);
                    const outBytes = new Uint8Array(cipherBuf);
                    const tagBytes = new Uint8Array(outBytes.slice(outBytes.length - 16));
                    const ctBytes = new Uint8Array(outBytes.slice(0, outBytes.length - 16));
                    const encForCipher = aesOutputEnc === 'utf8' ? 'base64' : aesOutputEnc;
                    setAesOutput(encodeBytes(ctBytes, encForCipher));
                    setAesTag(encodeBytes(tagBytes, aesTagEnc));
                } else {
                    const tagBytes = decodeInput(aesTag, aesTagEnc);
                    if (!tagBytes) {
                        setAesError('Auth Tag is required for GCM decryption.');
                        return;
                    }
                    const combined = new Uint8Array(dataBytes.length + tagBytes.length);
                    combined.set(dataBytes, 0);
                    combined.set(tagBytes, dataBytes.length);
                    const plainBuf = await crypto.subtle.decrypt(algo, key, combined as any);
                    setAesOutput(encodeBytes(new Uint8Array(plainBuf), aesOutputEnc));
                }
                return;
            }

            const keyWord = aesKeyEnc === 'hex'
                ? CryptoJS.enc.Hex.parse(aesKey)
                : aesKeyEnc === 'base64'
                    ? CryptoJS.enc.Base64.parse(aesKey)
                    : CryptoJS.enc.Utf8.parse(aesKey);

            const dataWord = CryptoJS.lib.WordArray.create(dataBytes as any);
            const cfg: any = {
                mode: aesMode === 'ECB' ? CryptoJS.mode.ECB : CryptoJS.mode.CBC,
                padding: aesPadding === 'none' ? CryptoJS.pad.NoPadding : CryptoJS.pad.Pkcs7,
            };
            if (aesMode === 'CBC') {
                cfg.iv = aesIvEnc === 'hex' ? CryptoJS.enc.Hex.parse(aesIv) : aesIvEnc === 'base64' ? CryptoJS.enc.Base64.parse(aesIv) : CryptoJS.enc.Utf8.parse(aesIv);
            }

            if (aesDirection === 'encrypt') {
                const out = CryptoJS.AES.encrypt(dataWord, keyWord, cfg);
                const outBytes = out.ciphertext;
                const encForCipher = aesOutputEnc === 'utf8' ? 'base64' : aesOutputEnc;
                const output = encForCipher === 'hex' ? outBytes.toString(CryptoJS.enc.Hex) : outBytes.toString(CryptoJS.enc.Base64);
                setAesOutput(output);
            } else {
                const decrypted = CryptoJS.AES.decrypt({ ciphertext: dataWord } as any, keyWord, cfg);
                const output =
                    aesOutputEnc === 'hex'
                        ? decrypted.toString(CryptoJS.enc.Hex)
                        : aesOutputEnc === 'base64'
                            ? decrypted.toString(CryptoJS.enc.Base64)
                            : decrypted.toString(CryptoJS.enc.Utf8);
                setAesOutput(output);
            }
        } catch (e: any) {
            setAesError(e?.message || 'AES operation failed.');
        }
    }

    async function handleHmac() {
        setHmacError(null);
        setHmacVerify('idle');
        setHmacResultHex('');
        setHmacResultB64('');
        const msg = decodeInput(hmacMessage, hmacMsgEnc);
        const keyBytes = decodeInput(hmacKey, hmacKeyEnc);
        if (!msg || !keyBytes) {
            setHmacError('Message or Key could not be decoded. Check encoding.');
            return;
        }
        const algo = hmacAlgo as 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
        try {
            const key = await crypto.subtle.importKey('raw', keyBytes as any, { name: 'HMAC', hash: algo }, false, ['sign']);
            const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg as any));
            const hex = encodeBytes(sig, 'hex');
            const b64 = encodeBytes(sig, 'base64');
            setHmacResultHex(hex);
            setHmacResultB64(b64);
            if (hmacMode === 'verify') {
                const expected = decodeInput(hmacExpected, hmacExpectedEnc);
                if (!expected) {
                    setHmacError('Expected HMAC is missing or invalid for the chosen encoding.');
                    return;
                }
                const matches = expected.length === sig.length && expected.every((v, i) => v === sig[i]);
                setHmacVerify(matches ? 'ok' : 'ng');
            }
        } catch (e: any) {
            setHmacError(e?.message || 'HMAC calculation failed.');
        }
    }

    const showUUID = !view || view === 'uuid';
    const showPassword = !view || view === 'password';
    const showHash = !view || view === 'hash';
    const showKeys = !view || view === 'keys';
    const showCrypto = !view || view === 'crypto';

    const aesRequiredKeyBytes = aesVariant === 'AES-128' ? 16 : aesVariant === 'AES-192' ? 24 : 32;
    const aesDataLabel = aesDirection === 'encrypt' ? 'Plaintext' : 'Ciphertext';
    const aesOutputLabel = aesDirection === 'encrypt' ? 'Ciphertext' : 'Plaintext';
    const aesDataEncOptions: Encoding[] = aesDirection === 'encrypt' ? ['utf8', 'hex', 'base64'] : ['hex', 'base64'];
    const aesOutputEncOptions: Array<'utf8' | 'hex' | 'base64'> = aesDirection === 'encrypt' ? ['hex', 'base64'] : ['utf8', 'hex', 'base64'];
    const isCbc = aesMode === 'CBC';
    const isGcm = aesMode === 'GCM';

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

            {showCrypto && (
                <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h4 className="text-xl font-semibold text-white">AES / HMAC</h4>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Encrypt/decrypt AES and generate/verify HMAC locally.</p>
                            {cryptoTab === 'aes' && aesError && <p className="text-xs text-red-400">{aesError}</p>}
                            {cryptoTab === 'hmac' && hmacError && <p className="text-xs text-red-400">{hmacError}</p>}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            className={`px-3 py-2 rounded-lg text-sm font-semibold border ${cryptoTab === 'aes' ? 'bg-primary-500 text-black border-primary-500' : 'bg-gray-800 text-gray-200 border-gray-700 hover:border-primary-500/60'}`}
                            onClick={() => setCryptoTab('aes')}
                        >
                            AES
                        </button>
                        <button
                            className={`px-3 py-2 rounded-lg text-sm font-semibold border ${cryptoTab === 'hmac' ? 'bg-primary-500 text-black border-primary-500' : 'bg-gray-800 text-gray-200 border-gray-700 hover:border-primary-500/60'}`}
                            onClick={() => setCryptoTab('hmac')}
                        >
                            HMAC
                        </button>
                    </div>

                    {cryptoTab === 'aes' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <label className="flex flex-col gap-1 text-sm text-gray-300">
                                    AES Variant
                                    <select
                                        className="bg-gray-800 p-2 rounded text-white"
                                        value={aesVariant}
                                        onChange={e => {
                                            setAesVariant(e.target.value as AesVariant);
                                            setAesError(null);
                                        }}
                                    >
                                        <option value="AES-128">AES-128</option>
                                        <option value="AES-192">AES-192</option>
                                        <option value="AES-256">AES-256</option>
                                    </select>
                                    <span className="text-xs text-gray-400">Requires {aesRequiredKeyBytes} bytes</span>
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-gray-300">
                                    Mode
                                    <select
                                        className="bg-gray-800 p-2 rounded text-white"
                                        value={aesMode}
                                        onChange={e => {
                                            const mode = e.target.value as AesMode;
                                            setAesMode(mode);
                                            setAesError(null);
                                            setAesOutput('');
                                            setAesTag('');
                                        }}
                                    >
                                        <option value="ECB">ECB</option>
                                        <option value="CBC">CBC</option>
                                        <option value="GCM">GCM</option>
                                    </select>
                                </label>
                                <div className="flex flex-col gap-1 text-sm text-gray-300">
                                    Direction
                                    <div className="flex items-center gap-4 bg-gray-800 p-2 rounded">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="aes-direction"
                                                value="encrypt"
                                                checked={aesDirection === 'encrypt'}
                                                onChange={() => {
                                                    setAesDirection('encrypt');
                                                    setAesInput('');
                                                    setAesOutput('');
                                                    setAesError(null);
                                                }}
                                            />
                                            Encrypt
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="aes-direction"
                                                value="decrypt"
                                                checked={aesDirection === 'decrypt'}
                                                onChange={() => {
                                                    setAesDirection('decrypt');
                                                    setAesInput('');
                                                    setAesOutput('');
                                                    setAesError(null);
                                                }}
                                            />
                                            Decrypt
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-2 text-sm text-gray-300">
                                    <div className="flex items-center justify-between gap-2">
                                        <span>Key</span>
                                        <div className="flex items-center gap-2">
                                            <select
                                                className="bg-gray-800 p-2 rounded text-white text-xs"
                                                value={aesKeyEnc}
                                                onChange={e => setAesKeyEnc(e.target.value as Encoding)}
                                            >
                                                <option value="utf8">UTF-8</option>
                                                <option value="hex">Hex</option>
                                                <option value="base64">Base64</option>
                                            </select>
                                            <button
                                                className="px-2 py-1 bg-primary-500 text-black rounded text-xs font-semibold"
                                                onClick={handleRandomKey}
                                            >
                                                Random
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-gray-100"
                                        value={aesKey}
                                        onChange={e => setAesKey(e.target.value)}
                                        placeholder="Key value"
                                    />
                                    <span className="text-xs text-gray-400">Length: {aesRequiredKeyBytes} bytes ({aesRequiredKeyBytes * 8}-bit)</span>
                                </div>

                                {isCbc && (
                                    <div className="flex flex-col gap-2 text-sm text-gray-300">
                                        <div className="flex items-center justify-between gap-2">
                                            <span>IV (16 bytes)</span>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="bg-gray-800 p-2 rounded text-white text-xs"
                                                    value={aesIvEnc}
                                                    onChange={e => setAesIvEnc(e.target.value as Encoding)}
                                                >
                                                    <option value="hex">Hex</option>
                                                    <option value="base64">Base64</option>
                                                    <option value="utf8">UTF-8</option>
                                                </select>
                                                <button
                                                    className="px-2 py-1 bg-primary-500 text-black rounded text-xs font-semibold"
                                                    onClick={handleRandomIv}
                                                >
                                                    Random
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-gray-100"
                                            value={aesIv}
                                            onChange={e => setAesIv(e.target.value)}
                                            placeholder="Initialization Vector"
                                        />
                                    </div>
                                )}

                                {isGcm && (
                                    <div className="flex flex-col gap-2 text-sm text-gray-300">
                                        <div className="flex items-center justify-between gap-2">
                                            <span>Nonce (12 bytes)</span>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="bg-gray-800 p-2 rounded text-white text-xs"
                                                    value={aesNonceEnc}
                                                    onChange={e => setAesNonceEnc(e.target.value as Encoding)}
                                                >
                                                    <option value="hex">Hex</option>
                                                    <option value="base64">Base64</option>
                                                </select>
                                                <button
                                                    className="px-2 py-1 bg-primary-500 text-black rounded text-xs font-semibold"
                                                    onClick={handleRandomNonce}
                                                >
                                                    Random
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-gray-100"
                                            value={aesNonce}
                                            onChange={e => setAesNonce(e.target.value)}
                                            placeholder="Recommended 12 bytes"
                                        />
                                    </div>
                                )}

                                {(isCbc || aesMode === 'ECB') && (
                                    <label className="flex flex-col gap-1 text-sm text-gray-300">
                                        Padding (ECB/CBC)
                                        <select
                                            className="bg-gray-800 p-2 rounded text-white"
                                            value={aesPadding}
                                            onChange={e => setAesPadding(e.target.value as 'pkcs7' | 'none')}
                                        >
                                            <option value="pkcs7">PKCS#7</option>
                                            <option value="none">No Padding (16-byte aligned)</option>
                                        </select>
                                    </label>
                                )}
                            </div>

                            {isGcm && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-2 text-sm text-gray-300">
                                        <div className="flex items-center justify-between gap-2">
                                            <span>AAD (optional)</span>
                                            <select
                                                className="bg-gray-800 p-2 rounded text-white text-xs"
                                                value={aesAadEnc}
                                                onChange={e => setAesAadEnc(e.target.value as Encoding)}
                                            >
                                                <option value="utf8">UTF-8</option>
                                                <option value="hex">Hex</option>
                                                <option value="base64">Base64</option>
                                            </select>
                                        </div>
                                        <input
                                            className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-gray-100"
                                            value={aesAad}
                                            onChange={e => setAesAad(e.target.value)}
                                            placeholder="Additional authenticated data"
                                        />
                                    </div>

                                    {aesDirection === 'encrypt' ? (
                                        <div className="flex flex-col gap-2 text-sm text-gray-300">
                                            <div className="flex items-center justify-between">
                                                <span>Auth Tag</span>
                                                <button
                                                    className="px-2 py-1 bg-gray-800 rounded text-gray-200 text-xs"
                                                    disabled={!aesTag}
                                                    onClick={() => copyText(aesTag)}
                                                >
                                                    Copy Tag
                                                </button>
                                            </div>
                                            <input
                                                readOnly
                                                className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-gray-100"
                                                value={aesTag}
                                                placeholder="Generated tag"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 text-sm text-gray-300">
                                            <div className="flex items-center justify-between gap-2">
                                                <span>Auth Tag</span>
                                                <select
                                                    className="bg-gray-800 p-2 rounded text-white text-xs"
                                                    value={aesTagEnc}
                                                    onChange={e => setAesTagEnc(e.target.value as Encoding)}
                                                >
                                                    <option value="hex">Hex</option>
                                                    <option value="base64">Base64</option>
                                                </select>
                                            </div>
                                            <input
                                                className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-gray-100"
                                                value={aesTag}
                                                onChange={e => setAesTag(e.target.value)}
                                                placeholder="Required for GCM decrypt"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm text-gray-300">
                                        <span>{aesDataLabel}</span>
                                        <select
                                            className="bg-gray-800 p-2 rounded text-white text-xs"
                                            value={aesInputEnc}
                                            onChange={e => setAesInputEnc(e.target.value as Encoding)}
                                        >
                                            {aesDataEncOptions.map(opt => (
                                                <option key={opt} value={opt}>
                                                    {opt.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <textarea
                                        className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[140px]"
                                        value={aesInput}
                                        onChange={e => setAesInput(e.target.value)}
                                        placeholder={aesDirection === 'encrypt' ? 'Text to encrypt' : 'Ciphertext to decrypt'}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm text-gray-300">
                                        <span>{aesOutputLabel}</span>
                                        <div className="flex items-center gap-2">
                                            <select
                                                className="bg-gray-800 p-2 rounded text-white text-xs"
                                                value={aesOutputEnc}
                                                onChange={e => setAesOutputEnc(e.target.value as 'utf8' | 'hex' | 'base64')}
                                            >
                                                {aesOutputEncOptions.map(opt => (
                                                    <option key={opt} value={opt}>
                                                        {opt.toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                className="px-2 py-1 bg-gray-800 rounded text-gray-200 text-xs disabled:opacity-50"
                                                disabled={!aesOutput}
                                                onClick={() => copyText(aesOutput)}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        readOnly
                                        className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[140px]"
                                        value={aesOutput}
                                        placeholder="Result will appear here"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    className="px-4 py-2 bg-primary-500 rounded text-black font-semibold disabled:opacity-60"
                                    onClick={handleAes}
                                >
                                    {aesDirection === 'encrypt' ? 'Encrypt' : 'Decrypt'}
                                </button>
                                <button
                                    className="px-3 py-2 bg-gray-800 rounded text-gray-200"
                                    onClick={() => {
                                        setAesInput('');
                                        setAesOutput('');
                                        setAesError(null);
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <label className="flex flex-col gap-1 text-sm text-gray-300">
                                    Algorithm
                                    <select
                                        className="bg-gray-800 p-2 rounded text-white"
                                        value={hmacAlgo}
                                        onChange={e => setHmacAlgo(e.target.value as HmacAlgo)}
                                    >
                                        <option value="SHA-1">HMAC-SHA-1</option>
                                        <option value="SHA-256">HMAC-SHA-256</option>
                                        <option value="SHA-384">HMAC-SHA-384</option>
                                        <option value="SHA-512">HMAC-SHA-512</option>
                                    </select>
                                </label>
                                <div className="flex flex-col gap-1 text-sm text-gray-300">
                                    Mode
                                    <div className="flex items-center gap-4 bg-gray-800 p-2 rounded">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="hmac-mode"
                                                value="generate"
                                                checked={hmacMode === 'generate'}
                                                onChange={() => setHmacMode('generate')}
                                            />
                                            Generate
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="hmac-mode"
                                                value="verify"
                                                checked={hmacMode === 'verify'}
                                                onChange={() => setHmacMode('verify')}
                                            />
                                            Verify
                                        </label>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {hmacVerify === 'ok' && <span className="px-3 py-1 rounded-full bg-emerald-600/80 text-black font-semibold">OK: HMAC matches</span>}
                                    {hmacVerify === 'ng' && <span className="px-3 py-1 rounded-full bg-red-500/80 text-black font-semibold">NG: HMAC mismatch</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm text-gray-300">
                                        <span>Message</span>
                                        <select
                                            className="bg-gray-800 p-2 rounded text-white text-xs"
                                            value={hmacMsgEnc}
                                            onChange={e => setHmacMsgEnc(e.target.value as Encoding)}
                                        >
                                            <option value="utf8">UTF-8</option>
                                            <option value="hex">Hex</option>
                                            <option value="base64">Base64</option>
                                        </select>
                                    </div>
                                    <textarea
                                        className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[120px]"
                                        value={hmacMessage}
                                        onChange={e => setHmacMessage(e.target.value)}
                                        placeholder="Message to sign"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm text-gray-300">
                                        <span>Key</span>
                                        <div className="flex items-center gap-2">
                                            <select
                                                className="bg-gray-800 p-2 rounded text-white text-xs"
                                                value={hmacKeyEnc}
                                                onChange={e => setHmacKeyEnc(e.target.value as Encoding)}
                                            >
                                                <option value="utf8">UTF-8</option>
                                                <option value="hex">Hex</option>
                                                <option value="base64">Base64</option>
                                            </select>
                                            <button
                                                className="px-2 py-1 bg-primary-500 text-black rounded text-xs font-semibold"
                                                onClick={() => setHmacKey(encodeBytes(randomBytes(32), hmacKeyEnc))}
                                            >
                                                Random
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-gray-100"
                                        value={hmacKey}
                                        onChange={e => setHmacKey(e.target.value)}
                                        placeholder="Shared secret"
                                    />
                                </div>
                            </div>

                            {hmacMode === 'verify' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm text-gray-300">
                                            <span>Expected HMAC</span>
                                            <select
                                                className="bg-gray-800 p-2 rounded text-white text-xs"
                                                value={hmacExpectedEnc}
                                                onChange={e => setHmacExpectedEnc(e.target.value as 'hex' | 'base64')}
                                            >
                                                <option value="hex">Hex</option>
                                                <option value="base64">Base64</option>
                                            </select>
                                        </div>
                                        <input
                                            className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-gray-100"
                                            value={hmacExpected}
                                            onChange={e => setHmacExpected(e.target.value)}
                                            placeholder="Value to compare"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    className="px-4 py-2 bg-primary-500 rounded text-black font-semibold"
                                    onClick={handleHmac}
                                >
                                    {hmacMode === 'generate' ? 'Compute HMAC' : 'Verify HMAC'}
                                </button>
                                <button
                                    className="px-3 py-2 bg-gray-800 rounded text-gray-200"
                                    onClick={() => {
                                        setHmacMessage('');
                                        setHmacKey('');
                                        setHmacExpected('');
                                        setHmacResultHex('');
                                        setHmacResultB64('');
                                        setHmacVerify('idle');
                                        setHmacError(null);
                                    }}
                                >
                                    Clear
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-sm text-gray-300">
                                        <span>HMAC (Hex)</span>
                                        <button
                                            className="px-2 py-1 bg-gray-800 rounded text-gray-200 text-xs disabled:opacity-50"
                                            disabled={!hmacResultHex}
                                            onClick={() => copyText(hmacResultHex)}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <textarea
                                        readOnly
                                        className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[100px]"
                                        value={hmacResultHex}
                                        placeholder="Computed HMAC in hex"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-sm text-gray-300">
                                        <span>HMAC (Base64)</span>
                                        <button
                                            className="px-2 py-1 bg-gray-800 rounded text-gray-200 text-xs disabled:opacity-50"
                                            disabled={!hmacResultB64}
                                            onClick={() => copyText(hmacResultB64)}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <textarea
                                        readOnly
                                        className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[100px]"
                                        value={hmacResultB64}
                                        placeholder="Computed HMAC in base64"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
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
