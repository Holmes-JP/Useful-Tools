import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { VideoConfig } from '@/components/Tools/Settings/VideoSettings';

export const useVideoConverter = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]); // ログを配列に変更
    const [outputUrls, setOutputUrls] = useState<{name: string, url: string}[]>([]);
    
    const ffmpegRef = useRef(new FFmpeg());

    const addLog = (msg: string) => {
        setLog(prev => [...prev.slice(-19), msg]); // 最新20行
    };

    const load = useCallback(async () => {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded) return;

        ffmpeg.on('log', ({ message }) => addLog(message));

        try {
            await ffmpeg.load({
                coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
                wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
            });
            addLog("FFmpeg engine loaded.");
        } catch (err: any) {
            addLog("Error loading engine: " + err.message);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // 一括変換
    const convertVideos = async (files: File[], config: VideoConfig) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true);
        setLog([]);
        setOutputUrls([]);

        try {
            const results = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                addLog(`\n--- Processing ${i+1}/${files.length}: ${file.name} ---`);

                const inputFile = `input_${i}`;
                await ffmpeg.writeFile(inputFile, await fetchFile(file));

                const args = ['-i', inputFile];

                // コーデック
                if (config.codecVideo !== 'default') args.push('-c:v', config.codecVideo);
                if (config.codecAudio !== 'default') args.push('-c:a', config.codecAudio);

                // 解像度
                if (config.resolution !== 'original') {
                    const scale = config.resolution === 'custom' 
                        ? `${config.customWidth}:${config.customHeight}`
                        : config.resolution === '1080p' ? '1920:-2'
                        : config.resolution === '720p' ? '1280:-2'
                        : '854:-2'; // 480p
                    args.push('-vf', `scale=${scale}`);
                }
                
                // FPS
                if (config.frameRate > 0) args.push('-r', config.frameRate.toString());

                // 音声
                if (config.mute) args.push('-an');

                // メタデータ
                if (config.metadataTitle) args.push('-metadata', `title=${config.metadataTitle}`);
                if (config.metadataDate) args.push('-metadata', `creation_time=${config.metadataDate}`);

                // 出力設定
                const ext = config.format;
                const outputName = `converted_${i}.${ext}`;
                args.push(outputName);

                addLog(`Command: ${args.join(' ')}`);
                await ffmpeg.exec(args);

                // 結果取得
                const data = await ffmpeg.readFile(outputName);
                const blob = new Blob([(data as any)], { type: `video/${ext}` });
                const url = URL.createObjectURL(blob);
                
                results.push({ name: file.name.split('.')[0] + '.' + ext, url });
                
                // クリーンアップ
                await ffmpeg.deleteFile(inputFile);
                await ffmpeg.deleteFile(outputName);
            }

            setOutputUrls(results);
            addLog("\nAll conversions complete!");

        } catch (err: any) {
            addLog("Critical Error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, log, outputUrls, convertVideos, load };
};
