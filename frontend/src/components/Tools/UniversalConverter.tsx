import { useState, useMemo, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import { X, Trash2, Download, Archive, Loader2 } from 'lucide-react';
import * as fflate from 'fflate';

import Head from '@/components/Head';
import VideoSettings, { VideoConfig } from './Settings/VideoSettings';
import ImageSettings, { ImageConfig } from './Settings/ImageSettings';
import AudioSettings, { AudioConfig } from './Settings/AudioSettings';
import type { DocConfig } from './Settings/DocumentSettings';

import { useVideoConverter } from '@/hooks/useVideoConverter';
import { useImageConverter } from '@/hooks/useImageConverter';
import { usePdfConverter } from '@/hooks/usePdfConverter';
import { useAudioConverter } from '@/hooks/useAudioConverter';

export default function UniversalConverter() {
    const { isLoading: isVideoLoading, log: videoLog, convertVideos } = useVideoConverter();
    const { isImageLoading, processList: imageProcessList, compressImages } = useImageConverter();
    const { isPdfLoading, pdfLog, pdfError, mergePdfs, pdfToText } = usePdfConverter();
    const { isLoading: isAudioLoading, log: audioLog } = useAudioConverter();

    const [files, setFiles] = useState<File[]>([]);
    
    // 変換結果を管理
    type ConversionResult = {
        fileName: string;
        url: string | null;
        isProcessing: boolean;
        error: string | null;
        duration?: string | null;
        outputFormat?: string; // 出力フォーマット
    };
    const [results, setResults] = useState<ConversionResult[]>([]);
    // 詳細ログ（タイムスタンプ付き）の配列
    const [detailedLogs, setDetailedLogs] = useState<string[]>([]);
    const logRef = useRef<HTMLDivElement | null>(null);
    // ファイルごとの開始時刻を保持（index をキーにする）
    const startTimesRef = useRef<Map<number, number>>(new Map());

    // Wrapper functions to adapt multi-file hooks to single-file usage
    const convertVideo = async (file: File, config: VideoConfig): Promise<string | null> => {
        const results = await convertVideos([file], config);
        return results && results.length > 0 ? results[0].url : null;
    };

    const [videoConfig, setVideoConfig] = useState<VideoConfig>({
        format: 'mp4',
        resolution: 'original',
        mute: false,
        videoCodec: 'libx264',
        trimStart: '0',
        trimEnd: '',
        frameRate: 'original',
        videoBitrate: 'original',
        aspectRatio: 'original',
        rotate: '0',
        brightness: '0',
        contrast: '0',
        saturation: '1',
        deinterlace: false,
        pixelFormat: 'original',
        audioCodec: 'aac',
        audioBitrate: '192k',
        audioVolume: '1.0',
        audioSampleRate: 'original',
        audioChannels: 'original',
        audioNormalize: false,
        audioFadeIn: '',
        audioFadeOut: '',
        gifWidth: '',
        gifLoop: '0',
        gifFps: '10',
        gifCompression: '1',
        gifTransparent: false
    });
    const [imageConfig, setImageConfig] = useState<ImageConfig>({
        format: 'original',
        quality: 0.8,
        maxWidth: 0,
        resolution: 'original',
        videoCodec: 'libx264',
        trimStart: '0',
        trimEnd: '',
        frameRate: 'original',
        videoBitrate: 'original',
        aspectRatio: 'original',
        rotate: '0',
        brightness: '0',
        contrast: '0',
        saturation: '1',
        deinterlace: false,
        pixelFormat: 'original',
        audioCodec: 'aac',
        audioBitrate: '192k',
        audioVolume: '1.0',
        audioSampleRate: 'original',
        audioChannels: 'original',
        audioNormalize: false,
        audioFadeIn: '',
        audioFadeOut: '',
        gifWidth: '',
        gifLoop: '0',
        gifFps: '10',
        gifCompression: '1',
        gifTransparent: false
    });
    const [audioConfig, setAudioConfig] = useState<AudioConfig>({
        format: 'mp3',
        bitrate: '192k',
        audioCodec: 'aac',
        audioVolume: '1.0',
        audioSampleRate: 'original',
        audioChannels: 'original',
        audioNormalize: false,
        audioFadeIn: '',
        audioFadeOut: '',
        trimStart: '0',
        trimEnd: '',
        resolution: 'original',
        videoCodec: 'libx264',
        frameRate: 'original',
        videoBitrate: 'original',
        aspectRatio: 'original',
        rotate: '0',
        brightness: '0',
        contrast: '0',
        saturation: '1',
        deinterlace: false,
        pixelFormat: 'original'
    });
    const [docConfig, setDocConfig] = useState<DocConfig>({
        format: 'pdf',
        outputFormat: 'pdf',
        mode: 'default',
        rotateAngle: 90,
        imageFormat: 'jpg',
        removePageRanges: '',
        removeMetadata: true,
        optimizeForWeb: false,
        flattenAnnotations: false,
        compressionLevel: 'medium'
    });

    // ファイルの種類を判定するヘルパー関数
    const detectFileType = (file: File): 'video' | 'image' | 'audio' | 'document' | 'unknown' => {
        const type = file.type || '';
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        const videoExt = ['mp4', 'mov', 'mkv', 'avi', 'webm', 'wmv', 'flv', 'm4v'];
        const imageExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg'];
        const audioExt = ['mp3', 'aac', 'm4a', 'wav', 'ogg', 'flac', 'wma', 'aiff'];
        const docExt = ['pdf', 'txt'];

        if (type.startsWith('video') || videoExt.includes(ext)) return 'video';
        if (type.startsWith('image') || imageExt.includes(ext)) return 'image';
        if (type.startsWith('audio') || audioExt.includes(ext)) return 'audio';
        if (type === 'application/pdf' || type === 'text/plain' || docExt.includes(ext)) return 'document';
        return 'unknown';
    };

    // 選択されたファイルから必要な設定パネルを判定
    const fileTypeStats = useMemo(() => {
        const stats = {
            hasVideo: false,
            hasImage: false,
            hasAudio: false,
            hasDocument: false,
            videoFiles: [] as File[],
            imageFiles: [] as File[],
            audioFiles: [] as File[],
            documentFiles: [] as File[]
        };

        files.forEach(file => {
            const type = detectFileType(file);
            if (type === 'video') {
                stats.hasVideo = true;
                stats.videoFiles.push(file);
            } else if (type === 'image') {
                stats.hasImage = true;
                stats.imageFiles.push(file);
            } else if (type === 'audio') {
                stats.hasAudio = true;
                stats.audioFiles.push(file);
            } else if (type === 'document') {
                stats.hasDocument = true;
                stats.documentFiles.push(file);
            }
        });

        return stats;
    }, [files]);

    const onDrop = (accepted: File[]) => {
        // 既存のファイルに新しいファイルを追加
        setFiles(prev => [...prev, ...accepted]);
    };
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const resetFiles = () => {
        if (window.confirm('すべてのファイルをクリアしますか？')) {
            setFiles([]);
            setResults([]);
        }
    };

    const handleAction = async () => {
        if (files.length === 0) return;
        const batchStart = Date.now();
        setDetailedLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] バッチ処理開始: ${files.length} 件`]);
        try {
        
        // ファイルごとに出力フォーマットと種類を決定
        const fileInfos = files.map(file => {
            const fileType = detectFileType(file);
            let outputFormat: string | undefined;
            
            if (fileType === 'video') {
                outputFormat = videoConfig.format;
            } else if (fileType === 'image') {
                outputFormat = imageConfig.format === 'original' ? file.name.split('.').pop() : imageConfig.format;
            } else if (fileType === 'audio') {
                outputFormat = audioConfig.format;
            } else if (fileType === 'document') {
                if (docConfig.mode === 'merge') {
                    outputFormat = 'pdf';
                } else {
                    outputFormat = docConfig.outputFormat || 'pdf';
                }
            }
            
            return { file, fileType, outputFormat };
        });
        
        // 結果の初期化
        setResults(fileInfos.map(info => ({
            fileName: info.file.name,
            url: null,
            isProcessing: true,
            error: null,
            outputFormat: info.outputFormat
        })));

        // ドキュメントのマージモード：全ドキュメントファイルを一括処理
        if (docConfig.mode === 'merge' && fileTypeStats.documentFiles.length > 0) {
            try {
                setDetailedLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] PDF を結合中 (${fileTypeStats.documentFiles.length} 件)...`]);
                const mergeStart = Date.now();
                const mergedUrl = await mergePdfs(fileTypeStats.documentFiles);
                const mergeElapsed = Date.now() - mergeStart;
                setDetailedLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] PDF 結合完了: ${mergedUrl} (所要時間: ${formatDuration(mergeElapsed)})`]);
                // マージ結果を最初のドキュメントファイルのインデックスに置き換え
                const firstDocIndex = fileInfos.findIndex(info => info.fileType === 'document');
                if (firstDocIndex >= 0) {
                    setResults(prev => prev.map((r, idx) => {
                        if (idx === firstDocIndex) {
                            return { fileName: `merged_${Date.now()}.pdf`, url: mergedUrl, isProcessing: false, error: null, outputFormat: 'pdf', duration: formatDuration(mergeElapsed) };
                        }
                        // 他のドキュメントファイルは除外（マージ済み）
                        if (fileInfos[idx].fileType === 'document' && idx !== firstDocIndex) {
                            return { ...r, isProcessing: false, url: null, error: null };
                        }
                        return r;
                    }));
                }
            } catch (error: any) {
                const msg = error?.message || String(error);
                setDetailedLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] PDF 結合エラー: ${msg}`]);
                setResults(prev => prev.map((r, idx) => 
                    fileInfos[idx].fileType === 'document' 
                        ? { ...r, error: msg, isProcessing: false }
                        : r
                ));
            }
            // マージ以外のファイルも処理する必要がある場合は続行
            const nonDocIndices = fileInfos
                .map((info, idx) => ({ info, idx }))
                .filter(({ info }) => info.fileType !== 'document')
                .map(({ idx }) => idx);
            
            if (nonDocIndices.length === 0) return;
            
            // 非ドキュメントファイルを処理
            for (const i of nonDocIndices) {
                await processFile(i, fileInfos[i]);
            }
        } else {
            // 各ファイルを順次変換
            for (let i = 0; i < fileInfos.length; i++) {
                await processFile(i, fileInfos[i]);
            }
        }
        } finally {
            const batchElapsed = Date.now() - batchStart;
            setDetailedLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] バッチ処理完了: ${files.length} 件 - 所要時間: ${formatDuration(batchElapsed)}`]);
        }
    };

    // 個別ファイルの変換処理
    const processFile = async (index: number, fileInfo: { file: File; fileType: string; outputFormat: string | undefined }) => {
        const { file, fileType } = fileInfo;
        try {
            // 開始時刻を記録
            startTimesRef.current.set(index, Date.now());
            setDetailedLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 処理開始: ${file.name} (${fileType}) -> ${fileInfo.outputFormat || 'unknown'}`]);
            let resultUrl: string | null | undefined = null;
            
            if (fileType === 'video') {
                resultUrl = await convertVideo(file, videoConfig);
            } else if (fileType === 'image') {
                // 画像の場合、ビデオ/GIF形式ならconvertVideoを使用
                const isVideoOrGif = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'gif'].includes(imageConfig.format);
                if (isVideoOrGif) {
                    // ImageConfigをVideoConfigに変換
                    const videoConfigFromImage = {
                        format: imageConfig.format as any,
                        resolution: imageConfig.resolution || 'original',
                        mute: false,
                        videoCodec: imageConfig.videoCodec || 'libx264',
                        trimStart: imageConfig.trimStart || '0',
                        trimEnd: imageConfig.trimEnd || '',
                        frameRate: imageConfig.frameRate || 'original',
                        videoBitrate: imageConfig.videoBitrate || 'original',
                        aspectRatio: imageConfig.aspectRatio || 'original',
                        rotate: imageConfig.rotate || '0',
                        brightness: imageConfig.brightness || '0',
                        contrast: imageConfig.contrast || '0',
                        saturation: imageConfig.saturation || '1',
                        deinterlace: imageConfig.deinterlace || false,
                        pixelFormat: imageConfig.pixelFormat || 'original',
                        audioCodec: imageConfig.audioCodec || 'aac',
                        audioBitrate: imageConfig.audioBitrate || '192k',
                        audioVolume: imageConfig.audioVolume || '1.0',
                        audioSampleRate: imageConfig.audioSampleRate || 'original',
                        audioChannels: imageConfig.audioChannels || 'original',
                        audioNormalize: imageConfig.audioNormalize || false,
                        audioFadeIn: imageConfig.audioFadeIn || '',
                        audioFadeOut: imageConfig.audioFadeOut || '',
                        gifWidth: imageConfig.gifWidth || '',
                        gifLoop: imageConfig.gifLoop || '0',
                        gifFps: imageConfig.gifFps || '10',
                        gifCompression: imageConfig.gifCompression || '1',
                        gifTransparent: imageConfig.gifTransparent || false
                    };
                    resultUrl = await convertVideo(file, videoConfigFromImage);
                } else {
                    const compressed = await compressImages([file], imageConfig);
                    resultUrl = compressed && compressed.length > 0 ? compressed[0].url : null;
                }
            } else if (fileType === 'audio') {
                // 音声の場合、ビデオ形式ならconvertVideoを使用
                const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v'].includes(audioConfig.format);
                if (isVideo) {
                    // AudioConfigをVideoConfigに変換
                    const videoConfigFromAudio = {
                        format: audioConfig.format as any,
                        resolution: audioConfig.resolution || 'original',
                        mute: false,
                        videoCodec: audioConfig.videoCodec || 'libx264',
                        trimStart: audioConfig.trimStart || '0',
                        trimEnd: audioConfig.trimEnd || '',
                        frameRate: audioConfig.frameRate || 'original',
                        videoBitrate: audioConfig.videoBitrate || 'original',
                        aspectRatio: audioConfig.aspectRatio || 'original',
                        rotate: audioConfig.rotate || '0',
                        brightness: audioConfig.brightness || '0',
                        contrast: audioConfig.contrast || '0',
                        saturation: audioConfig.saturation || '1',
                        deinterlace: audioConfig.deinterlace || false,
                        pixelFormat: audioConfig.pixelFormat || 'original',
                        audioCodec: audioConfig.audioCodec || 'aac',
                        audioBitrate: (audioConfig.bitrate || '192k') as any,
                        audioVolume: audioConfig.audioVolume || '1.0',
                        audioSampleRate: audioConfig.audioSampleRate || 'original',
                        audioChannels: audioConfig.audioChannels || 'original',
                        audioNormalize: audioConfig.audioNormalize || false,
                        audioFadeIn: audioConfig.audioFadeIn || '',
                        audioFadeOut: audioConfig.audioFadeOut || '',
                        gifWidth: '',
                        gifLoop: '0',
                        gifFps: '10',
                        gifCompression: '1' as const,
                        gifTransparent: false
                    };
                    resultUrl = await convertVideo(file, videoConfigFromAudio);
                } else {
                    // 音声形式の場合もconvertVideoを使用（既にAudio専用フォーマット対応済み）
                    const audioOnlyConfig = {
                        format: audioConfig.format as any,
                        resolution: 'original' as const,
                        mute: false,
                        videoCodec: 'libx264' as const,
                        trimStart: audioConfig.trimStart || '0',
                        trimEnd: audioConfig.trimEnd || '',
                        frameRate: 'original' as const,
                        videoBitrate: 'original' as const,
                        aspectRatio: 'original' as const,
                        rotate: '0' as const,
                        brightness: '0',
                        contrast: '0',
                        saturation: '1',
                        deinterlace: false,
                        pixelFormat: 'original' as const,
                        audioCodec: audioConfig.audioCodec || 'aac',
                        audioBitrate: (audioConfig.bitrate || '192k') as any,
                        audioVolume: audioConfig.audioVolume || '1.0',
                        audioSampleRate: audioConfig.audioSampleRate || 'original',
                        audioChannels: audioConfig.audioChannels || 'original',
                        audioNormalize: audioConfig.audioNormalize || false,
                        audioFadeIn: audioConfig.audioFadeIn || '',
                        audioFadeOut: audioConfig.audioFadeOut || '',
                        gifWidth: '',
                        gifLoop: '0',
                        gifFps: '10',
                        gifCompression: '1' as const,
                        gifTransparent: false
                    };
                    resultUrl = await convertVideo(file, audioOnlyConfig);
                }
            } else if (fileType === 'document') {
                // ファイルがPDFかテキストかを判定
                const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                
                if (docConfig.outputFormat === 'txt') {
                    // PDF→テキスト変換
                    if (isPdf) {
                        setDetailedLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] PDF→テキスト変換: ${file.name}`]);
                        resultUrl = await pdfToText(file);
                        setDetailedLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] PDF→テキスト完了: ${file.name}`]);
                    } else {
                        // テキストファイルはそのまま返す
                        resultUrl = URL.createObjectURL(file);
                    }
                } else {
                    // テキスト→PDFまたはPDF処理
                    setDetailedLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] PDF 処理: ${file.name}`]);
                    resultUrl = await mergePdfs([file]);
                    setDetailedLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] PDF 処理完了: ${file.name}`]);
                }
            }

            // 所要時間を計算して結果を更新
            const start = startTimesRef.current.get(index);
            const elapsed = start ? Date.now() - start : undefined;
            const durText = elapsed != null ? formatDuration(elapsed) : null;
            setResults(prev => prev.map((r, idx) => 
                idx === index ? { ...r, url: resultUrl || null, isProcessing: false, duration: durText } : r
            ));
            setDetailedLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 処理完了: ${file.name} -> ${resultUrl ? '出力あり' : '出力なし'} (所要時間: ${durText ?? '不明'})`]);
        } catch (error: any) {
            const msg = error?.message || String(error);
            // エラー時も所要時間を計算
            const start = startTimesRef.current.get(index);
            const elapsed = start ? Date.now() - start : undefined;
            const durText = elapsed != null ? formatDuration(elapsed) : null;
            setDetailedLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] エラー: ${file.name} -> ${msg} (所要時間: ${durText ?? '不明'})`]);
            setResults(prev => prev.map((r, idx) => 
                idx === index ? { ...r, error: msg, isProcessing: false, duration: durText } : r
            ));
        }
    };

    // 各ファイル処理状態 / フックログを先に計算しておく（useEffect の依存に使用するため）
    const isProcessing = isVideoLoading || isImageLoading || isPdfLoading || isAudioLoading;
    
    // Convert imageProcessList to log string
    const imageLog = imageProcessList.map(p => `${p.name}: ${p.status} (${p.progress}%)`).join('\n');
    
    // Convert array logs to string for display
    const videoLogString = Array.isArray(videoLog) ? videoLog.join('\n') : videoLog;
    const audioLogString = Array.isArray(audioLog) ? audioLog.join('\n') : audioLog;
    
    // 各ファイルタイプのログを結合
    const logText = [
        fileTypeStats.hasVideo ? videoLogString : '',
        fileTypeStats.hasImage ? imageLog : '',
        fileTypeStats.hasAudio ? audioLogString : '',
        fileTypeStats.hasDocument ? pdfLog : ''
    ].filter(Boolean).join('\n');

    const errorText = pdfError;

    // ログが増えたら自動でスクロールする
    useEffect(() => {
        const el = logRef.current;
        if (!el) return;
        // 最後までスクロール（smooth は大きなログでも追従しやすくする）
        try {
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        } catch {
            el.scrollTop = el.scrollHeight;
        }
    }, [detailedLogs.length, logText, isProcessing, results.length]);

    const downloadFile = (url: string, originalFileName: string, outputFormat?: string) => {
        // 元のファイル名から拡張子を除いて、新しい拡張子を付ける
        const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
        const extension = outputFormat || originalFileName.split('.').pop() || 'bin';
        const fileName = `${baseName}.${extension}`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
    };

    // ミリ秒を見やすい文字列に変換
    const formatDuration = (ms: number) => {
        if (ms == null) return '';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    // 表示用のファイル名を生成（変換後の拡張子を使用）
    const getDisplayFileName = (originalFileName: string, outputFormat?: string) => {
        if (!outputFormat) return originalFileName;
        const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
        return `${baseName}.${outputFormat}`;
    };

    const downloadAllAsZip = async () => {
        const completedResults = results.filter(r => r.url);
        if (completedResults.length === 0) return;

        const zipFiles: { [name: string]: Uint8Array } = {};
        
        for (const result of completedResults) {
            if (result.url) {
                const blob = await fetch(result.url).then(r => r.blob());
                const buffer = await blob.arrayBuffer();
                
                // 正しい拡張子でファイル名を生成
                const baseName = result.fileName.substring(0, result.fileName.lastIndexOf('.')) || result.fileName;
                const extension = result.outputFormat || result.fileName.split('.').pop() || 'bin';
                const fileName = `${baseName}.${extension}`;
                
                zipFiles[fileName] = new Uint8Array(buffer);
            }
        }

        fflate.zip(zipFiles, { level: 6 }, (err, data) => {
            if (err) {
                alert('ZIP作成エラー: ' + err);
                return;
            }
            const url = URL.createObjectURL(new Blob([data as BlobPart], { type: 'application/zip' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `converted_files_${Date.now()}.zip`;
            a.click();
        });
    };

    

    return (
        <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,#0ea5e9_0,transparent_26%),radial-gradient(circle_at_85%_10%,#22c55e_0,transparent_22%),radial-gradient(circle_at_55%_85%,#6366f1_0,transparent_24%)]" />
            <Head title="Universal Converter" description="Convert videos, compress images, merge PDFs, and convert audio files - all in your browser" />
            
            <div className="relative max-w-6xl mx-auto px-4 py-10 space-y-10">
                {/* ヘッダー */}
                <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="space-y-3">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Universal Converter</h1>
                        </div>
                    <div className="hidden sm:flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-800/70 bg-white/5 shadow-lg shadow-primary-500/10">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm text-slate-200">ドラッグ & ドロップ対応 / ブラウザ内完結</span>
                    </div>
                </div>

            <div className="space-y-8">
                {/* ファイルドロップゾーン */}
                <div className="bg-slate-900/70 backdrop-blur-sm rounded-3xl shadow-[0_28px_80px_-40px_rgba(0,0,0,0.9)] border border-slate-800/70 p-6">
                    <div {...getRootProps()} className={clsx(
                        "rounded-2xl border border-dashed p-10 sm:p-12 text-center cursor-pointer transition-all duration-300",
                        isDragActive 
                            ? "border-primary-400 bg-primary-400/10 shadow-[0_10px_40px_-25px_rgba(14,165,233,0.8)] scale-[1.01]"
                            : "border-slate-700 hover:border-primary-400 hover:bg-slate-800/60"
                    )}>
                        <input {...getInputProps()} />
                        {files.length > 0 ? (
                            <div className="space-y-3">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-500/15 border border-primary-500/30 mx-auto">
                                    <Archive size={26} className="text-primary-300" />
                                </div>
                                <p className="text-lg font-semibold text-white">{files.length} ファイル選択中</p>
                                <p className="text-sm text-slate-400">さらにドラッグ & ドロップ、またはクリックで追加</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyan-500/15 border border-slate-800/60 mx-auto">
                                    <Download size={40} className="text-primary-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xl font-semibold text-white">ファイルをドラッグ & ドロップ</p>
                                    <p className="text-slate-400 text-sm">またはクリックして選択。動画 / 画像 / 音声 / PDF に対応</p>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center mt-2 text-xs text-slate-300">
                                    <span className="px-3 py-1 rounded-full border border-slate-700/70 bg-slate-800/70">動画</span>
                                    <span className="px-3 py-1 rounded-full border border-slate-700/70 bg-slate-800/70">画像</span>
                                    <span className="px-3 py-1 rounded-full border border-slate-700/70 bg-slate-800/70">音声</span>
                                    <span className="px-3 py-1 rounded-full border border-slate-700/70 bg-slate-800/70">PDF / テキスト</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 選択ファイルリスト */}
                    {files.length > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
                                    選択ファイル ({files.length})
                                </h3>
                                <button
                                    onClick={resetFiles}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
                                >
                                    <Trash2 size={16} />
                                    すべてクリア
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                                {files.map((file, index) => {
                                    const fileType = detectFileType(file);
                                    const typeColors = {
                                        video: 'border-primary-400/60',
                                        image: 'border-cyan-400/60',
                                        audio: 'border-emerald-400/60',
                                        document: 'border-amber-400/60',
                                        unknown: 'border-slate-700/70'
                                    };
                                    return (
                                        <div 
                                            key={index}
                                            className={clsx(
                                                "group relative flex items-center justify-between rounded-xl p-4 transition-all duration-200 border bg-slate-900/80 hover:-translate-y-1 hover:border-primary-400/70 shadow-sm shadow-black/30",
                                                typeColors[fileType]
                                            )}
                                        >
                                            <div className="flex-1 min-w-0 pr-3">
                                                <p className="text-sm font-semibold text-white truncate mb-1">{file.name}</p>
                                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                    <span className="px-2 py-0.5 rounded border border-slate-700/70 bg-slate-800/80 text-slate-200">
                                                        {fileType === 'video' ? '動画' : 
                                                         fileType === 'image' ? '画像' : 
                                                         fileType === 'audio' ? '音声' : 
                                                         fileType === 'document' ? 'ドキュメント' : '不明'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFile(index)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                aria-label="Remove file"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* 設定パネル */}
                {files.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {fileTypeStats.hasVideo && (
                            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.85)] ring-1 ring-white/5">
                                <VideoSettings config={videoConfig} onChange={setVideoConfig} />
                            </div>
                        )}
                        {fileTypeStats.hasImage && (
                            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.85)] ring-1 ring-white/5">
                                <ImageSettings config={imageConfig} onChange={setImageConfig} />
                            </div>
                        )}
                        {fileTypeStats.hasAudio && (
                            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.85)] ring-1 ring-white/5">
                                <AudioSettings config={audioConfig} onChange={setAudioConfig} />
                            </div>
                        )}
                        {/* Document settings panel removed */}
                    </div>
                )}

                {/* 変換ボタン */}
                {files.length > 0 && (
                    <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-slate-800/80 p-6 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.85)]">
                        <button 
                            onClick={handleAction} 
                            disabled={isProcessing} 
                            className={clsx(
                                "w-full py-5 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg",
                                isProcessing 
                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-primary-300 via-cyan-300 to-emerald-300 text-slate-950 hover:shadow-[0_15px_55px_-25px_rgba(34,197,235,0.9)] hover:-translate-y-0.5 active:translate-y-0"
                            )}
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-3">
                                    <Loader2 size={24} className="animate-spin" />
                                    処理中...
                                </span>
                            ) : (
                                '変換開始'
                            )}
                        </button>
                    </div>
                )}

                {/* 変換結果 */}
                {results.length > 0 && (
                    <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-slate-800/80 p-6 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.85)]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                                変換結果 ({results.length})
                            </h3>
                            {results.filter(r => r.url).length > 1 && (
                                <button
                                    onClick={downloadAllAsZip}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Archive size={18} />
                                    まとめてダウンロード (ZIP)
                                </button>
                            )}
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {results.map((result, index) => (
                                <div
                                    key={index}
                                    className={clsx(
                                        "flex items-center justify-between bg-slate-900/80 backdrop-blur-sm border rounded-xl p-4 transition-all duration-200 shadow-sm shadow-black/30",
                                        result.isProcessing ? "border-primary-400/60 opacity-80" : 
                                        result.error ? "border-red-400/60" : 
                                        "border-slate-800/80 hover:border-emerald-400/60"
                                    )}
                                >
                                    <div className="flex-1 min-w-0 flex items-center gap-4">
                                        {result.isProcessing && (
                                            <Loader2 size={20} className="text-primary-400 animate-spin flex-shrink-0" />
                                        )}
                                        {!result.isProcessing && result.url && (
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-400/50 flex items-center justify-center flex-shrink-0">
                                                <Download size={20} className="text-emerald-300" />
                                            </div>
                                        )}
                                        {!result.isProcessing && result.error && (
                                            <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-400/50 flex items-center justify-center flex-shrink-0">
                                                <X size={20} className="text-red-300" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate mb-1">
                                                {getDisplayFileName(result.fileName, result.outputFormat)}
                                            </p>
                                            {result.error && (
                                                <p className="text-xs text-red-400">{result.error}</p>
                                            )}
                                            {result.url && !result.error && (
                                                <p className="text-xs text-green-400 font-medium">✓ 変換完了</p>
                                            )}
                                            {result.isProcessing && (
                                                <p className="text-xs text-primary-400">変換中...</p>
                                            )}
                                            {result.duration && (
                                                <p className="text-xs text-gray-400">所要時間: {result.duration}</p>
                                            )}
                                        </div>
                                    </div>
                                        <button
                                            onClick={() => result.url && downloadFile(result.url, result.fileName, result.outputFormat)}
                                            disabled={!result.url || result.isProcessing}
                                            className={clsx(
                                            "ml-4 px-4 py-2 rounded-lg font-medium text-sm transition-all",
                                            result.url && !result.isProcessing
                                                ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 hover:text-emerald-200 cursor-pointer border border-emerald-400/40"
                                                : "bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed"
                                            )}
                                            aria-label="Download file"
                                        >
                                        <Download size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ログ表示 */}
                {(isProcessing || logText || detailedLogs.length > 0) && (
                    <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-slate-800/80 p-6 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.85)]">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-primary-400 rounded-full"></div>
                            処理ログ
                        </h3>
                        <div ref={logRef} className="bg-slate-950/80 backdrop-blur-sm p-4 rounded-xl text-xs font-mono h-40 overflow-y-auto border border-slate-800/80 text-slate-200 whitespace-pre-wrap">
                            {[
                                ...detailedLogs,
                                ...(logText ? [logText] : [])
                            ].filter(Boolean).join('\n')}
                        </div>
                        {errorText && (
                            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/40 rounded-lg">
                                <p className="text-red-300 font-medium text-sm">{errorText}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        </div>
    );
}
