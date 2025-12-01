import React, { useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import * as fflate from 'fflate';
import { Download, Trash2, Archive, File as FileIcon, RefreshCw, X } from 'lucide-react';

import { useVideoConverter } from '@/hooks/useVideoConverter';
import { useAudioConverter } from '@/hooks/useAudioConverter';
import { useImageConverter } from '@/hooks/useImageConverter';

import VideoSettings, { VideoConfig } from './Settings/VideoSettings';
import AudioSettings, { AudioConfig } from './Settings/AudioSettings';
import ImageSettings, { ImageConfig } from './Settings/ImageSettings';

export default function UniversalConverter() {
    const [files, setFiles] = useState<File[]>([]);

    const [videoConfig, setVideoConfig] = useState<VideoConfig>({
        format: 'mp4', codecVideo: 'default', codecAudio: 'default', resolution: 'original', customWidth: 1920, customHeight: 1080, bitrateVideo: '', bitrateAudio: '', mute: false, frameRate: 0
    });
    const [audioConfig, setAudioConfig] = useState<AudioConfig>({
        format: 'mp3', bitrate: '192k', customBitrate: '', sampleRate: 0, channels: 'original', volume: 1.0, metadataTitle: '', metadataArtist: '', metadataDate: ''
    });
    const [imageConfig, setImageConfig] = useState<ImageConfig>({
        format: 'original', quality: 0.8
    });

    const video = useVideoConverter();
    const audio = useAudioConverter();
    const image = useImageConverter();

    const fileType = useMemo(() => {
        if (files.length === 0) return 'idle';
        const type = files[0].type;
        if (type.startsWith('video')) return 'video';
        if (type.startsWith('audio')) return 'audio';
        if (type.startsWith('image')) return 'image';
        return 'unknown';
    }, [files]);

    const isProcessing = video.isLoading || audio.isLoading || image.isImageLoading;

    const results = useMemo(() => {
        if (fileType === 'video') return video.outputUrls;
        if (fileType === 'audio') return audio.outputUrls;
        if (fileType === 'image') return image.outputUrls;
        return [];
    }, [video.outputUrls, audio.outputUrls, image.outputUrls, fileType]);

    const logs = useMemo(() => {
        if (fileType === 'video') return video.log;
        if (fileType === 'audio') return audio.log;
        if (fileType === 'image') return image.log;
        return [];
    }, [video.log, audio.log, image.log, fileType]);

    const handleReset = () => {
        if (window.confirm('Are you sure you want to clear all files?')) {
            setFiles([]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const onDrop = (acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        // メディアファイルのみ許可
        accept: {
            'video/*': [],
            'audio/*': [],
            'image/*': []
        }
    });

    const handleConvert = () => {
        if (fileType === 'video') video.convertVideos(files, videoConfig);
        else if (fileType === 'audio') audio.convertAudios(files, audioConfig);
        else if (fileType === 'image') image.compressImages(files, imageConfig);
    };

    const downloadAllZip = async () => {
        if (results.length === 0) return;
        const zipFiles: { [name: string]: Uint8Array } = {};
        for (const res of results) {
            const blob = await fetch(res.url).then(r => r.blob());
            const buffer = await blob.arrayBuffer();
            zipFiles[res.name] = new Uint8Array(buffer);
        }
        // @ts-ignore
        fflate.zip(zipFiles, { level: 6 }, (err, data) => {
            if (err) return alert(err);
            // @ts-ignore
            const url = URL.createObjectURL(new Blob([data], { type: 'application/zip' }));
            const a = document.createElement('a');
            a.href = url; a.download = `converted_media_${Date.now()}.zip`; a.click();
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Universal Converter</h2>
                <p className="text-gray-500">Video, Audio, and Image Converter</p>
            </div>

            <div className="bg-surface border border-gray-700 rounded-2xl p-6">
                <div {...getRootProps()} className={clsx("border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-6", isDragActive ? "border-primary-500 bg-primary-500/10" : "border-gray-600 hover:bg-gray-800")}>
                    <input {...getInputProps()} />
                    <p className="text-gray-300 font-bold text-lg">Drag & Drop Media Files</p>
                    <p className="text-gray-500 text-sm">Video, Audio, Image</p>
                </div>

                {files.length > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-bold">{files.length} Files ({fileType.toUpperCase()})</span>
                            <button onClick={handleReset} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm border border-red-900/50 bg-red-900/20 px-3 py-1 rounded hover:bg-red-900/40 transition">
                                <Trash2 size={14}/> Clear All
                            </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-gray-800 rounded bg-black/30">
                            {files.map((f, i) => (
                                <div key={i} className="bg-gray-900 text-gray-300 pl-3 pr-1 py-1 rounded text-xs border border-gray-700 flex items-center gap-2 group">
                                    <FileIcon size={12}/> 
                                    <span className="truncate max-w-[150px]">{f.name}</span>
                                    <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/10 transition">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {files.length > 0 && (
                    <div className="space-y-6">
                        {fileType === 'video' && <VideoSettings config={videoConfig} onChange={setVideoConfig} />}
                        {fileType === 'audio' && <AudioSettings config={audioConfig} onChange={setAudioConfig} />}
                        {fileType === 'image' && <ImageSettings config={imageConfig} onChange={setImageConfig} />}
                        
                        <button onClick={handleConvert} disabled={isProcessing} className={clsx("w-full py-4 rounded-xl font-bold text-lg text-black shadow-lg transition-transform", isProcessing ? "bg-gray-500 cursor-not-allowed" : "bg-primary-500 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2")}>
                            {isProcessing ? <><RefreshCw className="animate-spin"/> Processing...</> : 'Start Conversion'}
                        </button>
                    </div>
                )}
            </div>

            {(logs.length > 0 || results.length > 0) && (
                <div className="bg-black border border-gray-800 rounded-xl p-4 font-mono text-xs">
                    <div className="h-64 overflow-y-auto text-green-400 space-y-1 mb-4 custom-scrollbar p-2 bg-gray-900/50 rounded">
                        {logs.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                    
                    {results.length > 0 && (
                        <div className="border-t border-gray-800 pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-white font-bold text-lg">Result: {results.length} Files</span>
                                <button onClick={downloadAllZip} className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 flex items-center gap-2 shadow">
                                    <Archive size={16} /> Download All as Zip
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {results.map((res, i) => (
                                    <a key={i} href={res.url} download={res.name} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 p-3 rounded text-gray-300 text-center truncate transition">
                                        <Download size={14} className="flex-shrink-0"/> <span className="truncate">{res.name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
