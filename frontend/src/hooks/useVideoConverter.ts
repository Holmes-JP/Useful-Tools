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
            
            // トリム処理（開始位置）
            if (config.trimStart && parseFloat(config.trimStart) > 0) {
                args.push('-ss', config.trimStart);
            }
            
            // トリム処理（終了位置）
            if (config.trimEnd && parseFloat(config.trimEnd) > 0) {
                args.push('-to', config.trimEnd);
            }
            
            // Audio専用フォーマットの場合
            if (['mp3', 'aac', 'wav', 'ogg'].includes(config.format)) {
                // ビデオストリームを除去
                args.push('-vn');
                
                // オーディオコーデック
                if (config.audioCodec !== 'copy') {
                    args.push('-c:a', config.audioCodec);
                } else {
                    args.push('-c:a', 'copy');
                }
                
                // オーディオビットレート
                if (config.audioCodec !== 'copy') {
                    args.push('-b:a', config.audioBitrate);
                }
                
                // サンプルレート
                if (config.audioSampleRate && config.audioSampleRate !== 'original') {
                    args.push('-ar', config.audioSampleRate);
                }
                
                // チャンネル設定
                if (config.audioChannels && config.audioChannels !== 'original') {
                    if (config.audioChannels === 'mono') {
                        args.push('-ac', '1');
                    } else if (config.audioChannels === 'stereo') {
                        args.push('-ac', '2');
                    } else if (config.audioChannels === '5.1') {
                        args.push('-ac', '6');
                    } else if (config.audioChannels === '7.1') {
                        args.push('-ac', '8');
                    }
                }
                
                // オーディオフィルター構築
                const audioFilters: string[] = [];
                
                // 音量調整
                if (config.audioVolume && parseFloat(config.audioVolume) !== 1.0) {
                    audioFilters.push(`volume=${config.audioVolume}`);
                }
                
                // 音量正規化
                if (config.audioNormalize) {
                    audioFilters.push('loudnorm');
                }
                
                // フェードイン
                if (config.audioFadeIn && parseFloat(config.audioFadeIn) > 0) {
                    audioFilters.push(`afade=t=in:d=${config.audioFadeIn}`);
                }
                
                // フェードアウト
                if (config.audioFadeOut && parseFloat(config.audioFadeOut) > 0) {
                    audioFilters.push(`afade=t=out:d=${config.audioFadeOut}`);
                }
                
                // フィルターチェーンを追加
                if (audioFilters.length > 0) {
                    args.push('-af', audioFilters.join(','));
                }
                
            } else if (config.format === 'gif') {
                // GIFフォーマットの場合
                // FPS設定
                const fps = config.gifFps || '10';
                args.push('-vf', `fps=${fps},scale=${config.gifWidth || '-1'}:-1:flags=lanczos`);
                
                // ループカウント設定
                const loop = config.gifLoop || '0';
                args.push('-loop', loop);
                
                // 透過設定
                if (config.gifTransparent) {
                    // パレット生成（透過対応）
                    args.push('-f', 'gif');
                }
                
            } else {
                // ビデオフォーマットの処理
                // ビデオコーデック
                if (config.videoCodec !== 'copy') {
                    args.push('-c:v', config.videoCodec);
                } else {
                    args.push('-c:v', 'copy');
                }
                
                // ビデオビットレート
                if (config.videoBitrate !== 'original' && config.videoCodec !== 'copy') {
                    args.push('-b:v', config.videoBitrate);
                }
                
                // フレームレート
                if (config.frameRate !== 'original') {
                    args.push('-r', config.frameRate);
                }
                
                // ピクセルフォーマット
                if (config.pixelFormat && config.pixelFormat !== 'original') {
                    args.push('-pix_fmt', config.pixelFormat);
                }
                
                // ビデオフィルター構築
                const videoFilters: string[] = [];
                
                // 解像度
                if (config.resolution !== 'original' && config.videoCodec !== 'copy') {
                    const scale = config.resolution.replace('p', '');
                    videoFilters.push(`scale=-2:${scale}`);
                }
                
                // アスペクト比
                if (config.aspectRatio && config.aspectRatio !== 'original') {
                    if (config.aspectRatio === '16:9') {
                        videoFilters.push('setdar=16/9');
                    } else if (config.aspectRatio === '9:16') {
                        videoFilters.push('setdar=9/16');
                    } else if (config.aspectRatio === '4:3') {
                        videoFilters.push('setdar=4/3');
                    } else if (config.aspectRatio === '3:2') {
                        videoFilters.push('setdar=3/2');
                    } else if (config.aspectRatio === '1:1') {
                        videoFilters.push('setdar=1/1');
                    } else if (config.aspectRatio === '21:9') {
                        videoFilters.push('setdar=21/9');
                    }
                }
                
                // 回転
                if (config.rotate && config.rotate !== '0') {
                    if (config.rotate === '90') {
                        videoFilters.push('transpose=1');
                    } else if (config.rotate === '180') {
                        videoFilters.push('transpose=2,transpose=2');
                    } else if (config.rotate === '270') {
                        videoFilters.push('transpose=2');
                    }
                }
                
                // 明るさ、コントラスト、彩度（eq フィルター）
                const brightness = config.brightness && parseFloat(config.brightness) !== 0 ? parseFloat(config.brightness) : 0;
                const contrast = config.contrast && parseFloat(config.contrast) !== 0 ? parseFloat(config.contrast) : 0;
                const saturation = config.saturation && parseFloat(config.saturation) !== 1 ? parseFloat(config.saturation) : 1;
                
                if (brightness !== 0 || contrast !== 0 || saturation !== 1) {
                    const eqParams: string[] = [];
                    if (brightness !== 0) eqParams.push(`brightness=${brightness}`);
                    if (contrast !== 0) eqParams.push(`contrast=${1 + contrast}`);
                    if (saturation !== 1) eqParams.push(`saturation=${saturation}`);
                    videoFilters.push(`eq=${eqParams.join(':')}`);
                }
                
                // デインターレース
                if (config.deinterlace) {
                    videoFilters.push('yadif');
                }
                
                // ビデオフィルターチェーンを追加
                if (videoFilters.length > 0) {
                    args.push('-vf', videoFilters.join(','));
                }
                
                // オーディオ処理
                if (config.mute) {
                    args.push('-an');
                } else {
                    // オーディオコーデック
                    if (config.audioCodec !== 'copy') {
                        args.push('-c:a', config.audioCodec);
                    } else {
                        args.push('-c:a', 'copy');
                    }
                    
                    // オーディオビットレート
                    if (config.audioCodec !== 'copy') {
                        args.push('-b:a', config.audioBitrate);
                    }
                    
                    // サンプルレート
                    if (config.audioSampleRate && config.audioSampleRate !== 'original') {
                        args.push('-ar', config.audioSampleRate);
                    }
                    
                    // チャンネル設定
                    if (config.audioChannels && config.audioChannels !== 'original') {
                        if (config.audioChannels === 'mono') {
                            args.push('-ac', '1');
                        } else if (config.audioChannels === 'stereo') {
                            args.push('-ac', '2');
                        } else if (config.audioChannels === '5.1') {
                            args.push('-ac', '6');
                        } else if (config.audioChannels === '7.1') {
                            args.push('-ac', '8');
                        }
                    }
                    
                    // オーディオフィルター構築
                    const audioFilters: string[] = [];
                    
                    // 音量調整
                    if (config.audioVolume && parseFloat(config.audioVolume) !== 1.0) {
                        audioFilters.push(`volume=${config.audioVolume}`);
                    }
                    
                    // 音量正規化
                    if (config.audioNormalize) {
                        audioFilters.push('loudnorm');
                    }
                    
                    // フェードイン
                    if (config.audioFadeIn && parseFloat(config.audioFadeIn) > 0) {
                        audioFilters.push(`afade=t=in:d=${config.audioFadeIn}`);
                    }
                    
                    // フェードアウト
                    if (config.audioFadeOut && parseFloat(config.audioFadeOut) > 0) {
                        audioFilters.push(`afade=t=out:d=${config.audioFadeOut}`);
                    }
                    
                    // フィルターチェーンを追加
                    if (audioFilters.length > 0) {
                        args.push('-af', audioFilters.join(','));
                    }
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
