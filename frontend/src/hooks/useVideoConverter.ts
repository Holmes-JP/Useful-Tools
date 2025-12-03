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
        setLog("Loading video engine...");
        try {
            const baseURL = '/ffmpeg';
            const ffmpeg = ffmpegRef.current;
            
            // ログを有効化
            ffmpeg.on('log', ({ message }) => {
                console.log('FFmpeg:', message);
                setLog(prev => prev + '\n' + message);
            });
            
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setLoaded(true);
            setLog("Engine Loaded - Ready to process videos");
        } catch (err: any) {
            console.error("FFmpeg load error:", err);
            setError("Failed to load video engine: " + (err.message || "Unknown error"));
            setLog("Failed to load video engine");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const convertVideo = async (file: File, config: VideoConfig) => {
        console.log('convertVideo called', { loaded, file: file.name, config });
        
        if (!loaded) {
            const errorMsg = "Video engine is still loading. Please wait...";
            setError(errorMsg);
            setLog(errorMsg);
            return null;
        }
        
        setIsLoading(true);
        setError(null);
        setOutputUrl(null);
        setLog(`Processing ${file.name}...`);
        
        try {
            const ffmpeg = ffmpegRef.current;
            const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
            const outputName = `output.${config.format}`;

            console.log('Writing file to FFmpeg:', inputName);
            await ffmpeg.writeFile(inputName, await fetchFile(file));
            
            const args = ['-i', inputName];
            
            // オーディオ処理
            if (config.mute) {
                args.push('-an');
            }
            
            // 解像度処理
            if (config.resolution !== 'original') {
                const scale = config.resolution.replace('p', '');
                args.push('-vf', `scale=-2:${scale}`);
            }
            
            // MOV形式の場合、コーデックを明示的に指定
            if (config.format === 'mov') {
                args.push('-c:v', 'libx264');
                if (!config.mute) {
                    args.push('-c:a', 'aac');
                }
            }
            
            // 出力ファイル名
            args.push(outputName);

            console.log('Executing FFmpeg with args:', args);
            setLog(`Converting with: ${args.join(' ')}`);
            await ffmpeg.exec(args);
            
            console.log('Reading output file:', outputName);
            const data = await ffmpeg.readFile(outputName);
            console.log('Output file data type:', typeof data, 'length:', data?.length);
            
            // ファイルをクリーンアップ
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch (cleanupError) {
                console.warn('Cleanup error (non-critical):', cleanupError);
            }
            
            // Uint8Array を Blob に変換
            const mimeType = config.format === 'mov' ? 'video/quicktime' : `video/${config.format}`;
            const blob = new Blob([data as BlobPart], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            setOutputUrl(url);
            setLog("Conversion complete!");
            console.log('Conversion successful');
            return url;
        } catch(e: any) {
            console.error("Video conversion error:", e);
            setError(e.message || "Video conversion failed");
            setLog("Error: " + (e.message || "Unknown error"));
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { loaded, isLoading, log, error, outputUrl, convertVideo };
};
