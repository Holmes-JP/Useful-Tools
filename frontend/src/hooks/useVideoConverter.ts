import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
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
            const baseURL = `${window.location.origin}/ffmpeg`;
            addLog(`Loading FFmpeg from ${baseURL}...`);
            await ffmpeg.load({
                coreURL: `${baseURL}/ffmpeg-core.js`,
                wasmURL: `${baseURL}/ffmpeg-core.wasm`,
                workerURL: `${baseURL}/ffmpeg-core.worker.js`,
            });
            addLog("FFmpeg loaded.");
        } catch (err: any) { 
            const msg = err?.message ?? String(err);
            addLog("Load Error: " + msg);
            throw err;
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const convertVideos = async (files: File[], config: VideoConfig) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true); setLog([]); setOutputUrls([]);

        // Ensure engine is loaded before any file operations
        try {
            if (!ffmpeg.loaded) {
                addLog('FFmpeg not loaded, loading engine...');
                await load();
                if (!ffmpeg.loaded) throw new Error('FFmpeg failed to load');
            }
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            addLog('Load Error: ' + msg);
            setIsLoading(false);
            throw new Error(msg);
        }

        try {
            const results: {name: string, url: string}[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                addLog(`Converting ${file.name}...`);
                
                const inputName = `in_${i}`;
                await ffmpeg.writeFile(inputName, await fetchFile(file));
                const args = ['-i', inputName, '-threads', '0', '-map_metadata', '-1'];

                // Exclude mp3/wav from video processing
                if (config.format !== 'mp3' && config.format !== 'wav') {
                    // video codec
                    if (config.videoCodec && config.videoCodec !== 'copy') args.push('-c:v', config.videoCodec);
                    // video bitrate
                    if (config.videoBitrate && config.videoBitrate !== 'original') args.push('-b:v', config.videoBitrate);
                    // frame rate (VideoConfig stores as string)
                    if (config.frameRate && config.frameRate !== 'original') args.push('-r', String(config.frameRate));

                    // resolution mapping
                    if (config.resolution && config.resolution !== 'original') {
                        const scale = config.resolution === '1080p' ? '1920:-2'
                            : config.resolution === '720p' ? '1280:-2'
                            : config.resolution === '480p' ? '854:-2'
                            : config.resolution === '360p' ? '640:-2'
                            : '128:-2';
                        args.push('-vf', `scale=${scale}`);
                    }
                    if (config.format !== 'gif') args.push('-preset', 'ultrafast');
                } else {
                    args.push('-vn');
                }

                if (config.mute) args.push('-an');
                else if (config.audioCodec && config.audioCodec !== 'copy') args.push('-c:a', config.audioCodec);
                if (config.audioBitrate) args.push('-b:a', config.audioBitrate);

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
            return results;
        } catch (e: any) {
            const msg = e?.message ?? String(e);
            addLog("Error: " + msg);
            // rethrow so callers can handle and display proper message
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, log, outputUrls, convertVideos, load };
};
