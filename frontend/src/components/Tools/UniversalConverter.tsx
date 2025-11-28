import { useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';

// --- Hooks ---
// フックからは useVideoConverter だけ
import { useVideoConverter } from '@/hooks/useVideoConverter';
import { useImageConverter, ImageOptions } from '@/hooks/useImageConverter';
import { usePdfConverter } from '@/hooks/usePdfConverter';
import { useAudioConverter, AudioOptions } from '@/hooks/useAudioConverter'; // 【追加】

// --- Settings Components ---
// 設定パネルと型定義はここから
import VideoSettings from './Settings/VideoSettings';
import ImageSettings from './Settings/ImageSettings';
import AudioSettings from './Settings/AudioSettings'; // 【追加】

export default function UniversalConverter() {
    // 1. Hooks Initialization
    const { isLoading: isVideoLoading, log: videoLog, error: videoError, outputUrl: videoUrl, convertVideo } = useVideoConverter();
    const { isImageLoading, imageLog, imageError, imageOutputUrl, compressImages } = useImageConverter();
    const { isPdfLoading, pdfLog, pdfError, pdfOutputUrl, mergePdfs } = usePdfConverter();
    const { isAudioLoading, audioLog, audioError, audioOutputUrl, convertAudio } = useAudioConverter(); // 【追加】

    // 2. Local State
    const [files, setFiles] = useState<File[]>([]);

    // Settings State
    // 動画設定
    const [videoConfig, setVideoConfig] = useState<any>({ // 型定義があれば <VideoConfig>
        format: 'mp4',
        resolution: 'original',
        mute: false
    });
    // 画像設定
    const [imageConfig, setImageConfig] = useState<ImageOptions>({
        format: 'original',
        quality: 0.8,
        maxWidth: 0
    });
    // 音声設定 【追加】
    const [audioConfig, setAudioConfig] = useState<AudioOptions>({
        format: 'mp3',
        bitrate: '192k'
    });

    // 3. Mode Detection Logic
    const detectMode = useMemo(() => {
        if (files.length === 0) return 'idle';
        
        const isAllVideo = files.every(f => f.type.startsWith('video'));
        const isAllImage = files.every(f => f.type.startsWith('image'));
        const isAllPdf = files.every(f => f.type === 'application/pdf');
        const isAllAudio = files.every(f => f.type.startsWith('audio')); // 【追加】

        if (isAllVideo && files.length === 1) return 'video-single';
        // if (isAllVideo && files.length > 1) return 'video-batch'; // 将来対応用
        
        if (isAllImage) return 'image-batch';
        
        if (isAllPdf && files.length > 1) return 'pdf-merge';
        
        if (isAllAudio && files.length === 1) return 'audio-single'; // 【追加】
        
        return 'unknown';
    }, [files]);

    const isProcessing = isVideoLoading || isImageLoading || isPdfLoading || isAudioLoading;

    // 4. Dropzone Configuration
    const onDrop = (acceptedFiles: File[]) => {
        setFiles(acceptedFiles);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        accept: {
            // 動画
            'video/*': [], 
            'video/mp2t': ['.mts', '.m2ts'],
            'video/quicktime': ['.mov'],
            'video/x-msvideo': ['.avi'],
            'video/x-matroska': ['.mkv'],
            // 画像
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp'],
            // PDF
            'application/pdf': ['.pdf'],
            // 音声 【追加】
            'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma'],
        },
        multiple: true
    });

    // 5. Action Handler
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
            case 'audio-single': // 【追加】
                convertAudio(files[0], audioConfig);
                break;
        }
    };

    // 6. UI Variable Preparation
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
            downloadName = `converted_${files[0]?.name.split('.')[0]}.${videoConfig.format}`;
            actionLabel = "Convert Video";
            infoText = "Video detected. Configure output settings below.";
            break;
        case 'image-batch':
            currentLog = imageLog;
            currentError = imageError;
            currentUrl = imageOutputUrl;
            downloadName = `compressed_${files[0]?.name}`; // 実際は自動DLだがプレビュー用に
            actionLabel = files.length > 1 ? "Compress All Images" : "Compress Image";
            infoText = `${files.length} Image(s) detected. High-speed compression.`;
            break;
        case 'pdf-merge':
            currentLog = pdfLog;
            currentError = pdfError;
            currentUrl = pdfOutputUrl;
            downloadName = "merged_document.pdf";
            actionLabel = "Merge PDFs";
            infoText = `${files.length} PDFs detected. Combine into one document.`;
            break;
        case 'audio-single': // 【追加】
            currentLog = audioLog;
            currentError = audioError;
            currentUrl = audioOutputUrl;
            downloadName = `converted_${files[0]?.name.split('.')[0]}.${audioConfig.format}`;
            actionLabel = "Convert Audio";
            infoText = "Audio detected. Convert format or change bitrate.";
            break;
        case 'unknown':
            infoText = "Mixed or unsupported file types. Please select only Video, Image, Audio, or PDF files.";
            break;
    }

    // --- Render ---
    return (
        <div className="max-w-4xl mx-auto p-4 text-gray-800">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                
                {/* Header */}
                <div className="bg-gray-900 text-white p-6 text-center">
                    <h2 className="text-2xl font-bold">Universal Converter</h2>
                    <p className="text-gray-400 text-sm mt-1">Video, Audio, Image & PDF Tools</p>
                </div>

                <div className="p-8 space-y-8">
                    {/* 1. Dropzone */}
                    <div 
                        {...getRootProps()} 
                        className={clsx(
                            "border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300",
                            isDragActive ? "border-blue-500 bg-blue-50 scale-105" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        )}
                    >
                        <input {...getInputProps()} />
                        {files.length > 0 ? (
                            <div>
                                <p className="text-xl font-bold text-blue-600 mb-2">
                                    {files.length} file{files.length > 1 ? 's' : ''} selected
                                </p>
                                <ul className="text-sm text-gray-500 max-h-32 overflow-y-auto px-4">
                                    {files.map((f, i) => (
                                        <li key={i} className="truncate">
                                            {f.name} ({(f.size/1024/1024).toFixed(2)} MB)
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-gray-400 mt-4">Click or Drop to replace files</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg font-medium text-gray-600">
                                    Drag & Drop files here
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Video, Audio, Image, or PDF
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 2. Action Area */}
                    {files.length > 0 && (
                        <div className="animate-fade-in-up space-y-4">
                            
                            {/* --- Settings Panels --- */}
                            
                            {/* Video Settings */}
                            {detectMode === 'video-single' && (
                                <VideoSettings 
                                    config={videoConfig} 
                                    onChange={setVideoConfig} 
                                />
                            )}

                            {/* Image Settings */}
                            {detectMode === 'image-batch' && (
                                <ImageSettings 
                                    config={imageConfig} 
                                    onChange={setImageConfig} 
                                />
                            )}

                            {/* Audio Settings 【追加】 */}
                            {detectMode === 'audio-single' && (
                                <AudioSettings
                                    config={audioConfig}
                                    onChange={setAudioConfig}
                                />
                            )}

                            {/* Default Info (for PDF or Unknown) */}
                            {['pdf-merge', 'unknown'].includes(detectMode) && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-bold text-gray-700 mb-2">Mode: {detectMode}</h3>
                                    <p className="text-xs text-gray-500">{infoText}</p>
                                </div>
                            )}
                            
                            {/* --------------------------- */}

                            {currentError && (
                                <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
                                    Error: {currentError}
                                </div>
                            )}

                            <button
                                onClick={handleAction}
                                disabled={isProcessing || detectMode === 'unknown'}
                                className={clsx(
                                    "w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-transform",
                                    (isProcessing || detectMode === 'unknown')
                                        ? "bg-gray-400 cursor-not-allowed" 
                                        : "bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-[1.02] active:scale-95"
                                )}
                            >
                                {isProcessing ? 'Processing...' : actionLabel}
                            </button>
                        </div>
                    )}

                    {/* 3. Result Area */}
                    {(isProcessing || currentUrl) && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono h-24 overflow-y-auto">
                                &gt; {currentLog}
                            </div>

                            {currentUrl && (
                                <div className="text-center">
                                    <a 
                                        href={currentUrl} 
                                        download={downloadName}
                                        className="inline-block bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-green-600 transition"
                                    >
                                        Download Result
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}