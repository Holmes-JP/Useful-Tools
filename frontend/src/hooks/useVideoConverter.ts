import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { VideoConfig } from '../components/Tools/Settings/VideoSettings';

export const useVideoConverter = () => {
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string>("Ready");
    const [error, setError] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const ffmpegRef = useRef(new FFmpeg());

    const load = useCallback(async () => {
        if (ffmpegRef.current.loaded) {
            setLoaded(true);
            return;
        }
        setIsLoading(true);
        try {
            const baseURL = '/ffmpeg';
            await ffmpegRef.current.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setLoaded(true);
            setLog("Engine Loaded");
        } catch (err: any) {
            console.error(err);
            setError("Failed to load video engine.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const convertVideo = async (file: File, config: VideoConfig) => {
        setIsLoading(true);
        setError(null);
        setOutputUrl(null);
        setLog("Processing...");
        
        try {
            const ffmpeg = ffmpegRef.current;
            const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
            const outputName = `output.${config.format}`;

            await ffmpeg.writeFile(inputName, await fetchFile(file));
            
            const args = ['-i', inputName];
            if (config.mute) args.push('-an');
            if (config.resolution !== 'original') {
                const scale = config.resolution.replace('p', '');
                args.push('-vf', `scale=-2:${scale}`);
            }
            args.push(outputName);

            await ffmpeg.exec(args);
            
            const data = await ffmpeg.readFile(outputName);
            // Explicit cast to fix TS error
            const url = URL.createObjectURL(new Blob([(data as any)], { type: `video/${config.format}` }));
            setOutputUrl(url);
            setLog("Conversion complete!");
        } catch(e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { loaded, isLoading, log, error, outputUrl, convertVideo };
};
