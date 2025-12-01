import { useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';

import Head from '@/components/Head';
import VideoSettings, { VideoConfig } from './Settings/VideoSettings';
import ImageSettings, { ImageConfig } from './Settings/ImageSettings';
import AudioSettings, { AudioConfig } from './Settings/AudioSettings';

import { useVideoConverter } from '@/hooks/useVideoConverter';
import { useImageConverter } from '@/hooks/useImageConverter';
import { usePdfConverter } from '@/hooks/usePdfConverter';
import { useAudioConverter } from '@/hooks/useAudioConverter';

export default function UniversalConverter() {
    const { isLoading: isVideoLoading, log: videoLog, error: videoError, outputUrl: videoUrl, convertVideo } = useVideoConverter();
    const { isImageLoading, imageLog, imageError, imageOutputUrl, compressImages } = useImageConverter();
    const { isPdfLoading, pdfLog, pdfError, pdfOutputUrl, mergePdfs } = usePdfConverter();
    const { isAudioLoading, audioLog, audioError, audioOutputUrl, convertAudio } = useAudioConverter();

    const [files, setFiles] = useState<File[]>([]);
    
    const [videoConfig, setVideoConfig] = useState<VideoConfig>({
        format: 'mp4',
        resolution: 'original',
        mute: false
    });
    const [imageConfig, setImageConfig] = useState<ImageConfig>({
        format: 'original',
        quality: 0.8,
        maxWidth: 0
    });
    const [audioConfig, setAudioConfig] = useState<AudioConfig>({
        format: 'mp3',
        bitrate: '192k'
    });

    const detectMode = useMemo(() => {
        if (files.length === 0) return 'idle';
        const file = files[0];
        if (file.type.startsWith('video')) return 'video-single';
        if (file.type.startsWith('image')) return 'image-batch';
        if (file.type.startsWith('audio')) return 'audio-single';
        if (file.type === 'application/pdf') return 'pdf-merge';
        return 'unknown';
    }, [files]);

    const onDrop = (accepted: File[]) => setFiles(accepted);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleAction = () => {
        if (files.length === 0) return;
        if (detectMode === 'video-single') convertVideo(files[0], videoConfig);
        if (detectMode === 'image-batch') compressImages(files, imageConfig);
        if (detectMode === 'audio-single') convertAudio(files[0], audioConfig);
        if (detectMode === 'pdf-merge') mergePdfs(files);
    };

    const isProcessing = isVideoLoading || isImageLoading || isPdfLoading || isAudioLoading;
    
    const logText = detectMode === 'video-single' ? videoLog :
                    detectMode === 'image-batch' ? imageLog :
                    detectMode === 'pdf-merge' ? pdfLog :
                    detectMode === 'audio-single' ? audioLog : "";

    const errorText = videoError || imageError || pdfError || audioError;
    const resultUrl = videoUrl || imageOutputUrl || pdfOutputUrl || audioOutputUrl;

    return (
        <div className="max-w-4xl mx-auto p-4 text-gray-200">
            <Head />
            <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
                <div className="p-8 space-y-8">
                    <div {...getRootProps()} className={clsx("border-2 border-dashed rounded-xl p-12 text-center cursor-pointer", isDragActive ? "border-primary-500" : "border-gray-700")}>
                        <input {...getInputProps()} />
                        {files.length > 0 ? <p>{files.length} files selected</p> : <p>Drag & Drop files</p>}
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-6">
                            {detectMode === 'video-single' && <VideoSettings config={videoConfig} onChange={setVideoConfig} />}
                            {detectMode === 'image-batch' && <ImageSettings config={imageConfig} onChange={setImageConfig} />}
                            {detectMode === 'audio-single' && <AudioSettings config={audioConfig} onChange={setAudioConfig} />}
                            
                            <button onClick={handleAction} disabled={isProcessing} className="w-full py-4 rounded-xl font-bold bg-primary-500 text-black hover:bg-primary-400">
                                {isProcessing ? 'Processing...' : 'Start Processing'}
                            </button>
                        </div>
                    )}

                    {(isProcessing || resultUrl || logText) && (
                        <div className="space-y-4 pt-6 border-t border-gray-800">
                            <div className="bg-black p-4 rounded-lg text-xs font-mono h-32 overflow-y-auto border border-gray-800 text-gray-400 whitespace-pre-wrap">
                                {String(logText)}
                            </div>
                            {resultUrl && (
                                <a href={resultUrl} download="converted_result" className="block text-center bg-green-600 text-white py-2 rounded">Download</a>
                            )}
                            {errorText && <p className="text-red-500 font-bold">{errorText}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
