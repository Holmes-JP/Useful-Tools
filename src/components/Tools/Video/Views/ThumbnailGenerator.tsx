import React, { useState, useRef } from 'react';
import { useVideoStudio } from '@/hooks/useVideoStudio';
import { Image, Download } from 'lucide-react';

export default function ThumbnailGenerator() {
    const { isLoading, thumbUrl, generateThumbnail } = useVideoStudio();
    const [file, setFile] = useState<File | null>(null);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setTime(0);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) setDuration(videoRef.current.duration);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = Number(e.target.value);
        setTime(t);
        if (videoRef.current) videoRef.current.currentTime = t;
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {!file ? (
                <div className="text-center bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl p-10">
                    <label className="cursor-pointer">
                        <input type="file" accept="video/*" onChange={handleFile} className="hidden" />
                        <Image size={48} className="mx-auto mb-2 text-gray-500" />
                        <p className="text-gray-400 font-bold">Select Video</p>
                    </label>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <video 
                            ref={videoRef}
                            src={URL.createObjectURL(file)}
                            onLoadedMetadata={handleLoadedMetadata}
                            className="w-full rounded-lg border border-gray-700 bg-black"
                            controls={false}
                        />
                        <div>
                            <label className="text-xs text-gray-500 flex justify-between mb-2">
                                <span>Capture Time</span>
                                <span>{time.toFixed(1)}s / {duration.toFixed(1)}s</span>
                            </label>
                            <input 
                                type="range" min="0" max={duration} step="0.1" 
                                value={time} onChange={handleSliderChange}
                                className="w-full accent-primary-500"
                            />
                        </div>
                        <button 
                            onClick={() => generateThumbnail(file, time)}
                            disabled={isLoading}
                            className="w-full bg-primary-500 text-black font-bold py-3 rounded-xl hover:bg-primary-400 disabled:opacity-50"
                        >
                            {isLoading ? 'Capturing...' : 'Capture Thumbnail'}
                        </button>
                    </div>

                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center justify-center min-h-[200px]">
                        {thumbUrl ? (
                            <div className="text-center space-y-4">
                                <img src={thumbUrl} alt="Thumbnail" className="max-w-full max-h-64 rounded shadow-lg" />
                                <a href={thumbUrl} download={`thumbnail_${time.toFixed(0)}s.jpg`} className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-gray-200">
                                    <Download size={16} /> Download JPG
                                </a>
                            </div>
                        ) : (
                            <p className="text-gray-600 text-sm">Preview will appear here</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
