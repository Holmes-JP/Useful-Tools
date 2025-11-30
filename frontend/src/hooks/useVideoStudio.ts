import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type VideoOptions = {
    format: 'mp4' | 'webm' | 'gif' | 'mp3';
    resolution: 'original' | '1080p' | '720p' | '480p';
    mute: boolean;
};

export const useVideoStudio = () => {
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string>("Ready.");
    const [error, setError] = useState<string | null>(null);
    
    const [convertUrl, setConvertUrl] = useState<string | null>(null);
    const [thumbUrl, setThumbUrl] = useState<string | null>(null);
    const [gifUrl, setGifUrl] = useState<string | null>(null);

    const ffmpegRef = useRef(new FFmpeg());

    const load = useCallback(async () => {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded) { setLoaded(true); return; }

        setIsLoading(true);
        const baseURL = '/ffmpeg'; // ローカルのpublic/ffmpegを参照
        
        ffmpeg.on('log', ({ message }) => {
            console.log(message);
            setLog(message);
        });

        try {
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setLoaded(true);
        } catch (err: any) {
            setError("Failed to load FFmpeg: " + err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // 動画変換
    const convertVideo = async (file: File, options: VideoOptions) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true); setConvertUrl(null); setError(null);

        try {
            await ffmpeg.writeFile('input', await fetchFile(file));
            const args = ['-i', 'input'];
            
            if (options.resolution !== 'original') {
                const scaleMap: Record<string, string> = { '1080p': '1920:-2', '720p': '1280:-2', '480p': '854:-2' };
                args.push('-vf', `scale=${scaleMap[options.resolution]}`);
            }
            if (options.mute) args.push('-an');
            if (options.format !== 'gif') args.push('-preset', 'ultrafast');

            const ext = options.format === 'mp3' ? 'mp3' : options.format;
            const outputFile = `output.${ext}`;
            args.push(outputFile);

            await ffmpeg.exec(args);
            const data = await ffmpeg.readFile(outputFile);
            
            const typeMap: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', gif: 'image/gif', mp3: 'audio/mpeg' };
            const url = URL.createObjectURL(new Blob([(data as any)], { type: typeMap[options.format] }));
            setConvertUrl(url);
        } catch (err: any) {
            setError("Conversion error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // サムネイル生成
    const generateThumbnail = async (file: File, time: number) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true); setThumbUrl(null); setError(null);

        try {
            await ffmpeg.writeFile('input', await fetchFile(file));
            await ffmpeg.exec(['-ss', time.toString(), '-i', 'input', '-vframes', '1', 'thumb.jpg']);
            
            const data = await ffmpeg.readFile('thumb.jpg');
            const url = URL.createObjectURL(new Blob([(data as any)], { type: 'image/jpeg' }));
            setThumbUrl(url);
        } catch (err: any) {
            setError("Thumbnail error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // GIF作成
    const createGif = async (file: File, start: number, duration: number, fps: number, width: number) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true); setGifUrl(null); setError(null);

        try {
            await ffmpeg.writeFile('input', await fetchFile(file));
            await ffmpeg.exec([
                '-ss', start.toString(),
                '-t', duration.toString(),
                '-i', 'input',
                '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`,
                '-f', 'gif',
                'output.gif'
            ]);
            
            const data = await ffmpeg.readFile('output.gif');
            const url = URL.createObjectURL(new Blob([(data as any)], { type: 'image/gif' }));
            setGifUrl(url);
        } catch (err: any) {
            setError("GIF error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { loaded, isLoading, log, error, convertUrl, thumbUrl, gifUrl, convertVideo, generateThumbnail, createGif };
};
