import { useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import { v4 as uuidv4 } from 'uuid';
import { FileAudio, Repeat, MapPin, Music, Pause, Play, Scissors, StopCircle, Trash2, Upload, Volume2, VolumeX, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

const formatBytes = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const toSecondsLabel = (seconds: number) => seconds.toFixed(2) + 's';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sliceBuffer = (buffer: AudioBuffer, startSec: number, endSec: number) => {
    const start = clamp(startSec, 0, buffer.duration);
    const end = clamp(endSec, 0, buffer.duration);
    const sampleRate = buffer.sampleRate;
    const startSample = Math.floor(start * sampleRate);
    const endSample = Math.floor(end * sampleRate);
    const length = Math.max(0, endSample - startSample);
    const sliced = new AudioBuffer({ length, numberOfChannels: buffer.numberOfChannels, sampleRate });
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const source = buffer.getChannelData(ch).slice(startSample, endSample);
        sliced.copyToChannel(source, ch, 0);
    }
    return sliced;
};

type Clip = {
    id: string;
    buffer: AudioBuffer;
    label: string;
};

const concatBuffers = (buffers: AudioBuffer[]) => {
    if (buffers.length === 0) throw new Error('No buffers to concat');
    const sampleRate = buffers[0].sampleRate;
    const numChannels = buffers.reduce((max, b) => Math.max(max, b.numberOfChannels), 1);
    const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
    const out = new AudioBuffer({ length: totalLength, numberOfChannels: numChannels, sampleRate });
    let offset = 0;
    for (const buf of buffers) {
        for (let ch = 0; ch < numChannels; ch++) {
            const dest = out.getChannelData(ch);
            if (ch < buf.numberOfChannels) {
                dest.set(buf.getChannelData(ch), offset);
            } else {
                dest.fill(0, offset, offset + buf.length);
            }
        }
        offset += buf.length;
    }
    return out;
};

const applyGainRange = (buffer: AudioBuffer, startSec: number, endSec: number, gain: number) => {
    const sampleRate = buffer.sampleRate;
    const startSample = Math.floor(startSec * sampleRate);
    const endSample = Math.min(buffer.length, Math.floor(endSec * sampleRate));
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = startSample; i < endSample; i++) data[i] *= gain;
    }
};

const applyFadeRange = (buffer: AudioBuffer, startSec: number, endSec: number, type: 'in' | 'out') => {
    const sampleRate = buffer.sampleRate;
    const startSample = Math.floor(startSec * sampleRate);
    const endSample = Math.min(buffer.length, Math.floor(endSec * sampleRate));
    const length = Math.max(1, endSample - startSample);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = startSample; i < endSample; i++) {
            const t = (i - startSample) / length;
            const env = type === 'in' ? t : 1 - t;
            data[i] *= env;
        }
    }
};

const encodeWav = (buffer: AudioBuffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    let offset = 0;
    writeString(offset, 'RIFF'); offset += 4;
    view.setUint32(offset, 36 + dataLength, true); offset += 4;
    writeString(offset, 'WAVE'); offset += 4;
    writeString(offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, format, true); offset += 2;
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * blockAlign, true); offset += 4;
    view.setUint16(offset, blockAlign, true); offset += 2;
    view.setUint16(offset, bitDepth, true); offset += 2;
    writeString(offset, 'data'); offset += 4;
    view.setUint32(offset, dataLength, true); offset += 4;

    // Interleave and write samples
    let idx = 44;
    const frameCount = buffer.length;
    const channelData = Array.from({ length: numChannels }, (_, ch) => buffer.getChannelData(ch));
    for (let i = 0; i < frameCount; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
            view.setInt16(idx, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            idx += 2;
        }
    }
    return arrayBuffer;
};

export default function AudioEditor() {
    const waveformRef = useRef<HTMLDivElement | null>(null);
    const timelineRef = useRef<HTMLDivElement | null>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);
    const selectionRegionRef = useRef<string | null>(null);
    const selectionRef = useRef<{ start: number; end: number } | null>(null);
    const markerIdsRef = useRef<Set<string>>(new Set());

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [clips, setClips] = useState<Clip[]>([]);
    const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
    const [selectionRegionId, setSelectionRegionId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [zoom, setZoom] = useState(80);
    const [volume, setVolume] = useState(1);
    const [looping, setLooping] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [markers, setMarkers] = useState<{ id: string; label: string; time: number; regionId: string }[]>([]);
    const [rangeStart, setRangeStart] = useState('0');
    const [rangeEnd, setRangeEnd] = useState('0');
    const [minZoom, setMinZoom] = useState(20);
    const maxZoom = 800;
    const [working, setWorking] = useState(false);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'audio/*': ['.wav', '.mp3', '.ogg', '.m4a'] },
        multiple: false,
        maxSize: 200 * 1024 * 1024,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles && acceptedFiles[0]) {
                setSelectedFile(acceptedFiles[0]);
            }
        }
    });

    useEffect(() => {
        if (!waveformRef.current) return;

        const options = {
            container: waveformRef.current,
            waveColor: '#94a3b8',
            progressColor: '#22d3ee',
            cursorColor: '#facc15',
            height: 180,
            barWidth: 2,
            minPxPerSec: zoom,
            dragToSeek: true,
            autoScroll: true,
        };

        const ws = WaveSurfer.create(options);
        const regions = RegionsPlugin.create();
        (regions as any).enableDragSelection?.({
            color: 'rgba(56,189,248,0.18)'
        });
        ws.registerPlugin(regions);
        const timeline = TimelinePlugin.create({
            container: timelineRef.current as HTMLElement,
            height: 20,
        });
        ws.registerPlugin(timeline);

        wavesurferRef.current = ws;
        regionsPluginRef.current = regions;

        ws.on('decode', () => { /* decode fired when audio is ready */ });
        ws.on('ready', () => {
            setDuration(ws.getDuration());
            setIsPlaying(false);
            setCurrentTime(0);
            const decoded = ws.getDecodedData() || null;
            setAudioBuffer(decoded);
            if (decoded) {
                setClips([{ id: uuidv4(), buffer: decoded, label: 'Clip 1' }]);
            }
            computeMinZoom();
        });
        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('timeupdate', (t) => setCurrentTime(t));
        ws.on('finish', () => {
            setIsPlaying(false);
            if (looping) {
                if (selectionRef.current) {
                    ws.play(selectionRef.current.start, selectionRef.current.end);
                } else {
                    ws.play();
                }
            }
        });

        const handleRegionChange = (region: any) => {
            if (markerIdsRef.current.has(region.id)) return;
            if (selectionRegionRef.current && selectionRegionRef.current !== region.id) {
                (regions as any).removeRegion?.(selectionRegionRef.current);
            }
            setSelection({ start: region.start, end: region.end });
            setSelectionRegionId(region.id);
            selectionRef.current = { start: region.start, end: region.end };
            selectionRegionRef.current = region.id;
        };

        regions.on('region-created', handleRegionChange);
        regions.on('region-updated', handleRegionChange);
        regions.on('region-removed', (region) => {
            if (region.id === selectionRegionRef.current) {
                setSelection(null);
                selectionRef.current = null;
                setSelectionRegionId(null);
                selectionRegionRef.current = null;
            }
            if (markerIdsRef.current.has(region.id)) {
                markerIdsRef.current.delete(region.id);
            }
        });

        return () => {
            ws.destroy();
        };
    }, []);

    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws || !selectedFile) return;
        setWorking(true);
        ws.loadBlob(selectedFile).finally(() => setWorking(false));
    }, [selectedFile]);

    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws) return;
        const mediaEl = (ws as any).getMediaElement?.() || (ws as any).media || (ws as any).backend?.media;
        const maxVol = mediaEl instanceof HTMLMediaElement ? 1 : 2;
        const vol = clamp(volume, 0, maxVol);
        try {
            ws.setVolume(vol);
            // For WebAudio backend, allow boosting above 1 by driving the gain node directly
            const backend: any = (ws as any).backend;
            const gainNode = backend?.gainNode;
            const ctx: AudioContext | undefined = backend?.ac;
            if (gainNode?.gain && ctx && !(mediaEl instanceof HTMLMediaElement)) {
                gainNode.gain.setValueAtTime(vol, ctx.currentTime);
            }
        } catch (e) {
            // Fallback for media backends that reject >1
            ws.setVolume(Math.min(vol, 1));
        }
    }, [volume]);

    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws || !audioBuffer) return;
        ws.zoom(zoom);
    }, [zoom, audioBuffer]);

    useEffect(() => {
        computeMinZoom();
    }, [audioBuffer]);

    useEffect(() => {
        if (!audioBuffer) return;
        const handler = () => computeMinZoom();
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [audioBuffer]);

    useEffect(() => {
        const el = waveformRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (!audioBuffer) return;
            if (e.ctrlKey || e.metaKey) return;
            e.preventDefault();
            const ws = wavesurferRef.current;
            if (!ws) return;
            if (e.shiftKey) {
                // Shift+wheel: pan/scroll horizontally without double scroll
                const dur = ws.getDuration() || audioBuffer.duration || 1;
                const deltaSec = (e.deltaY + e.deltaX) * (dur / 4000);
                const next = clamp(ws.getCurrentTime() + deltaSec, 0, dur);
                ws.setTime(next);
                return;
            }
            // wheel: zoom centered around cursor position
            const factor = e.deltaY < 0 ? 1.08 : 0.92;
            setZoom(z => clamp(Math.round(z * factor), minZoom, maxZoom));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [audioBuffer, minZoom]);

    const computeMinZoom = () => {
        if (!audioBuffer || !waveformRef.current) return;
        const rect = waveformRef.current.getBoundingClientRect();
        const width = rect.width || 1;
        const durationSec = Math.max(0.01, audioBuffer.duration);
        const pxPerSec = Math.max(10, Math.ceil(width / durationSec));
        setMinZoom(pxPerSec);
        setZoom(z => clamp(z, pxPerSec, maxZoom));
    };

    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws || !audioBuffer) return;
        ws.setPlaybackRate(playbackRate);
    }, [playbackRate, audioBuffer]);

    const clearSelection = () => {
        const regionsAny = regionsPluginRef.current as any;
        if (selectionRegionId && regionsAny?.removeRegion) {
            regionsAny.removeRegion(selectionRegionId);
        }
        setSelection(null);
        setSelectionRegionId(null);
        selectionRegionRef.current = null;
        selectionRef.current = null;
    };

    const setSelectionRegion = (start: number, end: number) => {
        const regionsAny = regionsPluginRef.current as any;
        const ws = wavesurferRef.current as any;
        if (!regionsAny?.addRegion || !ws) return;
        const s = clamp(start, 0, duration || 0);
        const e = clamp(end, s + 0.01, duration || 0.01);
        if (selectionRegionRef.current) {
            regionsAny.removeRegion(selectionRegionRef.current);
        }
        const region = regionsAny.addRegion({
            start: s,
            end: e,
            color: 'rgba(56,189,248,0.18)',
        });
        selectionRegionRef.current = region.id;
        selectionRef.current = { start: s, end: e };
        setSelection({ start: s, end: e });
        setSelectionRegionId(region.id);
        ws.setTime(s);
    };

    const rebuildFromBuffer = (buffer: AudioBuffer, nextClips?: Clip[]) => {
        const wsAny = wavesurferRef.current as any;
        if (!wsAny) return;
        setWorking(true);
        setAudioBuffer(buffer);
        setDuration(buffer.duration);
        setClips(nextClips ?? [{ id: uuidv4(), buffer, label: 'Clip 1' }]);
        clearSelection();
        const loadPromise = wsAny.loadDecodedBuffer ? wsAny.loadDecodedBuffer(buffer) : Promise.resolve();
        Promise.resolve(loadPromise).finally(() => setWorking(false));
    };

    const applyClips = (nextClips: Clip[]) => {
        if (nextClips.length === 0) return;
        const merged = concatBuffers(nextClips.map(c => c.buffer));
        rebuildFromBuffer(merged, nextClips);
    };

    const trimToSelection = () => {
        if (!audioBuffer || !selection) return;
        const trimmed = sliceBuffer(audioBuffer, selection.start, selection.end);
        rebuildFromBuffer(trimmed);
    };

    const normalize = () => {
        if (!audioBuffer) return;
        const range = selection ?? { start: 0, end: audioBuffer.duration };
        const startSample = Math.floor(range.start * audioBuffer.sampleRate);
        const endSample = Math.min(audioBuffer.length, Math.floor(range.end * audioBuffer.sampleRate));
        let peak = 0;
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const data = audioBuffer.getChannelData(ch);
            for (let i = startSample; i < endSample; i++) {
                peak = Math.max(peak, Math.abs(data[i]));
            }
        }
        if (peak === 0) return;
        const gain = Math.min((1 / peak) * 0.98, 10);
        const normalized = new AudioBuffer({ length: audioBuffer.length, numberOfChannels: audioBuffer.numberOfChannels, sampleRate: audioBuffer.sampleRate });
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            normalized.copyToChannel(audioBuffer.getChannelData(ch), ch);
        }
        applyGainRange(normalized, range.start, range.end, gain);
        rebuildFromBuffer(normalized);
    };

    const applyFade = (type: 'in' | 'out') => {
        if (!audioBuffer) return;
        const range = selection ?? { start: 0, end: audioBuffer.duration };
        const faded = new AudioBuffer({ length: audioBuffer.length, numberOfChannels: audioBuffer.numberOfChannels, sampleRate: audioBuffer.sampleRate });
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            faded.copyToChannel(audioBuffer.getChannelData(ch), ch);
        }
        applyFadeRange(faded, range.start, range.end, type);
        rebuildFromBuffer(faded);
    };

    const exportSelection = () => {
        if (!audioBuffer) return;
        const range = selection ?? { start: 0, end: audioBuffer.duration };
        const sliced = sliceBuffer(audioBuffer, range.start, range.end);
        const wav = encodeWav(sliced);
        const blob = new Blob([wav], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const baseName = selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'audio';
        a.download = `${baseName}_export.wav`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const addMarker = () => {
        const ws = wavesurferRef.current;
        const regionsAny = regionsPluginRef.current as any;
        if (!ws || !regionsAny?.addRegion) return;
        const time = ws.getCurrentTime();
        const markerId = uuidv4();
        const region = regionsAny.addRegion({
            id: markerId,
            start: time,
            end: time + 0.01,
            drag: false,
            resize: false,
            color: 'rgba(94,234,212,0.35)',
        });
        markerIdsRef.current.add(region.id);
        setMarkers(prev => [...prev, { id: markerId, label: `Marker ${prev.length + 1}`, time, regionId: region.id }]);
    };

    const jumpToMarker = (time: number) => {
        const ws = wavesurferRef.current;
        if (!ws) return;
        ws.setTime(time);
        ws.play();
    };

    const removeMarker = (id: string) => {
        const regionsAny = regionsPluginRef.current as any;
        setMarkers(prev => prev.filter(m => m.id !== id));
        markerIdsRef.current.delete(id);
        regionsAny?.removeRegion?.(id);
    };

    const splitAtCursor = () => {
        if (!audioBuffer) return;
        const splitPoint = selection?.start ?? currentTime;
        if (splitPoint <= 0 || splitPoint >= audioBuffer.duration) return;
        const first = sliceBuffer(audioBuffer, 0, splitPoint);
        const second = sliceBuffer(audioBuffer, splitPoint, audioBuffer.duration);
        const newClips: Clip[] = [
            { id: uuidv4(), buffer: first, label: 'Clip A' },
            { id: uuidv4(), buffer: second, label: 'Clip B' },
        ];
        applyClips(newClips);
    };

    const moveClip = (id: string, direction: 'up' | 'down') => {
        const idx = clips.findIndex(c => c.id === id);
        if (idx === -1) return;
        const swapWith = direction === 'up' ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= clips.length) return;
        const next = [...clips];
        [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
        applyClips(next);
    };

    const deleteClip = (id: string) => {
        const next = clips.filter(c => c.id !== id);
        if (next.length === 0) return;
        applyClips(next);
    };

    const deleteSelection = () => {
        if (!audioBuffer || !selection) return;
        // Prevent deleting everything
        if (selection.start <= 0 && selection.end >= audioBuffer.duration) return;
        const parts: AudioBuffer[] = [];
        if (selection.start > 0) parts.push(sliceBuffer(audioBuffer, 0, selection.start));
        if (selection.end < audioBuffer.duration) parts.push(sliceBuffer(audioBuffer, selection.end, audioBuffer.duration));
        if (parts.length === 0) return;
        const newClips: Clip[] = parts.map((buf, idx) => ({ id: uuidv4(), buffer: buf, label: `Clip ${idx + 1}` }));
        const merged = concatBuffers(parts);
        rebuildFromBuffer(merged, newClips);
    };

    const hasAudio = !!audioBuffer;

    const selectionLabel = useMemo(() => {
        if (!selection) return 'None';
        return `${selection.start.toFixed(2)}s - ${selection.end.toFixed(2)}s (${(selection.end - selection.start).toFixed(2)}s)`;
    }, [selection]);

    useEffect(() => {
        if (selection) {
            setRangeStart(selection.start.toFixed(2));
            setRangeEnd(selection.end.toFixed(2));
        } else if (audioBuffer) {
            setRangeStart('0');
            setRangeEnd(audioBuffer.duration.toFixed(2));
        }
    }, [selection, audioBuffer]);

    return (
        <div className="space-y-8 p-4 text-white">
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                    <Music className="text-primary-400" size={32} />
                    <h2 className="text-3xl font-bold">Audio Editor</h2>
                </div>
                <p className="text-sm text-gray-400">Drag & drop or choose an audio file to edit, trim, fade, loop, and export directly in your browser.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition-all bg-slate-900/70 backdrop-blur-sm border-gray-700 hover:border-primary-500/60 hover:bg-slate-900/90 ${isDragActive ? 'border-primary-500 bg-primary-500/10' : ''}`}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-3">
                            <Upload className="text-primary-400" size={36} />
                            <p className="text-lg font-semibold">{isDragActive ? 'Release to load your audio' : 'Drag & drop audio here'}</p>
                            <p className="text-gray-400 text-sm">WAV / MP3 / OGG / M4A • up to ~200MB • click to browse</p>
                        </div>
                    </div>

                    <div className="bg-black/40 border border-gray-800 rounded-2xl p-4 space-y-4 shadow-lg shadow-black/30">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <span className="text-gray-500">Selection:</span>
                                <span className="font-semibold text-white">{selectionLabel}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>Pos: {toSecondsLabel(currentTime)}</span>
                                <span>Len: {toSecondsLabel(duration)}</span>
                            </div>
                        </div>

                        <div className="bg-slate-900/70 border border-gray-800 rounded-xl p-3">
                            <div ref={waveformRef} className="w-full" />
                            <div ref={timelineRef} className="mt-2 text-xs text-gray-400" />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                className="px-3 py-2 rounded-lg bg-primary-500/90 text-black font-semibold flex items-center gap-2 hover:brightness-110 disabled:opacity-50"
                                onClick={() => wavesurferRef.current?.playPause()}
                                disabled={!hasAudio || working}
                            >
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />} {isPlaying ? 'Pause' : 'Play'}
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg bg-white/5 border border-gray-700 text-white flex items-center gap-2 hover:bg-white/10 disabled:opacity-50"
                                onClick={() => {
                                    wavesurferRef.current?.stop();
                                    setIsPlaying(false);
                                }}
                                disabled={!hasAudio}
                            >
                                <StopCircle size={16} /> Stop
                            </button>
                            <button
                                className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${looping ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-white/5 border-gray-700 text-white'} hover:bg-white/10 disabled:opacity-50`}
                                onClick={() => setLooping(!looping)}
                                disabled={!hasAudio}
                            >
                                <Repeat size={16} /> Loop
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg bg-white/5 border border-gray-700 text-white flex items-center gap-2 hover:bg-white/10 disabled:opacity-50"
                                onClick={clearSelection}
                                disabled={!selection}
                            >
                                <Trash2 size={14} /> Clear Selection
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                            <label className="flex items-center gap-3 text-sm text-gray-300">
                                <span className="w-20 text-gray-400">Zoom</span>
                                <input
                                    type="range"
                                    min={20}
                                    max={800}
                                    step={10}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-xs text-gray-400 w-20">{zoom}px/s</span>
                            </label>
                            <label className="flex items-center gap-3 text-sm text-gray-300">
                                <span className="w-20 text-gray-400">Speed</span>
                                <input
                                    type="range"
                                    min={0.5}
                                    max={2.0}
                                    step={0.05}
                                    value={playbackRate}
                                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-xs text-gray-400 w-12">{playbackRate.toFixed(2)}x</span>
                            </label>
                            <label className="flex items-center gap-3 text-sm text-gray-300">
                                <span className="w-20 text-gray-400">Volume</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={2}
                                    step={0.05}
                                    value={volume}
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-xs text-gray-400 w-12">{volume.toFixed(2)}x</span>
                            </label>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3 bg-slate-900/50 border border-gray-800 rounded-xl p-3">
                            <div className="flex flex-col gap-2 text-sm text-gray-300">
                                <label className="text-xs text-gray-400">Start (s)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.05}
                                    value={rangeStart}
                                    onChange={(e) => setRangeStart(e.target.value)}
                                    className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-white"
                                />
                            </div>
                            <div className="flex flex-col gap-2 text-sm text-gray-300">
                                <label className="text-xs text-gray-400">End (s)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.05}
                                    value={rangeEnd}
                                    onChange={(e) => setRangeEnd(e.target.value)}
                                    className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-white"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 items-end">
                                <button
                                    className="px-3 py-2 rounded-lg bg-white/5 border border-gray-700 hover:bg-white/10 text-xs text-white disabled:opacity-50"
                                    disabled={!hasAudio}
                                    onClick={() => {
                                        const start = parseFloat(rangeStart) || 0;
                                        const end = parseFloat(rangeEnd) || duration || 0;
                                        setSelectionRegion(start, end);
                                    }}
                                >
                                    Set Range
                                </button>
                                <button
                                    className="px-3 py-2 rounded-lg bg-primary-500/80 text-black text-xs font-semibold hover:brightness-110 disabled:opacity-50"
                                    disabled={!hasAudio}
                                    onClick={() => {
                                        const start = parseFloat(rangeStart) || 0;
                                        const end = parseFloat(rangeEnd) || duration || 0;
                                        setSelectionRegion(start, end);
                                        trimToSelection();
                                    }}
                                >
                                    Trim Range
                                </button>
                                <button
                                    className="px-3 py-2 rounded-lg bg-white/5 border border-gray-700 hover:bg-white/10 text-xs text-white disabled:opacity-50"
                                    disabled={!hasAudio}
                                    onClick={() => {
                                        const start = parseFloat(rangeStart) || 0;
                                        const end = parseFloat(rangeEnd) || duration || 0;
                                        setSelectionRegion(start, end);
                                        exportSelection();
                                    }}
                                >
                                    Export Range
                                </button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                            <button
                                onClick={trimToSelection}
                                disabled={!selection || working}
                                className="px-3 py-2 rounded-lg bg-white/5 border border-gray-700 hover:bg-white/10 flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                <Scissors size={14} /> Trim to Selection
                            </button>
                            <button
                                onClick={deleteSelection}
                                disabled={!selection || working}
                                className="px-3 py-2 rounded-lg bg-white/5 border border-gray-700 hover:bg-white/10 flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                <Trash2 size={14} /> Delete Selection
                            </button>
                            <button
                                onClick={normalize}
                                disabled={!hasAudio || working}
                                className="px-3 py-2 rounded-lg bg-white/5 border border-gray-700 hover:bg-white/10 flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                <Volume2 size={14} /> Normalize
                            </button>
                            <button
                                onClick={() => applyFade('in')}
                                disabled={!hasAudio || working}
                                className="px-3 py-2 rounded-lg bg-white/5 border border-gray-700 hover:bg-white/10 flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                Fade In
                            </button>
                            <button
                                onClick={() => applyFade('out')}
                                disabled={!hasAudio || working}
                                className="px-3 py-2 rounded-lg bg-white/5 border border-gray-700 hover:bg-white/10 flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                Fade Out
                            </button>
                            <button
                                onClick={exportSelection}
                                disabled={!hasAudio || working}
                                className="px-3 py-2 rounded-lg bg-primary-500/90 text-black font-semibold hover:brightness-110 flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                Export Selection
                            </button>
                            <button
                                onClick={splitAtCursor}
                                disabled={!hasAudio}
                                className="px-3 py-2 rounded-lg bg-white/5 border border-gray-700 hover:bg-white/10 flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                Split (coming soon)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-900/70 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-lg shadow-black/30">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                            <Sparkles className="text-primary-400" /> Import checklist
                        </h3>
                        <ul className="text-sm text-gray-300 space-y-3">
                            <li>✁ESupported formats: WAV, MP3, OGG, M4A</li>
                            <li>✁EFiles stay in-browser  Esafe for sensitive audio</li>
                            <li>✁EAim for under 100MB for smoother waveform editing</li>
                        </ul>
                        {selectedFile && (
                            <div className="border-t border-gray-800 pt-4 text-sm text-gray-300 space-y-1">
                                <p className="font-semibold text-white flex items-center gap-2">
                                    <FileAudio className="text-primary-400" size={16} />
                                    {selectedFile.name}
                                </p>
                                <p className="text-gray-400 text-xs">
                                    {formatBytes(selectedFile.size)} {selectedFile.type ? `• ${selectedFile.type}` : ''}
                                </p>
                            </div>
                        )}
                        <div className="border-t border-gray-800 pt-4 text-sm text-gray-400 space-y-2">
                            <p className="font-semibold text-white">Phase 1 & 2 ready</p>
                            <p>Waveform, zoom, selection, trim, normalize, fades, loop, markers, export selection, and playback speed are live.</p>
                        </div>
                    </div>

                    <div className="bg-black/40 border border-gray-800 rounded-2xl p-4 space-y-3 shadow-lg shadow-black/30">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center gap-2 text-white text-sm">
                                <MapPin size={16} className="text-emerald-400" /> Markers
                            </h4>
                            <button
                                className="px-3 py-2 rounded-lg bg-white/5 border border-gray-700 hover:bg-white/10 text-xs disabled:opacity-50"
                                onClick={addMarker}
                                disabled={!hasAudio}
                            >
                                Add Marker
                            </button>
                        </div>
                        {markers.length === 0 ? (
                            <p className="text-xs text-gray-500">No markers yet. Add one at the playhead.</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {markers.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between bg-slate-900/60 border border-gray-800 rounded-lg px-3 py-2 text-sm">
                                        <div>
                                            <p className="text-white font-semibold">{m.label}</p>
                                            <p className="text-xs text-gray-400">{toSecondsLabel(m.time)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="text-primary-400 text-xs hover:underline" onClick={() => jumpToMarker(m.time)}>Jump</button>
                                            <button className="text-red-400 text-xs hover:underline" onClick={() => removeMarker(m.id)}>Remove</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-black/40 border border-gray-800 rounded-2xl p-4 space-y-3 shadow-lg shadow-black/30">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-white text-sm">Clips</h4>
                            <span className="text-xs text-gray-400">{clips.length} total</span>
                        </div>
                        {clips.length === 0 ? (
                            <p className="text-xs text-gray-500">Load audio and use Split to create clips.</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {clips.map((clip, idx) => (
                                    <div key={clip.id} className="flex items-center justify-between bg-slate-900/60 border border-gray-800 rounded-lg px-3 py-2 text-sm">
                                        <div>
                                            <p className="text-white font-semibold">{clip.label || `Clip ${idx + 1}`}</p>
                                            <p className="text-xs text-gray-400">{toSecondsLabel(clip.buffer.duration)}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                className="p-1 text-gray-400 hover:text-white disabled:opacity-40"
                                                onClick={() => moveClip(clip.id, 'up')}
                                                disabled={idx === 0}
                                                title="Move up"
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                            <button
                                                className="p-1 text-gray-400 hover:text-white disabled:opacity-40"
                                                onClick={() => moveClip(clip.id, 'down')}
                                                disabled={idx === clips.length - 1}
                                                title="Move down"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                            <button
                                                className="p-1 text-gray-400 hover:text-red-400 disabled:opacity-40"
                                                onClick={() => deleteClip(clip.id)}
                                                disabled={clips.length <= 1}
                                                title="Delete clip"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-500">Split divides the current audio at the playhead (or selection start) into multiple clips.</p>
                    </div>

                    <div className="bg-black/30 border border-dashed border-gray-800 rounded-xl p-3 text-xs text-gray-400 space-y-1">
                        <div className="flex items-center gap-2 text-amber-300 font-semibold">
                            <VolumeX size={14} /> Phase 3 preview
                        </div>
                        <p>Multi-clip editing, split/move, EQ, and effect chain UI will be layered on this foundation. Split button above is reserved for the upcoming clip workflow.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
