import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import type { AudioConfig } from '@/components/Tools/Settings/AudioSettings';
import { getFFmpegConfig } from '@/utils/ffmpegLoader';

export const useAudioConverter = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [outputUrls, setOutputUrls] = useState<{name: string, url: string}[]>([]);
    const ffmpegRef = useRef(new FFmpeg());
    const loadingRef = useRef(false);
    const logHandlerAttachedRef = useRef(false);

    const addLog = (msg: string) => setLog(prev => [...prev.slice(-20), msg]);

    const load = useCallback(async () => {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded || loadingRef.current) return;
        loadingRef.current = true;

        if (!logHandlerAttachedRef.current) {
            ffmpeg.on('log', ({ message }) => addLog(message));
            logHandlerAttachedRef.current = true;
        }

        try {
            const config = getFFmpegConfig();
            await ffmpeg.load(config);
        } catch (err: any) { addLog("Error: " + err.message); }
        finally { loadingRef.current = false; }
    }, []);

    useEffect(() => { load(); }, [load]);

    const convertAudios = async (files: File[], config: AudioConfig) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true); setLog([]); setOutputUrls([]);

        try {
            const results = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                addLog(`Converting: ${file.name}`);
                
                const inName = `in_${i}`;
                await ffmpeg.writeFile(inName, await fetchFile(file));
                const args = ['-i', inName, '-vn', '-threads', '0'];
                
                // audio codec
                if (config.audioCodec && config.audioCodec !== 'copy') args.push('-c:a', config.audioCodec);
                // bitrate
                if (config.bitrate) args.push('-b:a', config.bitrate);
                // sample rate
                if (config.audioSampleRate && config.audioSampleRate !== 'original') args.push('-ar', config.audioSampleRate);
                // channels mapping
                if (config.audioChannels && config.audioChannels !== 'original') {
                    const ch = config.audioChannels === 'stereo' ? '2'
                        : config.audioChannels === 'mono' ? '1'
                        : config.audioChannels === '5.1' ? '6'
                        : config.audioChannels === '7.1' ? '8'
                        : undefined;
                    if (ch) args.push('-ac', ch);
                }
                // volume (string stored in settings)
                const vol = parseFloat(config.audioVolume || '1.0');
                if (!Number.isNaN(vol) && vol !== 1.0) args.push('-af', `volume=${vol}`);

                const outName = `out_${i}.${config.format}`;
                args.push(outName);
                
                await ffmpeg.exec(args);
                const data = await ffmpeg.readFile(outName);
                const url = URL.createObjectURL(new Blob([(data as any)]));
                results.push({ name: `${file.name.split('.')[0]}.${config.format}`, url });
                
                await ffmpeg.deleteFile(inName);
                await ffmpeg.deleteFile(outName);
            }
            setOutputUrls(results);
            addLog("Done!");
        } catch (e: any) {
            addLog("Error: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, log, outputUrls, convertAudios };
};
