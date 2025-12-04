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
    const [outputUrls] = useState<{name: string, url: string}[]>([]);
    
    // Legacy State
    const [log, setLog] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [convertUrl] = useState<string | null>(null);
    const [thumbUrl] = useState<string | null>(null);
    const [gifUrl] = useState<string | null>(null);

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

        // Video Config (VideoConfig has videoCodec/videoBitrate/frameRate)
        if ('videoCodec' in config && config.format !== 'gif' && !['mp3','wav','m4a','flac'].includes(config.format)) {
            if (config.videoCodec && config.videoCodec !== 'copy') args.push('-c:v', config.videoCodec);
            if (config.videoBitrate && config.videoBitrate !== 'original') args.push('-b:v', config.videoBitrate);
            if ('frameRate' in config && config.frameRate && config.frameRate !== 'original') args.push('-r', String(config.frameRate));
            if (config.videoCodec !== 'copy') args.push('-preset', 'ultrafast');

            // Resolution mapping
            if ('resolution' in config && config.resolution && config.resolution !== 'original') {
                const v = config.resolution;
                const scale = v === '2160p' ? '3840:-2'
                    : v === '1440p' ? '2560:-2'
                    : v === '1080p' ? '1920:-2'
                    : v === '720p' ? '1280:-2'
                    : v === '480p' ? '854:-2'
                    : v === '360p' ? '640:-2'
                    : v === '240p' ? '426:-2'
                    : '';
                if (scale) args.push('-vf', `scale=${scale}`);
            }
        } else if (['mp3','wav','m4a','flac'].includes(config.format)) {
            args.push('-vn');
        }

        // Audio Config
        if ('mute' in config && config.mute) args.push('-an');
        else {
            if ('audioCodec' in config && config.audioCodec && config.audioCodec !== 'copy') args.push('-c:a', config.audioCodec);
            // audio bitrate may be named either audioBitrate (VideoConfig) or bitrate (AudioConfig)
            if ('audioBitrate' in config && config.audioBitrate) args.push('-b:a', config.audioBitrate as string);
            else if ('bitrate' in config && (config as any).bitrate) args.push('-b:a', (config as any).bitrate);
        }

        // Trim (stored as strings in settings)
        if ('trimStart' in config && config.trimStart) {
            const s = parseFloat(String(config.trimStart));
            if (!Number.isNaN(s) && s > 0) args.push('-ss', String(s));
        }
        if ('trimEnd' in config && config.trimEnd) {
            const t = parseFloat(String(config.trimEnd));
            if (!Number.isNaN(t) && t > 0) args.push('-to', String(t));
        }

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
                 if (config.format === 'gif') {
                     const vConf = config as VideoConfig;
                     const args = ['-i', inName];
                     if (vConf.trimStart) args.push('-ss', String(vConf.trimStart));
                     if (vConf.trimEnd) args.push('-to', String(vConf.trimEnd));
                     const fps = vConf.gifFps || '10';
                     const width = vConf.gifWidth || '480';
                     args.push('-vf', `fps=${fps},scale=${width}:-1`);
                     const loop = parseInt(vConf.gifLoop || '0', 10);
                     args.push('-loop', String(loop), outName);
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
    const generateThumbnail = async (file: File, time: number) => { void file; void time; /* stub */ };
    const createGif = async (file: File, start: number, duration: number, fps: number, width: number) => { void file; void start; void duration; void fps; void width; /* stub */ };

    return { loaded, isLoading, log, error, processList, convertMedia, convertUrl, convertVideo, thumbUrl, generateThumbnail, gifUrl, createGif, outputUrls };
};
