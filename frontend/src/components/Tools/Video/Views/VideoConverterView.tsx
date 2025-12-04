import { useState } from 'react';
import { useVideoStudio, VideoOptions } from '@/hooks/useVideoStudio';
import { useDropzone } from 'react-dropzone';
import { Video, Download } from 'lucide-react';

export default function VideoConverterView() {
    const { loaded, isLoading, log, convertUrl, convertVideo } = useVideoStudio();
    const [file, setFile] = useState<File | null>(null);
    
    const [config, setConfig] = useState<VideoConfig>({
        format: 'mp4', codecVideo: 'default', codecAudio: 'default', resolution: 'original', customWidth: 1920, customHeight: 1080, bitrateVideo: '', bitrateAudio: '', frameRate: 0, mute: false, volume: 1.0, 
        trimStart: 0, trimEnd: 0, loop: 0, transparentColor: '#000000', transparencyThreshold: 0.1
    });

    const onDrop = (files: File[]) => { if(files.length > 0) setFile(files[0]); };
    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'video/*': [] }, multiple: false });

    const handleConvert = () => { if (file) convertVideo(file, config); };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div {...getRootProps()} className="border-3 border-dashed border-gray-700 rounded-xl p-8 text-center hover:bg-gray-800 cursor-pointer">
                <input {...getInputProps()} />
                {file ? <p className="text-primary-400 font-bold">{file.name}</p> : <div className="text-gray-500 flex flex-col items-center"><Video size={32} className="mb-2"/>Drop Video</div>}
            </div>
            {file && (
                <div className="space-y-6">
                    <VideoSettings config={config} onChange={setConfig} />
                    <button onClick={handleConvert} disabled={isLoading || !loaded} className={clsx("w-full bg-primary-500 text-black font-bold py-4 rounded-xl hover:bg-primary-400 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg", isLoading && "cursor-wait")}>
                        {isLoading ? <><RefreshCw className="animate-spin"/> Processing...</> : loaded ? 'Start Conversion' : 'Loading Engine...'}
                    </button>
                </div>
            )}
            {/* Log表示: 配列か文字列かチェック */}
            {isLoading && (
                <div className="bg-gray-900 p-3 rounded font-mono text-xs text-green-400 h-32 overflow-y-auto custom-scrollbar border border-gray-800">
                    {Array.isArray(log) ? log.map((l, i) => <div key={i}>{l}</div>) : <div>{log}</div>}
                </div>
            )}
            {convertUrl && (
                <div className="text-center p-6 bg-gray-800 rounded-xl border border-gray-700">
                    <p className="text-white font-bold mb-4">Done!</p>
                    <a href={convertUrl} download={`converted.${config.format}`} className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-500 shadow-lg"><Download size={20} /> Download</a>
                </div>
            )}
        </div>
    );
}
