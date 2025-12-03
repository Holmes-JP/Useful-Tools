import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { VideoConfig } from '@/components/Tools/Settings/VideoSettings';

export const useVideoStudio = () => {
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string>("Initializing...");
    const [error, setError] = useState<string | null>(null);
    
    const [convertUrl, setConvertUrl] = useState<string | null>(null);
    const [thumbUrl, setThumbUrl] = useState<string | null>(null);
    const [gifUrl, setGifUrl] = useState<string | null>(null);

    const ffmpegRef = useRef(new FFmpeg());

    const load = useCallback(async () => {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded) { setLoaded(true); return; }

        setIsLoading(true);
        // マルチスレッド版 (SharedArrayBuffer対応環境用)
        const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd';
        
        ffmpeg.on('log', ({ message }) => {
            console.log(message);
            setLog(message);
        });

        try {
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
            });
            setLoaded(true);
            setLog("Ready (Multi-Threaded).");
        } catch (err: any) {
            console.error(err);
            // フォールバック: シングルスレッド版
            try {
                const fallbackURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
                await ffmpeg.load({
                    coreURL: await toBlobURL(`${fallbackURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${fallbackURL}/ffmpeg-core.wasm`, 'application/wasm'),
                });
                setLoaded(true);
                setLog("Ready (Single-Threaded).");
                setError(null);
            } catch (e: any) {
                setError("Critical Error: " + e.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // 動画変換
    const convertVideo = async (file: File, config: VideoConfig) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true); setConvertUrl(null); setError(null);

        try {
            await ffmpeg.writeFile('input', await fetchFile(file));
            const args = ['-i', 'input', '-threads', '0', '-map_metadata', '-1'];
            
            // 音声のみフォーマット判定
            const audioFormats = ['mp3', 'wav', 'm4a', 'ogg', 'flac'];
            const isAudioOnly = audioFormats.includes(config.format);

            if (!isAudioOnly) {
                if (config.codecVideo !== 'default') args.push('-c:v', config.codecVideo);
                if (config.bitrateVideo) args.push('-b:v', config.bitrateVideo);
                if (config.frameRate > 0) args.push('-r', config.frameRate.toString());
                
                if (config.resolution !== 'original') {
                    const scaleMap: Record<string, string> = { 
                        '4k': '3840:-2', '2k': '2560:-2', '1080p': '1920:-2', '720p': '1280:-2', '480p': '854:-2', '360p': '640:-2',
                        'portrait_hd': '1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
                        'square_hd': '1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2'
                    };
                    const scale = config.resolution === 'custom' 
                        ? `${config.customWidth}:${config.customHeight}` 
                        : scaleMap[config.resolution];
                    if(scale) args.push('-vf', `scale=${scale}`);
                }
                
                if (config.format !== 'gif' && config.codecVideo !== 'copy') {
                    args.push('-preset', 'ultrafast');
                }
            } else {
                args.push('-vn');
            }

            if (config.mute) args.push('-an');
            else {
                if (config.codecAudio !== 'default') args.push('-c:a', config.codecAudio);
                if (config.bitrateAudio) args.push('-b:a', config.bitrateAudio);
            }

            const outputFile = `output.${config.format}`;
            args.push(outputFile);

            setLog(`Exec: ffmpeg ${args.join(' ')}`);
            await ffmpeg.exec(args);
            
            const data = await ffmpeg.readFile(outputFile);
            const typeMap: Record<string, string> = { 
                mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', avi: 'video/x-msvideo', 
                mkv: 'video/x-matroska', flv: 'video/x-flv', wmv: 'video/x-ms-wmv', ts: 'video/mp2t',
                gif: 'image/gif', mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', ogg: 'audio/ogg', flac: 'audio/flac'
            };
            
            const url = URL.createObjectURL(new Blob([(data as any)], { type: typeMap[config.format] || 'application/octet-stream' }));
            setConvertUrl(url);
            setLog("Done!");
        } catch (err: any) {
            setError(err.message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // サムネイル
    const generateThumbnail = async (file: File, time: number) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true); setThumbUrl(null); setError(null);
        try {
            await ffmpeg.writeFile('input', await fetchFile(file));
            await ffmpeg.exec(['-ss', time.toString(), '-i', 'input', '-vframes', '1', 'thumb.jpg']);
            const data = await ffmpeg.readFile('thumb.jpg');
            setThumbUrl(URL.createObjectURL(new Blob([(data as any)], { type: 'image/jpeg' })));
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };

    // GIF
    const createGif = async (file: File, start: number, duration: number, fps: number, width: number) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true); setGifUrl(null); setError(null);
        try {
            await ffmpeg.writeFile('input', await fetchFile(file));
            await ffmpeg.exec([
                '-ss', start.toString(), '-t', duration.toString(), '-i', 'input',
                '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
                '-f', 'gif', 'output.gif'
            ]);
            const data = await ffmpeg.readFile('output.gif');
            setGifUrl(URL.createObjectURL(new Blob([(data as any)], { type: 'image/gif' })));
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };

    return { loaded, isLoading, log, error, convertUrl, thumbUrl, gifUrl, convertVideo, generateThumbnail, createGif };
};
