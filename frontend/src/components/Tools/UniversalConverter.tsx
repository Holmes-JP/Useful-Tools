import { useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';

// Components
import Head from '@/components/Head';
import VideoSettings, { VideoConfig } from './Settings/VideoSettings';
import ImageSettings from './Settings/ImageSettings';
import AudioSettings from './Settings/AudioSettings';

// Hooks
import { useVideoConverter } from '@/hooks/useVideoConverter';
import { useImageConverter, ImageOptions } from '@/hooks/useImageConverter';
import { usePdfConverter } from '@/hooks/usePdfConverter';
import { useAudioConverter, AudioOptions } from '@/hooks/useAudioConverter';

export default function UniversalConverter() {
    // --- Hooks ---
    const { isLoading: isVideoLoading, log: videoLog, error: videoError, outputUrl: videoUrl, convertVideo } = useVideoConverter();
    const { isImageLoading, imageLog, imageError, imageOutputUrl, compressImages } = useImageConverter();
    const { isPdfLoading, pdfLog, pdfError, pdfOutputUrl, mergePdfs } = usePdfConverter();
    const { isAudioLoading, audioLog, audioError, audioOutputUrl, convertAudio } = useAudioConverter();

    // --- State ---
    const [files, setFiles] = useState<File[]>([]);

    // Settings State
    const [videoConfig, setVideoConfig] = useState<VideoConfig>({
        format: 'mp4',
        resolution: 'original',
        mute: false
    });

    const [imageConfig, setImageConfig] = useState<ImageOptions>({
        format: 'original',
        quality: 0.8,
        maxWidth: 0
    });

    const [audioConfig, setAudioConfig] = useState<AudioOptions>({
        format: 'mp3',
        bitrate: '192k'
    });

    // --- Logic: ファイル種別とモード判定 ---
    const detectMode = useMemo(() => {
        if (files.length === 0) return 'idle';
        
        const isAllVideo = files.every(f => f.type.startsWith('video') || f.name.endsWith('.mts') || f.name.endsWith('.m2ts'));
        const isAllImage = files.every(f => f.type.startsWith('image'));
        const isAllPdf = files.every(f => f.type === 'application/pdf');
        const isAllAudio = files.every(f => f.type.startsWith('audio'));

        if (isAllVideo && files.length === 1) return 'video-single';
        if (isAllAudio && files.length === 1) return 'audio-single';
        if (isAllImage) return 'image-batch';
        if (isAllPdf && files.length > 1) return 'pdf-merge';
        
        return 'unknown';
    }, [files]);

    const isProcessing = isVideoLoading || isImageLoading || isPdfLoading || isAudioLoading;

    // --- Dropzone ---
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
            // 音声
            'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'],
        },
        multiple: true
    });

    // --- Action Handler ---
    const handleAction = () => {
        if (files.length === 0) return;

        switch (detectMode) {
            case 'video-single':
                convertVideo(files[0], videoConfig);
                break;
            case 'audio-single':
                convertAudio(files[0], audioConfig);
                break;
            case 'image-batch':
                compressImages(files, imageConfig);
                break;
            case 'pdf-merge':
                mergePdfs(files);
                break;
        }
    };

    // --- Display Variables Setup ---
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
            infoText = "Video detected. Ready to convert locally.";
            break;
        case 'audio-single':
            currentLog = audioLog;
            currentError = audioError;
            currentUrl = audioOutputUrl;
            downloadName = `converted_${files[0]?.name.split('.')[0]}.${audioConfig.format}`;
            actionLabel = "Convert Audio";
            infoText = "Audio detected. Extract or convert sound.";
            break;
        case 'image-batch':
            currentLog = imageLog;
            currentError = imageError;
            currentUrl = imageOutputUrl;
            downloadName = `compressed_images`; // 個別ダウンロードですが念のため
            actionLabel = files.length > 1 ? `Compress ${files.length} Images` : "Compress Image";
            infoText = `Image(s) detected. Batch compression available.`;
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
            infoText = "Mixed or unsupported file types. Please select only one type at a time.";
            break;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 text-gray-200">
            {/* SEO Meta Tags */}
            <Head />

            {/* Main Card */}
            <div className="bg-surface rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
                
                {/* Header */}
                <div className="bg-black/40 p-8 text-center border-b border-gray-800">
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        Universal <span className="text-primary-400">Converter</span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-2 font-mono">
                        Video • Audio • Image • PDF
                    </p>
                </div>

                <div className="p-8 space-y-8">
                    {/* 1. Dropzone */}
                    <div 
                        {...getRootProps()} 
                        className={clsx(
                            "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300",
                            isDragActive 
                                ? "border-primary-500 bg-primary-500/10 scale-[1.01]" 
                                : "border-gray-700 hover:border-primary-500/50 hover:bg-gray-800"
                        )}
                    >
                        <input {...getInputProps()} />
                        {files.length > 0 ? (
                            <div>
                                <p className="text-xl font-bold text-primary-400 mb-3">
                                    {files.length} file{files.length > 1 ? 's' : ''} selected
                                </p>
                                <ul className="text-sm text-gray-400 max-h-32 overflow-y-auto mb-4 custom-scrollbar">
                                    {files.map((f, i) => (
                                        <li key={i} className="py-1 border-b border-gray-800 last:border-0">
                                            {f.name} <span className="text-gray-600">({(f.size/1024/1024).toFixed(2)} MB)</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-gray-500">Click or Drop to replace</p>
                            </div>
                        ) : (
                            <div>
                                <div className="text-4xl mb-4">📂</div>
                                <p className="text-lg font-medium text-gray-300">
                                    Drag & Drop files here
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Supported: MP4, MP3, PNG, JPG, PDF...
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 2. Action Area */}
                    {files.length > 0 && (
                        <div className="animate-fade-in-up space-y-6">
                            
                            {/* Auto Detection Info */}
                            {detectMode !== 'unknown' && detectMode !== 'idle' && (
                                <div className="flex items-center gap-3 text-sm text-gray-400 bg-black/20 p-3 rounded-lg border border-gray-800">
                                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                                    {infoText}
                                </div>
                            )}

                            {/* Settings Panels */}
                            {detectMode === 'video-single' && (
                                <VideoSettings config={videoConfig} onChange={setVideoConfig} />
                            )}
                            {detectMode === 'audio-single' && (
                                <AudioSettings config={audioConfig} onChange={setAudioConfig} />
                            )}
                            {detectMode === 'image-batch' && (
                                <ImageSettings config={imageConfig} onChange={setImageConfig} />
                            )}

                            {/* Error Message */}
                            {currentError && (
                                <div className="bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-900/50 text-sm">
                                    <strong>Error:</strong> {currentError}
                                </div>
                            )}

                            {/* Main Action Button */}
                            <button
                                onClick={handleAction}
                                disabled={isProcessing || detectMode === 'unknown'}
                                className={clsx(
                                    "w-full py-4 rounded-xl font-bold text-lg text-black shadow-lg transition-all duration-200",
                                    (isProcessing || detectMode === 'unknown')
                                        ? "bg-gray-700 cursor-not-allowed text-gray-500" 
                                        : "bg-primary-500 hover:bg-primary-400 hover:shadow-primary-500/20 active:scale-[0.98]"
                                )}
                            >
                                {isProcessing ? 'Processing...' : actionLabel}
                            </button>
                        </div>
                    )}

                    {/* 3. Result / Log Area */}
                    {(isProcessing || currentUrl || currentLog) && (
                        <div className="space-y-4 pt-6 border-t border-gray-800">
                            {/* Log Console */}
                            <div className="bg-black p-4 rounded-lg text-xs font-mono h-32 overflow-y-auto border border-gray-800 text-gray-400">
                                <div className="mb-2 text-gray-600 uppercase tracking-widest text-[10px]">Processing Log</div>
                                <div className="whitespace-pre-wrap">
                                    &gt; {currentLog}
                                </div>
                            </div>

                            {/* Download Button */}
                            {currentUrl && (
                                <div className="text-center pt-2">
                                    <a 
                                        href={currentUrl} 
                                        download={downloadName}
                                        className="inline-flex items-center gap-2 bg-gray-800 text-primary-400 border border-primary-500/30 px-8 py-3 rounded-full font-bold hover:bg-gray-700 hover:text-primary-300 transition-colors"
                                    >
                                        <span>Download Result</span>
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