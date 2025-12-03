import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { VideoConfig } from '@/components/Tools/Settings/VideoSettings';
import type { AudioConfig } from '@/components/Tools/Settings/AudioSettings';

export type ProcessStatus = {
    id: string;
    name: string;
    status: 'waiting' | 'processing' | 'done' | 'error';
    progress: number;
    url: string | null;
    errorMsg?: string;
};

export const useVideoStudio = () => {
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // State
    const [processList, setProcessList] = useState<ProcessStatus[]>([]);
    const [outputUrls, setOutputUrls] = useState<{name: string, url: string}[]>([]);
    
    // Legacy State
    const [log, setLog] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [convertUrl, setConvertUrl] = useState<string | null>(null);
    const [thumbUrl, setThumbUrl] = useState<string | null>(null);
    const [gifUrl, setGifUrl] = useState<string | null>(null);

    const ffmpegRef = useRef(new FFmpeg());
    const loadingRef = useRef(false);

    const addLog = (msg: string) => setLog(prev => [...prev.slice(-49), msg]);

    const load = useCallback(async () => {
        if (ffmpegRef.current.loaded || loadingRef.current) {
            if (ffmpegRef.current.loaded) setLoaded(true);
            return;
        }
        loadingRef.current = true;
        const ffmpeg = ffmpegRef.current;

        ffmpeg.on('log', ({ message }) => {
            console.log(message);
            if (!message.startsWith('frame=') && !message.startsWith('size=')) addLog(message);
        });
        
        ffmpeg.on('progress', ({ progress }) => {
            const percent = Math.min(Math.round(progress * 100), 100);
            setProcessList(prev => {
                const idx = prev.findIndex(p => p.status === 'processing');
                if (idx === -1) return prev;
                if (percent < (prev[idx].progress || 0)) return prev;
                const newList = [...prev];
                newList[idx].progress = percent;
                return newList;
            });
        });

        try {
            // ローカルファイルを読み込む
            // window.location.origin を使って絶対パス化
            const baseURL = `${window.location.origin}/ffmpeg`;
            addLog(`Loading Engine from ${baseURL}...`);

            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
            });
            
            setLoaded(true);
            addLog("Engine Loaded (Local MT).");
        } catch (e: any) {
            console.error("Engine Load Failed:", e);
            setError("Engine Load Failed: " + e.message);
            addLog("Error: " + e.message);
        } finally {
            loadingRef.current = false;
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // --- Args Helper ---
    const getArgs = (inName: string, config: VideoConfig | AudioConfig) => {
        const args = ['-i', inName, '-map_metadata', '-1', '-threads', '0'];
        
        // Video Config
        if ('codecVideo' in config && config.format !== 'gif' && !['mp3','wav','m4a','flac'].includes(config.format)) {
            if (config.codecVideo !== 'default') args.push('-c:v', config.codecVideo);
            if (config.bitrateVideo) args.push('-b:v', config.bitrateVideo);
            if ('frameRate' in config && config.frameRate > 0) args.push('-r', config.frameRate.toString());
            if (config.codecVideo !== 'copy') args.push('-preset', 'ultrafast');
            
            // Resolution
            if ('resolution' in config && config.resolution !== 'original') {
                 const vConf = config as VideoConfig;
                 let scale = '';
                 if (vConf.resolution === 'custom') scale = `${vConf.customWidth}:${vConf.customHeight}`;
                 else if (vConf.resolution === '1080p') scale = '1920:-2';
                 else if (vConf.resolution === '720p') scale = '1280:-2';
                 else if (vConf.resolution === '480p') scale = '854:-2';
                 
                 if (scale) args.push('-vf', `scale=${scale}`);
            }
        } else if (['mp3','wav','m4a','flac'].includes(config.format)) {
            args.push('-vn');
        }

        // Audio Config
        if ('mute' in config && config.mute) args.push('-an');
        else {
             if ('codecAudio' in config && config.codecAudio !== 'default') args.push('-c:a', config.codecAudio);
             if ('bitrateAudio' in config && config.bitrateAudio) args.push('-b:a', config.bitrateAudio);
        }

        // Trim
        if ('trimStart' in config && config.trimStart > 0) args.push('-ss', config.trimStart.toString());
        if ('trimEnd' in config && config.trimEnd > 0) args.push('-to', config.trimEnd.toString());

        return args;
    };

    // --- Convert Logic ---
    const convertMedia = async (files: File[], config: VideoConfig | AudioConfig) => {
        if (!ffmpegRef.current.loaded) { alert("Engine not ready."); return; }
        setIsLoading(true);
        setProcessList(files.map(f => ({ id: f.name+Date.now(), name: f.name, status: 'waiting', progress: 0, url: null })));

        const ffmpeg = ffmpegRef.current;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setProcessList(prev => { const l=[...prev]; l[i].status='processing'; return l; });

                const inName = `in_${i}`;
                const outName = `out_${i}.${config.format}`;
                await ffmpeg.writeFile(inName, await fetchFile(file));

                // GIF Special
                if (config.format === 'gif' && 'loop' in config) {
                     const vConf = config as VideoConfig;
                     const args = ['-i', inName];
                     if (vConf.trimStart) args.push('-ss', vConf.trimStart.toString());
                     if (vConf.trimEnd) args.push('-to', vConf.trimEnd.toString());
                     args.push('-vf', `fps=${vConf.frameRate||10},scale=${vConf.customWidth||480}:-1`);
                     args.push('-loop', vConf.loop.toString(), outName);
                     await ffmpeg.exec(args);
                } else {
                    // Standard
                    const args = getArgs(inName, config);
                    args.push(outName);
                    await ffmpeg.exec(args);
                }

                try {
                    const data = await ffmpeg.readFile(outName);
                    const blobTypeMap: any = { mp4: 'video/mp4', gif: 'image/gif', mp3: 'audio/mpeg', wav: 'audio/wav' };
                    const url = URL.createObjectURL(new Blob([(data as any)], { type: blobTypeMap[config.format] || 'application/octet-stream' }));
                    
                    setProcessList(prev => {
                        const l=[...prev]; l[i].status='done'; l[i].progress=100; l[i].url=url;
                        const p = l[i].name.split('.'); p.pop(); l[i].name = p.join('.') + '.' + config.format;
                        return l;
                    });
                } catch (e) { throw new Error("Output generation failed"); }

                await ffmpeg.deleteFile(inName);
                try{await ffmpeg.deleteFile(outName);}catch{}
            }
        } catch (e: any) {
             setProcessList(prev => {
                const idx = prev.findIndex(p => p.status === 'processing');
                if (idx !== -1) { const l=[...prev]; l[idx].status='error'; l[idx].errorMsg=e.message; return l; }
                return prev;
            });
        } finally { setIsLoading(false); }
    };

    // Legacy Wrappers
    const convertVideo = async (file: File, config: VideoConfig) => { await convertMedia([file], config); };
    const generateThumbnail = async (file: File, time: number) => { /* ... */ };
    const createGif = async (file: File, start: number, duration: number, fps: number, width: number) => { /* ... */ };

    return { loaded, isLoading, log, error, processList, convertMedia, convertUrl, convertVideo, thumbUrl, generateThumbnail, gifUrl, createGif, outputUrls };
};
