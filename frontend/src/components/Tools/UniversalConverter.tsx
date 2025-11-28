import React, { useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';

// --- Hooks ---
import { useVideoConverter } from '@/hooks/useVideoConverter';
import { useImageConverter, ImageOptions } from '@/hooks/useImageConverter';
import { usePdfConverter } from '@/hooks/usePdfConverter';

// --- Settings Components ---
import VideoSettings, { VideoConfig } from './Settings/VideoSettings';
import ImageSettings from './Settings/ImageSettings';

export default function UniversalConverter() {
    // 1. 各種フックの呼び出し
    const { 
        loaded: isVideoEngineLoaded,
        isLoading: isVideoLoading, 
        log: videoLog, 
        error: videoError, 
        outputUrl: videoUrl, 
        convertVideo 
    } = useVideoConverter();

    const { 
        isImageLoading, 
        imageLog, 
        imageError, 
        imageOutputUrl, 
        compressImages 
    } = useImageConverter();

    const { 
        isPdfLoading, 
        pdfLog, 
        pdfError, 
        pdfOutputUrl, 
        mergePdfs 
    } = usePdfConverter();

    // 2. 状態管理 (選択ファイル & 各種設定)
    const [files, setFiles] = useState<File[]>([]);
    
    // 動画設定のデフォルト
    const [videoConfig, setVideoConfig] = useState<VideoConfig>({
        format: 'mp4',
        resolution: 'original',
        mute: false
    });

    // 画像設定のデフォルト
    const [imageConfig, setImageConfig] = useState<ImageOptions>({
        format: 'original',
        quality: 0.8,
        maxWidth: 0
    });

    // 3. ロジック: モードの自動判定
    const detectMode = useMemo(() => {
        if (files.length === 0) return 'idle';
        
        const isAllVideo = files.every(f => f.type.startsWith('video'));
        const isAllImage = files.every(f => f.type.startsWith('image'));
        const isAllPdf = files.every(f => f.type === 'application/pdf');

        if (isAllVideo && files.length === 1) return 'video-single';
        if (isAllImage) return 'image-batch'; 
        if (isAllPdf && files.length > 1) return 'pdf-merge'; 
        
        return 'unknown';
    }, [files]);

    const isProcessing = isVideoLoading || isImageLoading || isPdfLoading;

    // 4. Dropzone設定 (MTSなど広範なフォーマットに対応)
    const onDrop = (acceptedFiles: File[]) => {
        setFiles(acceptedFiles);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        accept: {
            'video/*': [], 
            'video/mp2t': ['.mts', '.m2ts'], // ハイビジョン
            'video/quicktime': ['.mov'],     // iPhone
            'video/x-msvideo': ['.avi'],     // 古い形式
            'video/x-matroska': ['.mkv'],
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp'],
            'application/pdf': ['.pdf'],
        },
        multiple: true // 複数選択OK
    });

    // 5. 実行ハンドラ (モードに応じて処理を振り分け)
    const handleAction = () => {
        if (files.length === 0) return;

        switch (detectMode) {
            case 'video-single':
                convertVideo(files[0], videoConfig);
                break;
            case 'image-batch':
                compressImages(files, imageConfig);
                break;
            case 'pdf-merge':
                mergePdfs(files);
                break;
        }
    };

    // 6. 表示用変数の整理 (switch文で切り替え)
    let currentLog = "";
    let currentError: string | null = null;
    let currentUrl: string | null = null;
    let downloadName = "result";
    let actionLabel = "Start Processing";
    let infoText = "";

    switch (detectMode) {
        case 'video-single':
            currentLog = videoLog;
            currentError = videoError;
            currentUrl = videoUrl;
            // 拡張子を設定に合わせて変更
            const ext = videoConfig.format === 'gif' ? 'gif' : videoConfig.format === 'webm' ? 'webm' : 'mp4';
            downloadName = `converted_${files[0]?.name.split('.')[0]}.${ext}`;
            actionLabel = "Convert Video";
            infoText = "Video detected. Configure output settings below.";
            break;
        case 'image-batch':
            currentLog = imageLog;
            currentError = imageError;
            currentUrl = imageOutputUrl; // ※最後の1枚のプレビュー用
            downloadName = "compressed_images"; 
            actionLabel = files.length > 1 ? `Compress ${files.length} Images` : "Compress Image";
            infoText = `${files.length} Image(s) detected. Bulk compression available.`;
            break;
        case 'pdf-merge':
            currentLog = pdfLog;
            currentError = pdfError;
            currentUrl = pdfOutputUrl;
            downloadName = "merged_document.pdf";
            actionLabel = "Merge PDFs";
            infoText = `${files.length} PDFs detected. Combine into one document.`;
            break;
        case 'unknown':
            infoText = "Mixed or unsupported file types. Please select only Videos, Images, or multiple PDFs.";
            break;
    }

    // --- Render ---
    return (
        <div className="max-w-4xl mx-auto p-4 text-gray-800">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                
                {/* Header */}
                <div className="bg-gray-900 text-white p-6 text-center">
                    <h2 className="text-2xl font-bold">Universal Converter</h2>
                    <p className="text-gray-400 text-sm mt-1">Video, Image & PDF Tools (WASM Powered)</p>
                </div>

                <div className="p-8 space-y-8">
                    {/* 1. Dropzone Area */}
                    <div 
                        {...getRootProps()} 
                        className={clsx(
                            "border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300",
                            isDragActive ? "border-blue-500 bg-blue-50 scale-105" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                            // 動画エンジンのロード待ち中は少し薄くする（操作は可能にしておく）
                            !isVideoEngineLoaded && "opacity-80"
                        )}
                    >
                        <input {...getInputProps()} />
                        
                        {/* ロード中の表示 (初回のみ) */}
                        {!isVideoEngineLoaded && (
                            <div className="mb-4 flex justify-center items-center text-xs text-blue-600">
                                <span className="animate-spin mr-2">⟳</span> Initializing Video Engine...
                            </div>
                        )}

                        {files.length > 0 ? (
                            <div>
                                <p className="text-xl font-bold text-blue-600 mb-2">
                                    {files.length} file{files.length > 1 ? 's' : ''} selected
                                </p>
                                <ul className="text-sm text-gray-500 max-h-32 overflow-y-auto bg-gray-50 rounded p-2 text-left">
                                    {files.map((f, i) => (
                                        <li key={i} className="truncate border-b last:border-0 border-gray-200 py-1">
                                            {i + 1}. {f.name} <span className="text-xs text-gray-400">({(f.size/1024/1024).toFixed(2)} MB)</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-gray-400 mt-4">Click or Drop to replace selection</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg font-medium text-gray-600">
                                    Drag & Drop files here
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Supports Video (mp4, mts, mov...), Image (jpg, png...), PDF
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 2. Action & Settings Area */}
                    {files.length > 0 && (
                        <div className="animate-fade-in-up space-y-6">
                            
                            {/* モード情報 */}
                            <div className="flex items-center justify-between px-2">
                                <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                                    Mode: {detectMode}
                                </span>
                                <span className="text-xs text-gray-500">{infoText}</span>
                            </div>

                            {/* --- 設定パネルの出し分け --- */}
                            
                            {/* A. 動画設定 */}
                            {detectMode === 'video-single' && (
                                <VideoSettings 
                                    config={videoConfig} 
                                    onChange={setVideoConfig} 
                                />
                            )}

                            {/* B. 画像設定 */}
                            {detectMode === 'image-batch' && (
                                <ImageSettings 
                                    config={imageConfig} 
                                    onChange={setImageConfig} 
                                />
                            )}
                            
                            {/* C. PDF設定 (現在は設定なし) */}
                            
                            {/* --------------------------- */}

                            {/* エラー表示 */}
                            {currentError && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200 flex items-start">
                                    <span className="mr-2">⚠️</span>
                                    <div>
                                        <p className="font-bold">Process Failed</p>
                                        <p>{currentError}</p>
                                    </div>
                                </div>
                            )}

                            {/* 実行ボタン */}
                            <button
                                onClick={handleAction}
                                disabled={isProcessing || detectMode === 'unknown' || detectMode === 'idle'}
                                className={clsx(
                                    "w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-transform",
                                    (isProcessing || detectMode === 'unknown' || detectMode === 'idle')
                                        ? "bg-gray-400 cursor-not-allowed" 
                                        : "bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-[1.02] active:scale-95 hover:shadow-xl"
                                )}
                            >
                                {isProcessing ? 'Processing...' : actionLabel}
                            </button>
                        </div>
                    )}

                    {/* 3. Log & Result Area */}
                    {(isProcessing || currentLog || currentUrl) && (
                        <div className="space-y-4 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500">Process Log</h3>
                            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono h-32 overflow-y-auto shadow-inner">
                                <p className="whitespace-pre-wrap leading-relaxed">&gt; {currentLog}</p>
                            </div>

                            {/* 完了時のダウンロードボタン (一括画像の場合は自動DL済みだが、動画/PDF用に表示) */}
                            {currentUrl && !isProcessing && detectMode !== 'image-batch' && (
                                <div className="text-center pt-2">
                                    <a 
                                        href={currentUrl} 
                                        download={downloadName}
                                        className="inline-flex items-center bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-green-600 transition hover:-translate-y-1"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download Result
                                    </a>
                                </div>
                            )}
                            
                            {/* 画像一括処理完了時のメッセージ */}
                            {!isProcessing && detectMode === 'image-batch' && imageLog.includes('processed!') && (
                                <div className="text-center text-green-600 font-bold bg-green-50 p-3 rounded-lg">
                                    ✅ All images have been downloaded automatically!
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}