import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpegConfig } from '@/utils/ffmpegLoader';

export type AudioConfig = {
    format: 'mp3' | 'wav' | 'aac';
    volume: number;
    speed: number;
    fadeIn: number;
    fadeOut: number;
};

export const useAudioLab = () => {
    const [loaded, setLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [log, setLog] = useState("Ready.");
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    
    const ffmpegRef = useRef(new FFmpeg());
    const loadingRef = useRef(false);
    const logHandlerAttachedRef = useRef(false);

    const load = useCallback(async () => {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded || loadingRef.current) { if (ffmpeg.loaded) setLoaded(true); return; }
        loadingRef.current = true;

        if (!logHandlerAttachedRef.current) {
            ffmpeg.on('log', ({ message }) => { console.log(message); setLog(message); });
            logHandlerAttachedRef.current = true;
        }

        try {
            const config = getFFmpegConfig();
            await ffmpeg.load(config);
            setLoaded(true);
        } catch (err) { console.error(err); } finally { loadingRef.current = false; }
    }, []);

    useEffect(() => { load(); }, [load]);

    const processAudio = async (file: File, start: number, end: number, config: AudioConfig) => {
        const ffmpeg = ffmpegRef.current;
        setIsProcessing(true); setOutputUrl(null); setLog("Processing...");
        try {
            await ffmpeg.writeFile('input', await fetchFile(file));
            const filters: string[] = [];
            if (config.volume !== 1.0) filters.push(`volume=${config.volume}`);
            if (config.speed !== 1.0) filters.push(`atempo=${config.speed}`);
            if (config.fadeIn > 0) filters.push(`afade=t=in:ss=0:d=${config.fadeIn}`);
            if (config.fadeOut > 0) {
                const duration = end - start;
                const startTime = duration - config.fadeOut;
                if (startTime > 0) filters.push(`afade=t=out:st=${startTime}:d=${config.fadeOut}`);
            }
            const args = ['-ss', start.toString(), '-to', end.toString(), '-i', 'input'];
            if (filters.length > 0) args.push('-af', filters.join(','));
            const outputFile = `output.${config.format}`;
            args.push(outputFile);
            await ffmpeg.exec(args);
            const data = await ffmpeg.readFile(outputFile);
            const typeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac' };
            // 修正: as any
            const url = URL.createObjectURL(new Blob([(data as any)], { type: typeMap[config.format] }));
            setOutputUrl(url);
            setLog("Complete!");
        } catch (err: any) { setLog("Error: " + err.message); } finally { setIsProcessing(false); }
    };

    // 修正: outputUrlをクリアする関数を追加
    const resetOutput = () => setOutputUrl(null);

    return { loaded, isProcessing, log, outputUrl, processAudio, resetOutput };
};
