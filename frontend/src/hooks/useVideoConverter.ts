import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// 設定オプションの型定義（VideoSettings.tsxと合わせる）
export type VideoOptions = {
    format: 'mp4' | 'webm' | 'gif';
    resolution: 'original' | '1080p' | '720p' | '480p';
    mute: boolean;
};

export const useVideoConverter = () => {
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string>("Ready to initialize...");
    const [error, setError] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    
    // FFmpegインスタンスの保持
    const ffmpegRef = useRef(new FFmpeg());

    // ロード処理 (ローカルファイル /ffmpeg を参照)
    const load = useCallback(async () => {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded) {
            setLoaded(true);
            return;
        }

        setIsLoading(true);
        const baseURL = '/ffmpeg';

        ffmpeg.on('log', ({ message }) => {
            console.log(message);
            // ログメッセージの表示を少し整形（任意）
            if (message.length > 100) {
                setLog(message.substring(0, 100) + "...");
            } else {
                setLog(message);
            }
        });

        try {
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setLoaded(true);
            setLog("FFmpeg engine loaded.");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load FFmpeg engine.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 初期化時にロード
    useEffect(() => {
        load();
    }, [load]);

    // 変換処理本体
    const convertVideo = async (file: File, options: VideoOptions) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true);
        setError(null);
        setOutputUrl(null);
        setLog("Start converting...");

        try {
            // 1. 仮想ファイルシステムに入力ファイルを書き込み
            await ffmpeg.writeFile('input', await fetchFile(file));
            
            // 2. FFmpegコマンドの構築
            const args = ['-i', 'input'];
            
            // 解像度変更 (-vf scale=...)
            if (options.resolution !== 'original') {
                const scaleMap = {
                    '1080p': '1920:-2', // -2はアスペクト比を維持して偶数に調整（FFmpeg推奨）
                    '720p': '1280:-2',
                    '480p': '854:-2'
                };
                args.push('-vf', `scale=${scaleMap[options.resolution]}`);
            }

            // 音声ミュート (-an)
            if (options.mute) {
                args.push('-an');
            }

            // フォーマットごとの最適化設定
            if (options.format === 'mp4') {
                // MP4: 速度優先プリセット
                args.push('-preset', 'ultrafast');
            } else if (options.format === 'webm') {
                // WebM: リアルタイム向けの高速設定 (VP9/VP8)
                // CPU負荷を下げるため品質より速度を優先
                args.push('-deadline', 'realtime', '-cpu-used', '4');
            } else if (options.format === 'gif') {
                // GIF: フレームレートを少し落として軽くする（例: 10fps）
                // ※解像度変更と併用する場合はフィルタを結合する必要がありますが
                // FFmpegは -vf を複数回指定すると上書きされるため、ここでは単純化のため
                // scale指定がない場合のみfps指定を入れるなどの分岐が必要ですが
                // シンプルにGIF変換のみ行います。
                args.push('-r', '10'); 
            }

            // 出力ファイル名
            const outputFile = `output.${options.format}`;
            args.push(outputFile);

            setLog(`Command: ffmpeg ${args.join(' ')}`);

            // 3. コマンド実行
            await ffmpeg.exec(args);
            
            // 4. 出力ファイルの読み込み
            const data = await ffmpeg.readFile(outputFile);
            
            // 5. Blob URL生成
            // MIMEタイプを拡張子に合わせて設定
            let mimeType = 'video/mp4';
            if (options.format === 'webm') mimeType = 'video/webm';
            if (options.format === 'gif') mimeType = 'image/gif';

            const url = URL.createObjectURL(new Blob([(data as any)], { type: mimeType }));
            
            setOutputUrl(url);
            setLog("Conversion complete!");

            // (オプション) 仮想ファイルのクリーンアップ
            // await ffmpeg.deleteFile('input');
            // await ffmpeg.deleteFile(outputFile);

        } catch (err: any) {
            console.error(err);
            setError("Conversion failed. " + (err.message || "Unknown error"));
        } finally {
            setIsLoading(false);
        }
    };

    return {
        loaded,
        isLoading,
        log,
        error,
        outputUrl,
        convertVideo
    };
};