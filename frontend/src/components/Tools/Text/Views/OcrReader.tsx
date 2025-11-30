import React, { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { useDropzone } from 'react-dropzone';
import { ScanText, Copy, Loader2, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';

export default function OcrReader() {
    const [text, setText] = useState('');
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        
        const file = acceptedFiles[0];
        setPreview(URL.createObjectURL(file));
        setIsProcessing(true);
        setText('');
        setProgress(0);

        const worker = await createWorker({
            logger: m => {
                if (m.status === 'recognizing text') {
                    setProgress(Math.round(m.progress * 100));
                    setStatus(`Recognizing... ${Math.round(m.progress * 100)}%`);
                } else {
                    setStatus(m.status);
                }
            }
        });

        try {
            // 日本語と英語に対応
            await worker.loadLanguage('eng+jpn');
            await worker.initialize('eng+jpn');
            const { data: { text } } = await worker.recognize(file);
            setText(text);
            setStatus('Completed!');
        } catch (err) {
            setStatus('Error occurred.');
            console.error(err);
        } finally {
            await worker.terminate();
            setIsProcessing(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop, 
        accept: { 'image/*': [] },
        multiple: false 
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 左側: 画像アップロード */}
                <div className="space-y-4">
                    <div {...getRootProps()} className={clsx("border-3 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all h-64 flex flex-col items-center justify-center relative overflow-hidden", isDragActive ? "border-primary-500 bg-primary-500/10" : "border-gray-700 hover:bg-gray-800")}>
                        <input {...getInputProps()} />
                        {preview ? (
                            <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain bg-black/50 p-2" />
                        ) : (
                            <div className="text-gray-400">
                                <ImageIcon size={48} className="mx-auto mb-2" />
                                <p className="font-bold">Drop Image for OCR</p>
                                <p className="text-xs text-gray-500 mt-1">Supports English & Japanese</p>
                            </div>
                        )}
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
                                <Loader2 size={48} className="text-primary-500 animate-spin mb-2" />
                                <p className="text-white font-bold">{status}</p>
                                <div className="w-1/2 h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 右側: 結果テキスト */}
                <div className="bg-surface border border-gray-700 p-4 rounded-xl flex flex-col h-64">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-primary-400 font-bold flex items-center gap-2">
                            <ScanText size={18} /> Result
                        </h3>
                        <button onClick={() => navigator.clipboard.writeText(text)} disabled={!text} className="text-gray-400 hover:text-white disabled:opacity-30 transition">
                            <Copy size={18} />
                        </button>
                    </div>
                    <textarea 
                        value={text} 
                        readOnly 
                        className="flex-1 w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white font-mono text-sm resize-none focus:outline-none"
                        placeholder="Extracted text will appear here..."
                    />
                </div>
            </div>
        </div>
    );
}
