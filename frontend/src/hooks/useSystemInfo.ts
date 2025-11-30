import { useState, useEffect } from 'react';
import { UAParser } from 'ua-parser-js';

export type SystemData = {
    ip: string;
    provider: string;
    os: string;
    browser: string;
    device: string;
    cpuThreads: number | string;
    memory: string; // 文字列に変更
    gpu: string;
    screen: string;
    connection: string;
};

export const useSystemInfo = () => {
    const [systemData, setSystemData] = useState<SystemData | null>(null);
    const [speed, setSpeed] = useState<string>('--- Mbps');
    const [isTestingSpeed, setIsTestingSpeed] = useState(false);

    useEffect(() => {
        const fetchInfo = async () => {
            const parser = new UAParser();
            const uaResult = parser.getResult();

            // --- 1. OS & ブラウザの詳細取得 (Client Hints API) ---
            let osName = `${uaResult.os.name} ${uaResult.os.version || ''}`;
            let browserVer = `${uaResult.browser.name} ${uaResult.browser.version}`;

            // Chrome等は navigator.userAgentData が使える
            // @ts-ignore
            if (navigator.userAgentData) {
                try {
                    // @ts-ignore
                    const highEntropyValues = await navigator.userAgentData.getHighEntropyValues([
                        'platformVersion',
                        'uaFullVersion'
                    ]);

                    // Windows 11 判定ロジック
                    // WindowsのplatformVersionのメジャーバージョンが13以上ならWindows 11
                    if (uaResult.os.name === 'Windows') {
                        const majorVer = parseInt(highEntropyValues.platformVersion.split('.')[0]);
                        if (majorVer >= 13) {
                            osName = 'Windows 11';
                        }
                    }

                    // 正確なブラウザバージョン
                    if (highEntropyValues.uaFullVersion) {
                        browserVer = `${uaResult.browser.name} ${highEntropyValues.uaFullVersion}`;
                    }
                } catch (e) {
                    console.warn("Client Hints error:", e);
                }
            }

            // --- 2. GPU情報の取得 ---
            const getGpu = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (!gl) return 'Unknown GPU';
                    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
                    if (!debugInfo) return 'Unknown GPU';
                    return (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                } catch {
                    return 'Unknown GPU';
                }
            };

            // --- 3. IPアドレス取得 (フォールバック付き) ---
            let ipInfo = { ip: 'Checking...', org: '---' };
            try {
                // まず詳細な情報が取れる ipapi.co を試す
                const res = await fetch('https://ipapi.co/json/');
                if (!res.ok) throw new Error('Blocked');
                const data = await res.json();
                ipInfo = { ip: data.ip, org: `${data.city}, ${data.country_name} (${data.org})` };
            } catch {
                try {
                    // VPN等でブロックされた場合、制限の緩い ipify を試す
                    const res = await fetch('https://api.ipify.org?format=json');
                    const data = await res.json();
                    ipInfo = { ip: data.ip, org: 'VPN / Hidden Provider' };
                } catch {
                    ipInfo = { ip: 'Unknown / Blocked', org: '---' };
                }
            }

            // --- 4. メモリ表示の調整 ---
            // @ts-ignore
            const mem = navigator.deviceMemory;
            // 8GB以上はブラウザの仕様で区別がつかないため表記を変える
            const memoryDisplay = mem ? (mem >= 8 ? "8 GB+ (Browser Limit)" : `${mem} GB`) : "Unknown";

            // --- 5. ネットワークタイプ ---
            // @ts-ignore
            const connection = navigator.connection ? navigator.connection.effectiveType : 'unknown';

            setSystemData({
                ip: ipInfo.ip,
                provider: ipInfo.org,
                os: osName,
                browser: browserVer,
                device: uaResult.device.model ? `${uaResult.device.vendor} ${uaResult.device.model}` : 'PC / Mac',
                // core数ではなくスレッド数であることを明記
                cpuThreads: navigator.hardwareConcurrency || 'Unknown',
                memory: memoryDisplay,
                gpu: getGpu(),
                screen: `${window.screen.width} x ${window.screen.height}`,
                connection: connection.toUpperCase()
            });
        };

        fetchInfo();
    }, []);

    // --- 回線速度計測ロジック ---
    const runSpeedTest = async () => {
        setIsTestingSpeed(true);
        setSpeed('Testing...');
        
        const startTime = performance.now();
        // キャッシュを防ぐためタイムスタンプを付与して画像をDL
        const imgSize = 4.8 * 1024 * 1024; // 約5MBの画像 (Unsplashの高解像度画像)
        const testUrl = `https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=4000&q=80&t=${new Date().getTime()}`;

        try {
            const response = await fetch(testUrl);
            await response.blob();
            
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000; // 秒
            
            // 計算式: (データサイズ(bit) / かかった時間(秒)) = bps
            const bitsLoaded = imgSize * 8;
            const bps = bitsLoaded / duration;
            const mbps = (bps / 1024 / 1024).toFixed(2);
            
            setSpeed(`${mbps} Mbps`);
        } catch (e) {
            setSpeed('Error');
        } finally {
            setIsTestingSpeed(false);
        }
    };

    return { systemData, speed, isTestingSpeed, runSpeedTest };
};