import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { AudioConfig } from '@/components/Tools/Settings/AudioSettings';

export const useAudioConverter = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [outputUrls, setOutputUrls] = useState<{name: string, url: string}[]>([]);
    const ffmpegRef = useRef(new FFmpeg());

    const addLog = (msg: string) => setLog(prev => [...prev.slice(-19), msg]);

    const load = useCallback(async () => {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded) return;
        ffmpeg.on('log', ({ message }) => addLog(message));
        try {
            await ffmpeg.load({
                coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
                wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
            });
        } catch (err: any) { addLog("Engine error: " + err.message); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const convertAudios = async (files: File[], config: AudioConfig) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true); setLog([]); setOutputUrls([]);

        try {
            const results = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                addLog(`Processing: ${file.name}`);
                
                await ffmpeg.writeFile('in', await fetchFile(file));
                const args = ['-i', 'in'];
                
                args.push('-vn'); // 映像削除
                if (config.bitrate) args.push('-b:a', config.bitrate);
                if (config.sampleRate > 0) args.push('-ar', config.sampleRate.toString());
                if (config.channels !== 'original') args.push('-ac', config.channels);
                if (config.volume !== 1.0) args.push('-af', `volume=${config.volume}`);
                
                if (config.metadataTitle) args.push('-metadata', `title=${config.metadataTitle}`);
                if (config.metadataArtist) args.push('-metadata', `artist=${config.metadataArtist}`);
                if (config.metadataDate) args.push('-metadata', `date=${config.metadataDate}`);

                const outName = `out.${config.format}`;
                args.push(outName);
                
                await ffmpeg.exec(args);
                
                const data = await ffmpeg.readFile(outName);
                const url = URL.createObjectURL(new Blob([(data as any)]));
                results.push({ name: file.name.split('.')[0] + '.' + config.format, url });
                
                await ffmpeg.deleteFile('in');
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
