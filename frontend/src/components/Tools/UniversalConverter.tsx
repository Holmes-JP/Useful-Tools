import { useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import { X, Trash2, Download, Archive, Loader2 } from 'lucide-react';
import * as fflate from 'fflate';

import Head from '@/components/Head';
import VideoSettings, { VideoConfig } from './Settings/VideoSettings';
import ImageSettings, { ImageConfig } from './Settings/ImageSettings';
import AudioSettings, { AudioConfig } from './Settings/AudioSettings';
import DocumentSettings, { DocConfig } from './Settings/DocumentSettings';

import { useVideoConverter } from '@/hooks/useVideoConverter';
import { useImageConverter } from '@/hooks/useImageConverter';
import { usePdfConverter } from '@/hooks/usePdfConverter';
import { useAudioConverter } from '@/hooks/useAudioConverter';

export default function UniversalConverter() {
    const { isLoading: isVideoLoading, log: videoLog, error: videoError, convertVideo } = useVideoConverter();
    const { isImageLoading, imageLog, imageError, compressImages } = useImageConverter();
    const { isPdfLoading, pdfLog, pdfError, mergePdfs, pdfToText } = usePdfConverter();
    const { isAudioLoading, audioLog, audioError } = useAudioConverter();

    const [files, setFiles] = useState<File[]>([]);
    
    // 変換結果を管理
    type ConversionResult = {
        fileName: string;
        url: string | null;
        isProcessing: boolean;
        error: string | null;
        outputFormat?: string; // 出力フォーマット
    };
    const [results, setResults] = useState<ConversionResult[]>([]);
    
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
                const mergedUrl = await mergePdfs(fileTypeStats.documentFiles);
                // マージ結果を最初のドキュメントファイルのインデックスに置き換え
                const firstDocIndex = fileInfos.findIndex(info => info.fileType === 'document');
                if (firstDocIndex >= 0) {
                    setResults(prev => prev.map((r, idx) => {
                        if (idx === firstDocIndex) {
                            return { fileName: `merged_${Date.now()}.pdf`, url: mergedUrl, isProcessing: false, error: null, outputFormat: 'pdf' };
                        }
                        // 他のドキュメントファイルは除外（マージ済み）
                        if (fileInfos[idx].fileType === 'document' && idx !== firstDocIndex) {
                            return { ...r, isProcessing: false, url: null, error: null };
                        }
                        return r;
                    }));
                }
            } catch (error: any) {
                setResults(prev => prev.map((r, idx) => 
                    fileInfos[idx].fileType === 'document' 
                        ? { ...r, error: error.message || String(error), isProcessing: false }
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
    };

    // 個別ファイルの変換処理
    const processFile = async (index: number, fileInfo: { file: File; fileType: string; outputFormat: string | undefined }) => {
        const { file, fileType } = fileInfo;
        try {
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
                    resultUrl = await compressImages([file], imageConfig);
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
                        resultUrl = await pdfToText(file);
                    } else {
                        // テキストファイルはそのまま返す
                        resultUrl = URL.createObjectURL(file);
                    }
                } else {
                    // テキスト→PDFまたはPDF処理
                    resultUrl = await mergePdfs([file]);
                }
            }

            // 結果を更新
            setResults(prev => prev.map((r, idx) => 
                idx === index ? { ...r, url: resultUrl || null, isProcessing: false } : r
            ));
        } catch (error: any) {
            setResults(prev => prev.map((r, idx) => 
                idx === index ? { ...r, error: error.message || String(error), isProcessing: false } : r
            ));
        }
    };

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

    const isProcessing = isVideoLoading || isImageLoading || isPdfLoading || isAudioLoading;
    
    // 各ファイルタイプのログを結合
    const logText = [
        fileTypeStats.hasVideo ? videoLog : '',
        fileTypeStats.hasImage ? imageLog : '',
        fileTypeStats.hasAudio ? audioLog : '',
        fileTypeStats.hasDocument ? pdfLog : ''
    ].filter(Boolean).join('\n');

    const errorText = videoError || imageError || pdfError || audioError;

    return (
        <div className="max-w-4xl mx-auto p-4 text-gray-200">
            <Head title="Universal Converter" description="Convert videos, compress images, merge PDFs, and convert audio files - all in your browser" />
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Universal Converter</h2>
                <p className="text-gray-400 mt-2">Auto-detect and convert your files</p>
            </div>
            <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
                <div className="p-8 space-y-8">
                    <div {...getRootProps()} className={clsx("border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors", isDragActive ? "border-primary-500 bg-primary-500/10" : "border-gray-700 hover:border-gray-600")}>
                        <input {...getInputProps()} />
                        {files.length > 0 ? (
                            <p className="text-gray-300">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
                        ) : (
                            <div>
                                <p className="text-gray-300 font-semibold mb-2">Drag & Drop files here</p>
                                <p className="text-gray-500 text-sm">or click to browse</p>
                            </div>
                        )}
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-400">Selected Files ({files.length})</h4>
                                <button
                                    onClick={resetFiles}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Reset All
                                </button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {files.map((file, index) => (
                                    <div 
                                        key={index}
                                        className="group flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-3 hover:bg-gray-750 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">{file.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="ml-3 p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                            aria-label="Remove file"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {files.length > 0 && (
                        <div className="space-y-6">
                            {fileTypeStats.hasVideo && <VideoSettings config={videoConfig} onChange={setVideoConfig} />}
                            {fileTypeStats.hasImage && <ImageSettings config={imageConfig} onChange={setImageConfig} />}
                            {fileTypeStats.hasAudio && <AudioSettings config={audioConfig} onChange={setAudioConfig} />}
                            {fileTypeStats.hasDocument && <DocumentSettings config={docConfig} onChange={setDocConfig} inputType={fileTypeStats.documentFiles[0]?.type || ''} />}
                            
                            <button onClick={handleAction} disabled={isProcessing} className="w-full py-4 rounded-xl font-bold bg-primary-500 text-black hover:bg-primary-400">
                                {isProcessing ? 'Processing...' : 'Start Processing'}
                            </button>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="space-y-4 pt-6 border-t border-gray-800">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-400">Conversion Results ({results.length})</h4>
                                {results.filter(r => r.url).length > 1 && (
                                    <button
                                        onClick={downloadAllAsZip}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                                    >
                                        <Archive size={16} />
                                        Download All (ZIP)
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {results.map((result, index) => (
                                    <div
                                        key={index}
                                        className={clsx(
                                            "flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-3 transition-all",
                                            result.isProcessing ? "opacity-50" : "opacity-100"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0 flex items-center gap-3">
                                            {result.isProcessing && (
                                                <Loader2 size={18} className="text-primary-500 animate-spin flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">
                                                    {getDisplayFileName(result.fileName, result.outputFormat)}
                                                </p>
                                                {result.error && (
                                                    <p className="text-xs text-red-400 mt-1">{result.error}</p>
                                                )}
                                                {result.url && !result.error && (
                                                    <p className="text-xs text-green-400 mt-1">変換完了</p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => result.url && downloadFile(result.url, result.fileName, result.outputFormat)}
                                            disabled={!result.url || result.isProcessing}
                                            className={clsx(
                                                "ml-3 p-2 rounded-md transition-colors",
                                                result.url && !result.isProcessing
                                                    ? "text-green-400 hover:text-green-300 hover:bg-green-500/10 cursor-pointer"
                                                    : "text-gray-600 cursor-not-allowed"
                                            )}
                                            aria-label="Download file"
                                        >
                                            <Download size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(isProcessing || logText) && (
                        <div className="space-y-4 pt-6 border-t border-gray-800">
                            <div className="bg-black p-4 rounded-lg text-xs font-mono h-32 overflow-y-auto border border-gray-800 text-gray-400 whitespace-pre-wrap">
                                {String(logText)}
                            </div>
                            {errorText && <p className="text-red-500 font-bold">{errorText}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
