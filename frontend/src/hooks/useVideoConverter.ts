import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { VideoConfig } from '@/components/Tools/Settings/VideoSettings';

export const useVideoConverter = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [outputUrls, setOutputUrls] = useState<{name: string, url: string}[]>([]);
    const ffmpegRef = useRef(new FFmpeg());

    const addLog = (msg: string) => setLog(prev => [...prev.slice(-49), msg]);

    const load = useCallback(async () => {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded) return;
        ffmpeg.on('log', ({ message }) => addLog(message));
        try {
            await ffmpeg.load({
                coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
                wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
            });
            addLog("FFmpeg loaded.");
        } catch (err: any) { addLog("Load Error: " + err.message); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const convertVideos = async (files: File[], config: VideoConfig) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true); setLog([]); setOutputUrls([]);

        try {
            const results = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                addLog(`Converting ${file.name}...`);
                
                const inputName = `in_${i}`;
                await ffmpeg.writeFile(inputName, await fetchFile(file));
                const args = ['-i', inputName, '-threads', '0', '-map_metadata', '-1'];

                // Exclude mp3/wav from video processing
                if (config.format !== 'mp3' && config.format !== 'wav') {
                    if (config.codecVideo !== 'default') args.push('-c:v', config.codecVideo);
                    if (config.bitrateVideo) args.push('-b:v', config.bitrateVideo);
                    if (config.frameRate > 0) args.push('-r', config.frameRate.toString());
                    
                    if (config.resolution !== 'original') {
                        const scale = config.resolution === 'custom' 
                            ? `${config.customWidth}:${config.customHeight}` 
                            : config.resolution === '1080p' ? '1920:-2' 
                            : config.resolution === '720p' ? '1280:-2' 
                            : '854:-2';
                        args.push('-vf', `scale=${scale}`);
                    }
                    if (config.format !== 'gif') args.push('-preset', 'ultrafast');
                } else {
                    args.push('-vn');
                }

                if (config.mute) args.push('-an');
                else if (config.codecAudio !== 'default') args.push('-c:a', config.codecAudio);
                if (config.bitrateAudio) args.push('-b:a', config.bitrateAudio);

                const outName = `out_${i}.${config.format}`;
                args.push(outName);
                
                await ffmpeg.exec(args);
                const data = await ffmpeg.readFile(outName);
                const url = URL.createObjectURL(new Blob([(data as any)]));
                results.push({ name: `${file.name.split('.')[0]}.${config.format}`, url });
                
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outName);
            }
            setOutputUrls(results);
            addLog("All Done!");
        } catch (e: any) {
            addLog("Error: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, log, outputUrls, convertVideos, load };
};
