import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type AudioConfig = {
    format: 'mp3' | 'wav' | 'aac';
    volume: number; // 1.0 = 100%
    speed: number;  // 1.0 = Normal
    fadeIn: number; // seconds
    fadeOut: number; // seconds
};

export const useAudioLab = () => {
    const [loaded, setLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [log, setLog] = useState("Ready.");
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    
    const ffmpegRef = useRef(new FFmpeg());

    // FFmpegロード (共有化できるが、独立性のためここでも記述)
    const load = useCallback(async () => {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded) { setLoaded(true); return; }

        const baseURL = '/ffmpeg';
        try {
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setLoaded(true);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // 音声処理実行
    const processAudio = async (file: File, start: number, end: number, config: AudioConfig) => {
        const ffmpeg = ffmpegRef.current;
        setIsProcessing(true);
        setOutputUrl(null);
        setLog("Processing...");

        try {
            await ffmpeg.writeFile('input', await fetchFile(file));
            
            // フィルタチェーンの構築
            const filters: string[] = [];
            
            // 1. 音量
            if (config.volume !== 1.0) filters.push(`volume=${config.volume}`);
            
            // 2. 速度 (atempoフィルタ)
            if (config.speed !== 1.0) filters.push(`atempo=${config.speed}`);
            
            // 3. フェードイン/アウト
            // afade=t=in:ss=0:d=duration
            if (config.fadeIn > 0) filters.push(`afade=t=in:ss=0:d=${config.fadeIn}`);
            if (config.fadeOut > 0) {
                // フェードアウトは終了時間から逆算する必要があるが、今回は簡易的に「切り出し後の長さ」に対して適用
                const duration = end - start;
                const startTime = duration - config.fadeOut;
                if (startTime > 0) filters.push(`afade=t=out:st=${startTime}:d=${config.fadeOut}`);
            }

            const args = [
                '-ss', start.toString(),
                '-to', end.toString(),
                '-i', 'input'
            ];

            if (filters.length > 0) {
                args.push('-af', filters.join(','));
            }

            const outputFile = `output.${config.format}`;
            args.push(outputFile);

            await ffmpeg.exec(args);
            
            const data = await ffmpeg.readFile(outputFile);
            const typeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac' };
            const url = URL.createObjectURL(new Blob([(data as any)], { type: typeMap[config.format] }));
            
            setOutputUrl(url);
            setLog("Complete!");

        } catch (err: any) {
            setLog("Error: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return { loaded, isProcessing, log, outputUrl, processAudio };
};
