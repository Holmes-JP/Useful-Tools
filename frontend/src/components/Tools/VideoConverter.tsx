import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import clsx from 'clsx';

export default function VideoConverter() {
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null); // エラー表示用ステート
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [log, setLog] = useState<string>("Ready to initialize...");
    const ffmpegRef = useRef(new FFmpeg());
    const messageRef = useRef<HTMLParagraphElement | null>(null);

    const load = async () => {
        const ffmpeg = ffmpegRef.current;
        
        // 【重要】React StrictMode対策: すでにロード済みなら何もしない
        if (ffmpeg.loaded) {
            setLoaded(true);
            return;
        }

        setIsLoading(true);
        const baseURL = '/ffmpeg';

        ffmpeg.on('log', ({ message }) => {
            setLog(message);
            console.log(message);
        });

        try {
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setLoaded(true);
            setLog("FFmpeg loaded successfully.");
        } catch (err: any) {
            console.error(err);
            // エラー内容を画面に表示するためにセット
            setError(err.message || "Unknown error occurred during loading.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setOutputUrl(null);
            setLog("File selected: " + file.name);
        }
    };

    const convertToMp4 = async () => {
        if (!videoFile) return;
        const ffmpeg = ffmpegRef.current;
        setIsLoading(true);
        setLog("Start converting...");

        try {
            await ffmpeg.writeFile('input', await fetchFile(videoFile));
            await ffmpeg.exec(['-i', 'input', '-preset', 'ultrafast', 'output.mp4']);
            const data = await ffmpeg.readFile('output.mp4');
            
            // 型エラー回避: anyキャストを使用
            const url = URL.createObjectURL(new Blob([(data as any)], { type: 'video/mp4' }));
            setOutputUrl(url);
            setLog("Conversion complete!");
        } catch (err) {
            console.error(err);
            setLog("Conversion failed. Check console.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Local Video Converter (WASM)</h2>
            
            {/* エラー発生時は赤枠でメッセージを表示 */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <p className="text-xs mt-2">Check console (F12) for details.</p>
                </div>
            )}

            {!loaded && !error ? (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-blue-600 font-semibold">Loading FFmpeg Core...</p>
                    <p className="text-xs text-gray-500 mt-2">初回は30MB程度のダウンロードが発生します</p>
                </div>
            ) : (
                // ロード完了後に表示されるエリア（エラー時は非表示にしたければ loaded && !error で囲む）
                loaded && (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded-lg hover:bg-gray-50 transition">
                            <input 
                                type="file" 
                                onChange={handleFileUpload} 
                                accept="video/*" 
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100 cursor-pointer"
                            />
                            {!videoFile && <p className="mt-2 text-gray-400 text-sm">動画ファイルを選択してください</p>}
                        </div>

                        <div className="bg-gray-900 text-green-400 p-4 rounded text-xs font-mono h-32 overflow-y-auto shadow-inner">
                            <p className="whitespace-pre-wrap" ref={messageRef}>{log}</p>
                        </div>

                        <button
                            onClick={convertToMp4}
                            disabled={!videoFile || isLoading}
                            className={clsx(
                                "w-full py-3 px-4 rounded font-bold text-white transition shadow",
                                !videoFile || isLoading 
                                    ? "bg-gray-400 cursor-not-allowed" 
                                    : "bg-blue-600 hover:bg-blue-700"
                            )}
                        >
                            {isLoading ? 'Processing...' : 'Convert to MP4'}
                        </button>

                        {outputUrl && (
                            <div className="text-center p-4 bg-green-50 border border-green-200 rounded animate-fade-in-up">
                                <p className="mb-2 text-green-800 font-bold">Conversion Successful!</p>
                                <a 
                                    href={outputUrl} 
                                    download="converted.mp4" 
                                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition shadow"
                                >
                                    Download MP4
                                </a>
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    );
}