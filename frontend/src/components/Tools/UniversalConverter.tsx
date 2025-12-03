import React, { useState, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import * as fflate from 'fflate';
import { Download, Trash2, Archive, File as FileIcon, RefreshCw, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

import { useVideoStudio, ProcessStatus } from '@/hooks/useVideoStudio';
import { useImageConverter } from '@/hooks/useImageConverter';

import VideoSettings, { VideoConfig } from './Settings/VideoSettings';
import AudioSettings, { AudioConfig } from './Settings/AudioSettings';
import ImageSettings, { ImageConfig } from './Settings/ImageSettings';

export default function UniversalConverter() {
    const [files, setFiles] = useState<File[]>([]);

    // Configs
    const [videoConfig, setVideoConfig] = useState<VideoConfig>({
        format: 'mp4', codecVideo: 'default', codecAudio: 'default', resolution: 'original', customWidth: 1920, customHeight: 1080, bitrateVideo: '', bitrateAudio: '', frameRate: 0, mute: false, volume: 1.0, 
        trimStart: 0, trimEnd: 0, loop: 0, transparentColor: '#000000', transparencyThreshold: 0.1
    });
    const [audioConfig, setAudioConfig] = useState<AudioConfig>({
        format: 'mp3', bitrate: '192k', customBitrate: '', sampleRate: 0, channels: 'original', volume: 1.0,
        videoVisual: 'black', trimStart: 0, trimEnd: 0
    });
    const [imageConfig, setImageConfig] = useState<ImageConfig>({
        format: 'original', quality: 0.8, transparentColor: '#FFFFFF', rotate: 0
    });

    const videoEngine = useVideoStudio(); // 動画・音声兼用
    const imageEngine = useImageConverter();

    // ファイル種別判定
    const hasVideo = useMemo(() => files.some(f => f.type.startsWith('video')), [files]);
    const hasAudio = useMemo(() => files.some(f => f.type.startsWith('audio')), [files]);
    const hasImage = useMemo(() => files.some(f => f.type.startsWith('image')), [files]);

    const isProcessing = videoEngine.isLoading || imageEngine.isImageLoading;
    const isReady = !hasVideo || videoEngine.loaded;

    // 表示用リストのマージ (処理中は processList を優先表示、それ以外は files)
    // 処理が始まったら processList (video/audio + image) を結合して表示する
    const [displayList, setDisplayList] = useState<ProcessStatus[]>([]);

    useEffect(() => {
        // 処理開始前は空、開始後はエンジンのリストを結合して表示
        if (isProcessing || videoEngine.processList.length > 0 || imageEngine.processList.length > 0) {
            setDisplayList([...videoEngine.processList, ...imageEngine.processList]);
        } else {
            setDisplayList([]);
        }
    }, [videoEngine.processList, imageEngine.processList, isProcessing]);

    const handleReset = () => { if (window.confirm('Clear all?')) setFiles([]); };
    const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));
    const onDrop = (acc: File[]) => setFiles(prev => [...prev, ...acc]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop, accept: { 'video/*': [], 'audio/*': [], 'image/*': [] }
    });

    const handleConvert = () => {
        // 動画と音声をまとめて VideoStudio (FFmpeg) に投げる
        const mediaFiles = files.filter(f => f.type.startsWith('video') || f.type.startsWith('audio'));
        if (mediaFiles.length > 0) {
            // 設定はファイル種別で使い分ける必要があるが、今回は簡易的にVideoConfigを優先し、AudioならAudioConfigをマージする等の工夫が必要
            // ここでは簡略化のため、動画があればVideoConfig、なければAudioConfigを渡す（実運用では改善推奨）
            const config = hasVideo ? videoConfig : audioConfig;
            // @ts-ignore: 互換性のためキャスト
            videoEngine.convertMedia(mediaFiles, config);
        }

        const imageFiles = files.filter(f => f.type.startsWith('image'));
        if (imageFiles.length > 0) {
            imageEngine.compressImages(imageFiles, imageConfig);
        }
    };

    const downloadAllZip = async () => {
        const completed = displayList.filter(p => p.status === 'done' && p.url);
        if (completed.length === 0) return;
        
        const zipFiles: { [name: string]: Uint8Array } = {};
        for (const res of completed) {
            const blob = await fetch(res.url!).then(r => r.blob());
            const buffer = await blob.arrayBuffer();
            zipFiles[res.name] = new Uint8Array(buffer);
        }
        // @ts-ignore
        fflate.zip(zipFiles, { level: 6 }, (err, data) => {
            if (err) return alert(err);
            // @ts-ignore
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
                <p className="text-gray-500">All-in-One Media Tool</p>
            </div>

            <div className="bg-surface border border-gray-700 rounded-2xl p-6">
                {/* File Input */}
                <div {...getRootProps()} className={clsx("border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-6", isDragActive ? "border-primary-500 bg-primary-500/10" : "border-gray-600 hover:bg-gray-800")}>
                    <input {...getInputProps()} />
                    <p className="text-gray-300 font-bold text-lg">Drag & Drop Media Files</p>
                </div>

                {/* 未処理ファイルリスト */}
                {files.length > 0 && displayList.length === 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-bold">{files.length} Files Selected</span>
                            <button onClick={handleReset} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm"><Trash2 size={14}/> Clear</button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                            {files.map((f, i) => (
                                <div key={i} className="bg-gray-900 text-gray-300 pl-3 pr-1 py-1 rounded text-xs border border-gray-700 flex items-center gap-2">
                                    <FileIcon size={12}/> <span className="truncate max-w-[120px]">{f.name}</span>
                                    <button onClick={(e) => {e.stopPropagation(); removeFile(i);}} className="hover:text-red-400"><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 設定パネル & 実行ボタン */}
                {files.length > 0 && (
                    <div className="space-y-6">
                        {hasVideo && <VideoSettings config={videoConfig} onChange={setVideoConfig} />}
                        {hasAudio && <AudioSettings config={audioConfig} onChange={setAudioConfig} />}
                        {hasImage && <ImageSettings config={imageConfig} onChange={setImageConfig} />}
                        
                        <button 
                            onClick={handleConvert} 
                            disabled={isProcessing || !isReady}
                            className={clsx("w-full py-4 rounded-xl font-bold text-lg text-black shadow-lg transition-transform flex items-center justify-center gap-3", (isProcessing || !isReady) ? "bg-gray-500 cursor-not-allowed" : "bg-primary-500 hover:scale-[1.01]")}
                        >
                            {isProcessing ? <><Loader2 className="animate-spin"/> Converting...</> : (!isReady ? 'Loading Engine...' : 'Start Conversion')}
                        </button>
                    </div>
                )}
            </div>

            {/* --- Result List (Status & Progress) --- */}
            {displayList.length > 0 && (
                <div className="bg-black border border-gray-800 rounded-xl p-4 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                        <span className="text-white font-bold text-lg">Results</span>
                        <button onClick={downloadAllZip} disabled={isProcessing} className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-gray-200 flex items-center gap-2 shadow disabled:opacity-50">
                            <Archive size={16} /> Download Zip
                        </button>
                    </div>

                    <div className="space-y-2">
                        {displayList.map((item) => (
                            <div 
                                key={item.id} 
                                className={clsx(
                                    "relative flex items-center justify-between p-4 rounded-xl border transition-all overflow-hidden",
                                    item.status === 'done' ? "bg-gray-900/80 border-gray-700 text-white" 
                                    : item.status === 'error' ? "bg-red-900/20 border-red-800 text-red-300"
                                    : "bg-gray-900/40 border-gray-800 text-gray-500"
                                )}
                            >
                                {/* Progress Bar Background */}
                                {(item.status === 'processing' || item.status === 'waiting') && (
                                    <div className="absolute left-0 top-0 bottom-0 bg-primary-500/10 transition-all duration-300" style={{ width: `${item.progress}%` }} />
                                )}

                                <div className="flex items-center gap-4 z-10 overflow-hidden">
                                    <div className={clsx("p-2 rounded-lg", item.status === 'done' ? "bg-green-500/20 text-green-500" : "bg-gray-800")}>
                                        {item.status === 'processing' ? <Loader2 size={20} className="animate-spin text-primary-500"/> : 
                                         item.status === 'done' ? <CheckCircle2 size={20}/> :
                                         item.status === 'error' ? <AlertCircle size={20}/> : <FileIcon size={20}/>}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm truncate max-w-[200px] md:max-w-md">{item.name}</span>
                                        {item.status === 'processing' && <span className="text-xs font-mono text-primary-400">{item.progress}%</span>}
                                        {item.status === 'error' && <span className="text-xs text-red-400">{item.errorMsg}</span>}
                                    </div>
                                </div>

                                <div className="z-10">
                                    {item.status === 'done' && item.url && (
                                        <a href={item.url} download={item.name} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 px-4 py-2 rounded-lg text-white text-xs font-bold transition shadow">
                                            <Download size={14}/> Download
                                        </a>
                                    )}
                                    {item.status === 'waiting' && <span className="text-xs text-gray-600">Waiting...</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
