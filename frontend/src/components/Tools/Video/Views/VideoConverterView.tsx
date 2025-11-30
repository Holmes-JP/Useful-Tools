import React, { useState } from 'react';
import { useVideoStudio, VideoOptions } from '@/hooks/useVideoStudio';
import { useDropzone } from 'react-dropzone';
import { Video, Download } from 'lucide-react';
import clsx from 'clsx';

export default function VideoConverterView() {
    const { isLoading, log, convertUrl, convertVideo } = useVideoStudio();
    const [file, setFile] = useState<File | null>(null);
    const [config, setConfig] = useState<VideoOptions>({
        format: 'mp4', resolution: 'original', mute: false
    });

    const onDrop = (files: File[]) => { if(files.length > 0) setFile(files[0]); };
    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'video/*': [] }, multiple: false });

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div {...getRootProps()} className="border-3 border-dashed border-gray-700 rounded-xl p-8 text-center hover:bg-gray-800 cursor-pointer">
                <input {...getInputProps()} />
                {file ? <p className="text-primary-400 font-bold">{file.name}</p> : <div className="text-gray-500 flex flex-col items-center"><Video size={32} className="mb-2"/>Drop Video</div>}
            </div>

            {file && (
                <div className="bg-surface border border-gray-700 p-6 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Format</label>
                            <select value={config.format} onChange={e => setConfig({...config, format: e.target.value as any})} className="w-full bg-gray-900 text-white rounded p-2 border border-gray-600">
                                <option value="mp4">MP4</option><option value="webm">WebM</option><option value="mp3">MP3 (Audio)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Resolution</label>
                            <select value={config.resolution} onChange={e => setConfig({...config, resolution: e.target.value as any})} className="w-full bg-gray-900 text-white rounded p-2 border border-gray-600">
                                <option value="original">Original</option><option value="1080p">1080p</option><option value="720p">720p</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={() => convertVideo(file, config)} disabled={isLoading} className="w-full bg-primary-500 text-black font-bold py-3 rounded-xl hover:bg-primary-400 disabled:opacity-50">
                        {isLoading ? 'Converting...' : 'Start Conversion'}
                    </button>
                </div>
            )}
            
            {isLoading && <div className="bg-gray-900 p-2 rounded text-xs text-green-400 font-mono truncate">{log}</div>}
            
            {convertUrl && (
                <div className="text-center">
                    <a href={convertUrl} download={`converted.${config.format}`} className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full font-bold hover:bg-green-500">
                        <Download size={20} /> Download Result
                    </a>
                </div>
            )}
        </div>
    );
}
