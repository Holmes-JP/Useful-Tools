import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type AudioOptions = {
    format: 'mp3' | 'wav' | 'aac' | 'm4a';
    bitrate: '128k' | '192k' | '256k' | '320k';
};

export const useAudioConverter = () => {
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [audioLog, setAudioLog] = useState<string>("Ready.");
    const [audioError, setAudioError] = useState<string | null>(null);
    const [audioOutputUrl, setAudioOutputUrl] = useState<string | null>(null);
    
    const ffmpegRef = useRef(new FFmpeg());

    // ロード処理（動画と共通化もできますが、独立性を保つため記述）
    const load = useCallback(async () => {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded) return;

        setIsAudioLoading(true);
        const baseURL = '/ffmpeg';

        try {
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
        } catch (err: any) {
            console.error(err);
            setAudioError("Failed to load audio engine.");
        } finally {
            setIsAudioLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // 変換実行
    const convertAudio = async (file: File, options: AudioOptions) => {
        const ffmpeg = ffmpegRef.current;
        setIsAudioLoading(true);
        setAudioError(null);
        setAudioOutputUrl(null);
        setAudioLog("Converting audio...");

        try {
            // ファイル書き込み
            await ffmpeg.writeFile('input', await fetchFile(file));
            
            // コマンド構築
            const outputFile = `output.${options.format}`;
            // -vn: 映像無効化, -ab: ビットレート
            const args = ['-i', 'input', '-vn', '-ab', options.bitrate, outputFile];

            await ffmpeg.exec(args);
            
            // 結果読み出し
            const data = await ffmpeg.readFile(outputFile);
            
            // MIMEタイプ設定
            const mimeMap = {
                mp3: 'audio/mpeg',
                wav: 'audio/wav',
                aac: 'audio/aac',
                m4a: 'audio/mp4'
            };
            
            // Blob生成 (anyキャストで型エラー回避)
            const url = URL.createObjectURL(new Blob([(data as any)], { type: mimeMap[options.format] }));
            setAudioOutputUrl(url);
            setAudioLog("Conversion complete!");

        } catch (err: any) {
            console.error(err);
            setAudioError("Audio conversion failed: " + err.message);
        } finally {
            setIsAudioLoading(false);
        }
    };

    return {
        isAudioLoading,
        audioLog,
        audioError,
        audioOutputUrl,
        convertAudio
    };
};