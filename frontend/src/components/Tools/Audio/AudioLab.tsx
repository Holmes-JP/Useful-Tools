import React, { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import { useAudioLab, AudioConfig } from '@/hooks/useAudioLab';
import { Music, Play, Pause, Download, Scissors, Zap, FileAudio } from 'lucide-react';
import clsx from 'clsx';

export default function AudioLab() {
    // 修正: resetOutputを受け取る
    const { loaded, isProcessing, log, outputUrl, processAudio, resetOutput } = useAudioLab();
    
    const [file, setFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const [region, setRegion] = useState({ start: 0, end: 0 });
    const [config, setConfig] = useState<AudioConfig>({
        format: 'mp3', volume: 1.0, speed: 1.0, fadeIn: 0, fadeOut: 0
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);

    useEffect(() => {
        if (!file || !containerRef.current) return;
        const ws = WaveSurfer.create({
            container: containerRef.current, waveColor: '#4b5563', progressColor: '#84cc16', cursorColor: '#fff', barWidth: 2, barGap: 1, height: 128,
        });
        const wsRegions = RegionsPlugin.create();
        ws.registerPlugin(wsRegions);
        ws.loadBlob(file);
        ws.on('ready', () => {
            wsRegions.addRegion({ start: 0, end: ws.getDuration(), color: 'rgba(132, 204, 22, 0.2)', drag: true, resize: true });
            setRegion({ start: 0, end: ws.getDuration() });
        });
        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        wsRegions.on('region-updated', (region) => setRegion({ start: region.start, end: region.end }));
        wavesurfer.current = ws;
        return () => { ws.destroy(); };
    }, [file]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            resetOutput(); // 修正: outputUrl をリセット
        }
    };

    const togglePlay = () => wavesurfer.current?.playPause();
    const execute = () => { if (file) processAudio(file, region.start, region.end, config); };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3"><Music className="text-primary-500" /> Audio Lab</h2>
                <p className="text-gray-500 text-sm">Edit, Trim, and Enhance Audio</p>
            </div>
            {!file ? (
                <div className="border-3 border-dashed border-gray-700 rounded-xl p-16 text-center hover:bg-gray-800 transition cursor-pointer relative">
                    <input type="file" accept="audio/*" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <FileAudio size={64} className="mx-auto mb-4 text-gray-600" /><p className="text-xl font-bold text-gray-300">Drop Audio File Here</p>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 relative">
                        <div ref={containerRef} className="w-full" />
                        <div className="flex justify-center mt-4 gap-4">
                            <button onClick={togglePlay} className="bg-primary-500 text-black p-3 rounded-full hover:bg-primary-400 transition shadow-lg">{isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button>
                            <div className="bg-gray-800 px-4 py-2 rounded-lg text-white font-mono text-sm flex items-center gap-2 border border-gray-700"><Scissors size={14} className="text-gray-400" /><span>{region.start.toFixed(2)}s - {region.end.toFixed(2)}s</span></div>
                        </div>
                    </div>
                    <div className="bg-surface border border-gray-700 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div><label className="text-xs text-gray-500 block mb-1">Output Format</label><select value={config.format} onChange={e => setConfig({...config, format: e.target.value as any})} className="w-full bg-gray-900 text-white rounded p-2 border border-gray-600"><option value="mp3">MP3</option><option value="wav">WAV</option><option value="aac">AAC</option></select></div>
                            <div><label className="text-xs text-gray-500 block mb-1 flex justify-between"><span>Volume</span><span>{Math.round(config.volume * 100)}%</span></label><input type="range" min="0" max="2" step="0.1" value={config.volume} onChange={e => setConfig({...config, volume: Number(e.target.value)})} className="w-full accent-primary-500" /></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-xs text-gray-500 block mb-1 flex justify-between"><span>Playback Speed</span><span>x{config.speed}</span></label><input type="range" min="0.5" max="2.0" step="0.1" value={config.speed} onChange={e => setConfig({...config, speed: Number(e.target.value)})} className="w-full accent-primary-500" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs text-gray-500 block mb-1">Fade In (s)</label><input type="number" min="0" max="10" value={config.fadeIn} onChange={e => setConfig({...config, fadeIn: Number(e.target.value)})} className="w-full bg-gray-900 text-white rounded p-2 border border-gray-600" /></div>
                                <div><label className="text-xs text-gray-500 block mb-1">Fade Out (s)</label><input type="number" min="0" max="10" value={config.fadeOut} onChange={e => setConfig({...config, fadeOut: Number(e.target.value)})} className="w-full bg-gray-900 text-white rounded p-2 border border-gray-600" /></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <button onClick={execute} disabled={isProcessing || !loaded} className={clsx("px-10 py-4 rounded-full font-bold text-lg shadow-xl transition flex items-center gap-2", isProcessing ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-primary-500 to-primary-400 text-black hover:scale-105")}>
                            {isProcessing ? 'Processing...' : loaded ? 'Export Audio' : 'Loading Engine...'} {!isProcessing && <Zap size={20} />}
                        </button>
                        {isProcessing && <p className="text-xs text-green-400 font-mono animate-pulse">{log}</p>}
                        {outputUrl && (
                            <div className="animate-fade-in-up bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-4">
                                <audio src={outputUrl} controls className="h-10" />
                                <a href={outputUrl} download={`edited.${config.format}`} className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 flex items-center gap-2"><Download size={16} /> Save</a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
