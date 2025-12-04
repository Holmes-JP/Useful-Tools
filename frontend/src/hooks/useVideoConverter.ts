import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import type { VideoConfig } from '@/components/Tools/Settings/VideoSettings';
import { getFFmpegConfig } from '@/utils/ffmpegLoader';

type AudioCodecValue = VideoConfig['audioCodec'] | 'copy';

const AUDIO_FORMATS = new Set<VideoConfig['format']>(['mp3', 'aac', 'wav', 'ogg']);
const MIME_TYPE_MAP: Partial<Record<VideoConfig['format'], string>> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    flv: 'video/x-flv',
    wmv: 'video/x-ms-wmv',
    m4v: 'video/x-m4v',
    gif: 'image/gif',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
};

const resolveAudioCodec = (format: VideoConfig['format'], selected?: AudioCodecValue) => {
    if (selected === 'copy') return 'copy';
    if (format === 'mp3') return 'libmp3lame';
    if (format === 'wav') {
        if (selected === 'pcm_s24le') return 'pcm_s24le';
        return 'pcm_s16le';
    }
    if (format === 'ogg') return selected === 'libopus' ? 'libopus' : 'libvorbis';
    if (format === 'aac') return 'aac';
    if (selected) return selected;
    return 'aac';
};

const parseTimeToSeconds = (value?: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    return Number.isFinite(num) && num >= 0 ? num : null;
};

const mapChannels = (channels?: VideoConfig['audioChannels']) => {
    if (!channels || channels === 'original') return null;
    if (channels === 'stereo') return '2';
    if (channels === 'mono') return '1';
    if (channels === '5.1') return '6';
    if (channels === '7.1') return '8';
    return null;
};

export const useVideoConverter = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [outputUrls, setOutputUrls] = useState<{name: string, url: string}[]>([]);
    const ffmpegRef = useRef<any>(new FFmpeg());
    const loadingRef = useRef(false);
    const logHandlerAttachedRef = useRef(false);

    const addLog = (msg: string) => setLog(prev => [...prev.slice(-49), msg]);

    const load = useCallback(async () => {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded || loadingRef.current) return;
        loadingRef.current = true;

        if (!logHandlerAttachedRef.current) {
            ffmpeg.on('log', (ev: any) => addLog(ev?.message ?? String(ev)));
            logHandlerAttachedRef.current = true;
        }

        try {
            addLog('Loading FFmpeg...');
            const config = getFFmpegConfig();
            await ffmpeg.load(config);
            addLog("FFmpeg loaded.");
        } catch (err: any) { 
            const msg = err?.message ?? String(err);
            addLog("Load Error: " + msg);
            throw err;
        } finally {
            loadingRef.current = false;
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const convertVideos = async (files: File[], config: VideoConfig) => {
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true); setLog([]); setOutputUrls([]);

        // Ensure engine is loaded before any file operations
        try {
            if (!ffmpeg.loaded) {
                addLog('FFmpeg not loaded, loading engine...');
                await load();
                if (!ffmpeg.loaded) throw new Error('FFmpeg failed to load');
            }
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            addLog('Load Error: ' + msg);
            setIsLoading(false);
            throw new Error(msg);
        }

        try {
            const results: {name: string, url: string}[] = [];
            const isAudioOnly = AUDIO_FORMATS.has(config.format);
            const isGif = config.format === 'gif';
            const startTime = parseTimeToSeconds(config.trimStart);
            const endTime = parseTimeToSeconds(config.trimEnd);
            const duration = endTime !== null ? Math.max(0, (startTime ?? 0) <= endTime ? endTime - (startTime ?? 0) : endTime) : null;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                addLog(`Converting ${file.name}...`);
                const ffmpeg = ffmpegRef.current;

                const inputName = `in_${i}`;
                const outName = `out_${i}.${config.format}`;
                // write file to FS
                const data = await fetchFile(file);
                await ffmpeg.writeFile(inputName, data as Uint8Array);

                const timingArgs: string[] = [];
                if (startTime !== null) timingArgs.push('-ss', String(startTime));
                timingArgs.push('-i', inputName);
                if (duration !== null && duration > 0) timingArgs.push('-t', String(duration));
                const baseArgs = [...timingArgs, '-threads', '0', '-map_metadata', '-1'];

                if (isGif) {
                    // Compression presets tuned for size reduction: fewer colors, capped fps, optional downscale.
                    const compLevel = Math.max(0, Math.min(3, Number(config.gifCompression ?? '1')));
                    const gifPresets = [
                        { maxColors: 256, dither: 'sierra2', maxFps: 15, maxWidth: null },
                        { maxColors: 192, dither: 'sierra2_4a', maxFps: 12, maxWidth: null },
                        { maxColors: 96, dither: 'bayer', maxFps: 10, maxWidth: 720 },
                        { maxColors: 48, dither: 'none', maxFps: 8, maxWidth: 480 },
                    ];
                    const preset = gifPresets[compLevel] || gifPresets[1];

                    const gifFilters: string[] = [];
                    const userFps = parseFloat(config.gifFps || '');
                    const targetFps = Number.isFinite(userFps)
                        ? Math.min(userFps, preset.maxFps)
                        : preset.maxFps;
                    if (targetFps) gifFilters.push(`fps=${targetFps}`);

                    const userWidth = config.gifWidth && config.gifWidth.trim();
                    const targetWidth = userWidth || (preset.maxWidth ? String(preset.maxWidth) : '');
                    if (targetWidth) gifFilters.push(`scale=${targetWidth}:-1:flags=lanczos`);
                    if (config.deinterlace) gifFilters.push('yadif');

                    const vfString = gifFilters.length ? gifFilters.join(',') : '';

                    const maxColors = preset.maxColors;
                    const dither = preset.dither;

                    const paletteName = `palette_${i}.png`;
                    try {
                        // 1) generate palette
                        const genArgs = [...timingArgs];
                        const paletteOpts = [`max_colors=${maxColors}`, 'stats_mode=diff'];
                        if (config.gifTransparent) paletteOpts.push('reserve_transparent=1');
                        if (vfString) genArgs.push('-vf', `${vfString},palettegen=${paletteOpts.join(':')}`);
                        else genArgs.push('-vf', `palettegen=${paletteOpts.join(':')}`);
                        genArgs.push('-y', paletteName);
                        addLog(`palettegen args: ${genArgs.join(' ')}`);
                        await ffmpeg.exec(genArgs);

                        // 2) use palette to create gif using a stable filter_complex + map output
                        // This ensures exactly one GIF video stream is produced and mapped.
                        const useArgs: string[] = [];
                        if (startTime !== null) useArgs.push('-ss', String(startTime));
                        useArgs.push('-i', inputName);
                        if (duration !== null && duration > 0) useArgs.push('-t', String(duration));
                        useArgs.push('-i', paletteName);

                        const paletteUseDither = dither === 'bayer' ? 'bayer:bayer_scale=5' : dither;
                        const filterComplex = vfString
                            ? `[0:v]${vfString}[x];[x][1:v]paletteuse=dither=${paletteUseDither}[out]`
                            : `[0:v]null[x];[x][1:v]paletteuse=dither=${paletteUseDither}[out]`;

                        useArgs.push('-filter_complex', filterComplex, '-map', '[out]');
                        useArgs.push('-loop', config.gifLoop || '0');
                        if (config.gifTransparent) useArgs.push('-gifflags', '+transdiff');
                        useArgs.push('-an', '-c:v', 'gif', '-y', outName);
                        addLog(`paletteuse args: ${useArgs.join(' ')}`);
                        // log palette file size to help diagnose compression anomalies
                        try {
                            const p = await ffmpeg.readFile(paletteName);
                            addLog(`palette size: ${p?.length ?? 0} bytes`);
                        } catch (e) {
                            addLog('Could not read generated palette file for size check');
                        }
                        await ffmpeg.exec(useArgs);
                    } catch (err: any) {
                        // fallback to simpler direct encode if palette flow fails
                        addLog('palette flow failed, falling back to direct GIF encode: ' + (err?.message || String(err)));
                        const gifArgs = [...baseArgs];
                        if (vfString) gifArgs.push('-vf', vfString);
                        gifArgs.push('-loop', config.gifLoop || '0');
                        if (config.gifTransparent) gifArgs.push('-gifflags', '+transdiff');
                        gifArgs.push('-an', '-c:v', 'gif', '-f', 'gif', outName);
                        addLog(`direct gif args: ${gifArgs.join(' ')}`);
                        await ffmpeg.exec(gifArgs);
                    } finally {
                        // cleanup palette file if exists
                        try { await ffmpeg.deleteFile(paletteName); } catch {}
                    }
                } else if (isAudioOnly) {
                    const audioArgs = [...baseArgs, '-vn'];
                    const audioCodec = resolveAudioCodec(config.format, config.audioCodec);
                    if (audioCodec) audioArgs.push('-c:a', audioCodec);
                    if (config.audioBitrate) audioArgs.push('-b:a', config.audioBitrate);
                    if (config.audioSampleRate && config.audioSampleRate !== 'original') audioArgs.push('-ar', config.audioSampleRate);
                    const channels = mapChannels(config.audioChannels);
                    if (channels) audioArgs.push('-ac', channels);

                    const audioFilters: string[] = [];
                    const volume = parseFloat(config.audioVolume || '1.0');
                    if (!Number.isNaN(volume) && volume !== 1.0) audioFilters.push(`volume=${volume}`);
                    if (config.audioNormalize) audioFilters.push('dynaudnorm');
                    const fadeIn = parseFloat(config.audioFadeIn || '');
                    if (!Number.isNaN(fadeIn) && fadeIn > 0) audioFilters.push(`afade=t=in:st=0:d=${fadeIn}`);
                    const fadeOut = parseFloat(config.audioFadeOut || '');
                    if (!Number.isNaN(fadeOut) && fadeOut > 0) {
                        const fadeStart = duration && duration > fadeOut ? duration - fadeOut : 0;
                        audioFilters.push(`afade=t=out:st=${fadeStart}:d=${fadeOut}`);
                    }
                    if (audioFilters.length) audioArgs.push('-af', audioFilters.join(','));
                    audioArgs.push('-f', config.format, outName);
                    await ffmpeg.exec(audioArgs);
                } else {
                    const videoArgs = [...baseArgs];
                    if (config.videoCodec) videoArgs.push('-c:v', config.videoCodec === 'copy' ? 'copy' : config.videoCodec);
                    if (config.videoBitrate && config.videoBitrate !== 'original') videoArgs.push('-b:v', config.videoBitrate);
                    if (config.frameRate && config.frameRate !== 'original') videoArgs.push('-r', String(config.frameRate));

                    const videoFilters: string[] = [];
                    if (config.resolution && config.resolution !== 'original') {
                        const scale = config.resolution === '2160p' ? '3840:-2'
                            : config.resolution === '1440p' ? '2560:-2'
                            : config.resolution === '1080p' ? '1920:-2'
                            : config.resolution === '720p' ? '1280:-2'
                            : config.resolution === '480p' ? '854:-2'
                            : config.resolution === '360p' ? '640:-2'
                            : '426:-2';
                        videoFilters.push(`scale=${scale}`);
                    }
                    if (config.deinterlace) videoFilters.push('yadif');
                    const brightness = parseFloat(config.brightness || '');
                    const contrast = parseFloat(config.contrast || '');
                    const saturation = parseFloat(config.saturation || '');
                    if (!Number.isNaN(brightness) || !Number.isNaN(contrast) || !Number.isNaN(saturation)) {
                        const eqParts = [];
                        if (!Number.isNaN(brightness) && brightness !== 0) eqParts.push(`brightness=${brightness}`);
                        if (!Number.isNaN(contrast) && contrast !== 0) eqParts.push(`contrast=${contrast}`);
                        if (!Number.isNaN(saturation) && saturation !== 1 && saturation !== 0) eqParts.push(`saturation=${saturation}`);
                        if (eqParts.length) videoFilters.push(`eq=${eqParts.join(':')}`);
                    }
                    if (videoFilters.length) videoArgs.push('-vf', videoFilters.join(','));
                    if (config.pixelFormat && config.pixelFormat !== 'original') videoArgs.push('-pix_fmt', config.pixelFormat);
                    if (config.format !== 'gif') videoArgs.push('-preset', 'ultrafast');

                    if (config.mute) videoArgs.push('-an');
                    else {
                        const audioCodec = resolveAudioCodec(config.format, config.audioCodec);
                        if (audioCodec) videoArgs.push('-c:a', audioCodec);
                        if (config.audioBitrate) videoArgs.push('-b:a', config.audioBitrate);
                        if (config.audioSampleRate && config.audioSampleRate !== 'original') videoArgs.push('-ar', config.audioSampleRate);
                        const channels = mapChannels(config.audioChannels);
                        if (channels) videoArgs.push('-ac', channels);
                        const volume = parseFloat(config.audioVolume || '1.0');
                        const audioFilters: string[] = [];
                        if (!Number.isNaN(volume) && volume !== 1.0) audioFilters.push(`volume=${volume}`);
                        if (config.audioNormalize) audioFilters.push('dynaudnorm');
                        if (audioFilters.length) videoArgs.push('-af', audioFilters.join(','));
                    }

                    videoArgs.push(outName);
                    await ffmpeg.exec(videoArgs);
                }

                const outData = await ffmpeg.readFile(outName);
                const mime = MIME_TYPE_MAP[config.format] || 'application/octet-stream';
                const url = URL.createObjectURL(new Blob([outData], { type: mime }));
                results.push({ name: `${file.name.split('.')[0]}.${config.format}`, url });
                // remove files from FS
                try { await ffmpeg.deleteFile(inputName); } catch {}
                try { await ffmpeg.deleteFile(outName); } catch {}
            }
            setOutputUrls(results);
            addLog("All Done!");
            return results;
        } catch (e: any) {
            const msg = e?.message ?? String(e);
            addLog("Error: " + msg);
            // rethrow so callers can handle and display proper message
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, log, outputUrls, convertVideos, load };
};
