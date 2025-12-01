import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

export type HashAlgo = 'MD5' | 'SHA1' | 'SHA256' | 'SHA512' | 'RIPEMD160';
export type SaltMode = 'append' | 'prepend' | 'hmac';

export type HashResult = {
    algo: HashAlgo;
    value: string;
};

export const useHashGenerator = () => {
    const [text, setText] = useState('');
    const [salt, setSalt] = useState('');
    const [saltMode, setSaltMode] = useState<SaltMode>('append');
    const [results, setResults] = useState<HashResult[]>([]);

    useEffect(() => {
        generate();
    }, [text, salt, saltMode]);

    const generate = () => {
        if (!text) {
            setResults([]);
            return;
        }

        const algos: HashAlgo[] = ['MD5', 'SHA1', 'SHA256', 'SHA512', 'RIPEMD160'];
        
        const newResults = algos.map(algo => {
            let hashVal = '';
            
            try {
                if (salt && saltMode === 'hmac') {
                    // HMAC Calculation
                    switch (algo) {
                        case 'MD5': hashVal = CryptoJS.HmacMD5(text, salt).toString(); break;
                        case 'SHA1': hashVal = CryptoJS.HmacSHA1(text, salt).toString(); break;
                        case 'SHA256': hashVal = CryptoJS.HmacSHA256(text, salt).toString(); break;
                        case 'SHA512': hashVal = CryptoJS.HmacSHA512(text, salt).toString(); break;
                        case 'RIPEMD160': hashVal = "HMAC-RIPEMD160 not supported in standard crypto-js"; break;
                    }
                } else {
                    // Standard Hash (with salt concatenation)
                    let target = text;
                    if (salt) {
                        if (saltMode === 'prepend') target = salt + text;
                        else target = text + salt;
                    }

                    switch (algo) {
                        case 'MD5': hashVal = CryptoJS.MD5(target).toString(); break;
                        case 'SHA1': hashVal = CryptoJS.SHA1(target).toString(); break;
                        case 'SHA256': hashVal = CryptoJS.SHA256(target).toString(); break;
                        case 'SHA512': hashVal = CryptoJS.SHA512(target).toString(); break;
                        case 'RIPEMD160': hashVal = CryptoJS.RIPEMD160(target).toString(); break;
                    }
                }
            } catch (e) {
                hashVal = "Error";
            }

            return { algo, value: hashVal };
        });

        setResults(newResults);
    };

    return { text, setText, salt, setSalt, saltMode, setSaltMode, results };
};
