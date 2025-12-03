import React, { useState } from 'react';
import { useVideoStudio } from '@/hooks/useVideoStudio';
import { Film, Download } from 'lucide-react';

export default function GifMaker() {
    // 必要なプロパティを取り出す
    const { isLoading, log, gifUrl, createGif } = useVideoStudio();
    const [file, setFile] = useState<File | null>(null);
    const [start, setStart] = useState(0);
    const [duration, setDuration] = useState(3);
    const [width, setWidth] = useState(480);
    const [fps, setFps] = useState(10);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {!file ? (
                <div className="text-center bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl p-10">
                    <label className="cursor-pointer">
                        <input type="file" accept="video/*" onChange={handleFile} className="hidden" />
                        <Film size={48} className="mx-auto mb-2 text-gray-500" />
                        <p className="text-gray-400 font-bold">Select Video</p>
                    </label>
                </div>
            ) : (
                <div className="bg-surface border border-gray-700 p-6 rounded-xl space-y-6">
                    <video src={URL.createObjectURL(file)} className="w-full max-h-64 bg-black rounded border border-gray-700" controls />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><label className="text-xs text-gray-500 block mb-1">Start (s)</label><input type="number" value={start} onChange={e => setStart(Number(e.target.value))} className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600" /></div>
                        <div><label className="text-xs text-gray-500 block mb-1">Duration (s)</label><input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600" /></div>
                        <div><label className="text-xs text-gray-500 block mb-1">Width (px)</label><input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600" /></div>
                        <div><label className="text-xs text-gray-500 block mb-1">FPS</label><input type="number" value={fps} onChange={e => setFps(Number(e.target.value))} className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600" /></div>
                    </div>

                    <button onClick={() => createGif(file, start, duration, fps, width)} disabled={isLoading} className="w-full bg-primary-500 text-black font-bold py-3 rounded-xl hover:bg-primary-400 disabled:opacity-50">
                        {isLoading ? 'Generating GIF...' : 'Create GIF'}
                    </button>
                    
                    {isLoading && <div className="text-xs text-green-400 font-mono truncate">{Array.isArray(log) ? log[log.length-1] : log}</div>}

                    {gifUrl && (
                        <div className="text-center bg-gray-900 p-4 rounded-xl">
                            <img src={gifUrl} alt="GIF" className="mx-auto mb-4 rounded max-h-64" />
                            <a href={gifUrl} download="output.gif" className="inline-flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200"><Download size={16} /> Download GIF</a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
