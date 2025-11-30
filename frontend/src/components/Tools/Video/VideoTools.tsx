import React, { useState } from 'react';
import { Video, Image, Film } from 'lucide-react';
import clsx from 'clsx';
import VideoConverterView from './Views/VideoConverterView';
import ThumbnailGenerator from './Views/ThumbnailGenerator';
import GifMaker from './Views/GifMaker';

export default function VideoTools() {
    const [tab, setTab] = useState<'convert' | 'thumb' | 'gif'>('convert');

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Video className="text-primary-500" /> Video Studio
                </h2>
                <p className="text-gray-500 text-sm">Convert, Capture, and GIF Maker</p>
            </div>

            <div className="flex justify-center gap-2 md:gap-4 overflow-x-auto pb-2">
                <button onClick={() => setTab('convert')} className={clsx("flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all", tab === 'convert' ? "bg-primary-500 text-black shadow-lg" : "bg-surface text-gray-400 hover:bg-gray-800")}>
                    <Video size={18} /> Converter
                </button>
                <button onClick={() => setTab('thumb')} className={clsx("flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all", tab === 'thumb' ? "bg-primary-500 text-black shadow-lg" : "bg-surface text-gray-400 hover:bg-gray-800")}>
                    <Image size={18} /> Thumbnail
                </button>
                <button onClick={() => setTab('gif')} className={clsx("flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all", tab === 'gif' ? "bg-primary-500 text-black shadow-lg" : "bg-surface text-gray-400 hover:bg-gray-800")}>
                    <Film size={18} /> GIF Maker
                </button>
            </div>

            <div className="min-h-[400px]">
                {tab === 'convert' && <VideoConverterView />}
                {tab === 'thumb' && <ThumbnailGenerator />}
                {tab === 'gif' && <GifMaker />}
            </div>
        </div>
    );
}
