import { useState } from 'react';

export type HashResult = {
    name: string;
    desc: string;
};

export const useHashAnalyzer = () => {
    const [results, setResults] = useState<HashResult[]>([]);

    const analyzeHash = (input: string) => {
        const text = input.trim();
        const matched: HashResult[] = [];

        if (!text) {
            setResults([]);
            return;
        }

        // 一般的なハッシュ形式のパターン
        const patterns = [
            { name: 'MD5', regex: /^[a-f0-9]{32}$/i, desc: '128-bit message digest. Often used for checksums.' },
            { name: 'SHA-1', regex: /^[a-f0-9]{40}$/i, desc: '160-bit hash function. Deprecated for security.' },
            { name: 'SHA-256', regex: /^[a-f0-9]{64}$/i, desc: '256-bit SHA-2 signature. Standard security.' },
            { name: 'SHA-512', regex: /^[a-f0-9]{128}$/i, desc: '512-bit SHA-2 signature. High security.' },
            { name: 'Bcrypt', regex: /^\$2[ayb]\$.{56}$/, desc: 'Password hashing algorithm (Blowfish).' },
            { name: 'JWT (JSON Web Token)', regex: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, desc: 'URL-safe token format.' },
            { name: 'CRC32', regex: /^[a-f0-9]{8}$/i, desc: 'Cyclic Redundancy Check.' }
        ];

        patterns.forEach(p => {
            if (p.regex.test(text)) {
                matched.push({ name: p.name, desc: p.desc });
            }
        });

        setResults(matched);
    };

    return { analyzeHash, results };
};
