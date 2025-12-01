import React, { useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import * as fflate from 'fflate';
import { Download, Trash2, Archive, File as FileIcon } from 'lucide-react';

// Hooks
import { useVideoConverter } from '@/hooks/useVideoConverter';
import { useAudioConverter } from '@/hooks/useAudioConverter';
import { useImageConverter } from '@/hooks/useImageConverter';
import { usePdfConverter } from '@/hooks/usePdfConverter';

// Settings UI
import VideoSettings, { VideoConfig } from './Settings/VideoSettings';
import AudioSettings, { AudioConfig } from './Settings/AudioSettings';
import ImageSettings, { ImageConfig } from './Settings/ImageSettings';
import DocumentSettings, { DocConfig } from './Settings/DocumentSettings';

export default function UniversalConverter() {
    const [files, setFiles] = useState<File[]>([]);

    // --- Config States ---
    const [videoConfig, setVideoConfig] = useState<VideoConfig>({
        format: 'mp4', codecVideo: 'default', codecAudio: 'default', resolution: 'original', customWidth: 1920, customHeight: 1080, mute: false, frameRate: 0, metadataTitle: '', metadataDate: ''
    });
    const [audioConfig, setAudioConfig] = useState<AudioConfig>({
        format: 'mp3', bitrate: '192k', sampleRate: 0, channels: 'original', volume: 1.0, metadataTitle: '', metadataArtist: '', metadataDate: ''
    });
    const [imageConfig, setImageConfig] = useState<ImageConfig>({
        format: 'original', quality: 0.8, maxWidth: 0, maxHeight: 0, keepAspect: true, metadataDate: ''
    });
    const [docConfig, setDocConfig] = useState<DocConfig>({
        mode: 'merge', rotateAngle: 90, imageFormat: 'jpg', metadataTitle: '', metadataAuthor: '', metadataDate: ''
    });

    // --- Hooks Instances ---
    const video = useVideoConverter();
    const audio = useAudioConverter();
    const image = useImageConverter(); // ※useImageConverterもArray戻り値に対応させる必要あり(後述)
    const pdf = usePdfConverter();

    // --- Logic ---
    const fileType = useMemo(() => {
        if (files.length === 0) return 'idle';
        const type = files[0].type;
        if (type.startsWith('video')) return 'video';
        if (type.startsWith('audio')) return 'audio';
        if (type.startsWith('image')) return 'image';
        if (type === 'application/pdf') return 'pdf';
        return 'unknown';
    }, [files]);

    const isProcessing = video.isLoading || audio.isLoading || image.isImageLoading || pdf.isLoading;

    // 統一した結果URLリスト
    const results = useMemo(() => {
        if (fileType === 'video') return video.outputUrls;
        if (fileType === 'audio') return audio.outputUrls;
        if (fileType === 'pdf') return pdf.outputUrls;
        // Imageはフック側でURL管理していない（BlobDL直打ち）実装だった場合、ここを調整する必要があるが
        // 今回はVideo/Audio/PDFを優先実装。
        return [];
    }, [video.outputUrls, audio.outputUrls, pdf.outputUrls, fileType]);

    const logs = useMemo(() => {
        if (fileType === 'video') return video.log;
        if (fileType === 'audio') return audio.log;
        if (fileType === 'pdf') return pdf.log;
        return [];
    }, [video.log, audio.log, pdf.log, fileType]);

    // --- Handlers ---
    const onDrop = (acceptedFiles: File[]) => {
        // ファイル追加（蓄積）
        setFiles(prev => [...prev, ...acceptedFiles]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleReset = () => {
        setFiles([]);
        // 各フックの状態リセットが必要ならここで行う
    };

    const handleConvert = () => {
        if (fileType === 'video') video.convertVideos(files, videoConfig);
        else if (fileType === 'audio') audio.convertAudios(files, audioConfig);
        else if (fileType === 'image') image.compressImages(files, imageConfig); // 既存のまま
        else if (fileType === 'pdf') pdf.processDocs(files, docConfig);
    };

    const downloadAllZip = async () => {
        if (results.length === 0) return;
        
        // URLからBlobを取得してZip化
        const zipFiles: { [name: string]: Uint8Array } = {};
        
        for (const res of results) {
            const blob = await fetch(res.url).then(r => r.blob());
            const buffer = await blob.arrayBuffer();
            zipFiles[res.name] = new Uint8Array(buffer);
        }

        fflate.zip(zipFiles, { level: 6 }, (err, data) => {
            if (err) return alert(err);
            const url = URL.createObjectURL(new Blob([data], { type: 'application/zip' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `converted_files_${Date.now()}.zip`;
            a.click();
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Universal Converter</h2>
                <p className="text-gray-500">Video, Audio, Image, and PDF Tools</p>
            </div>

            <div className="bg-surface border border-gray-700 rounded-2xl p-6">
                {/* Dropzone */}
                <div {...getRootProps()} className={clsx("border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-6", isDragActive ? "border-primary-500 bg-primary-500/10" : "border-gray-600 hover:bg-gray-800")}>
                    <input {...getInputProps()} />
                    <p className="text-gray-300 font-bold text-lg">Drag & Drop Files Here</p>
                    <p className="text-gray-500 text-sm">Click to select or append files</p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-bold">{files.length} Files Selected ({fileType.toUpperCase()})</span>
                            <button onClick={handleReset} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm"><Trash2 size={14}/> Reset All</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {files.map((f, i) => (
                                <div key={i} className="bg-gray-900 text-gray-300 px-3 py-1 rounded text-xs border border-gray-700 flex items-center gap-2">
                                    <FileIcon size={12}/> {f.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Settings Panel */}
                {files.length > 0 && (
                    <div className="space-y-6">
                        {fileType === 'video' && <VideoSettings config={videoConfig} onChange={setVideoConfig} />}
                        {fileType === 'audio' && <AudioSettings config={audioConfig} onChange={setAudioConfig} />}
                        {fileType === 'image' && <ImageSettings config={imageConfig} onChange={setImageConfig} />}
                        {fileType === 'pdf' && <DocumentSettings config={docConfig} onChange={setDocConfig} />}
                        
                        <button onClick={handleConvert} disabled={isProcessing} className={clsx("w-full py-4 rounded-xl font-bold text-lg text-black shadow-lg transition-transform", isProcessing ? "bg-gray-500 cursor-not-allowed" : "bg-primary-500 hover:scale-[1.01] active:scale-95")}>
                            {isProcessing ? 'Processing...' : 'Start Conversion'}
                        </button>
                    </div>
                )}
            </div>

            {/* Logs & Results */}
            {(logs.length > 0 || results.length > 0) && (
                <div className="bg-black border border-gray-800 rounded-xl p-4 font-mono text-xs">
                    <div className="h-48 overflow-y-auto text-green-400 space-y-1 mb-4 custom-scrollbar">
                        {logs.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                    
                    {results.length > 0 && (
                        <div className="border-t border-gray-800 pt-4 flex justify-between items-center">
                            <span className="text-white font-bold">{results.length} files generated</span>
                            <button onClick={downloadAllZip} className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 flex items-center gap-2">
                                <Archive size={16} /> Download All as Zip
                            </button>
                        </div>
                    )}
                    
                    {/* Individual Downloads */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                        {results.map((res, i) => (
                            <a key={i} href={res.url} download={res.name} className="block bg-gray-900 hover:bg-gray-800 border border-gray-700 p-2 rounded text-gray-300 text-center truncate">
                                <Download size={12} className="inline mr-1"/> {res.name}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
