import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useArchiver } from '@/hooks/useArchiver';
import { Archive, Download, FileArchive, File as FileIcon } from 'lucide-react';
import clsx from 'clsx';

export default function ArchiverView() {
    const { isArchiving, archiveLog, extractedFiles, error, createZip, unzip } = useArchiver();
    const [mode, setMode] = useState<'compress' | 'extract'>('compress');
    const [files, setFiles] = useState<File[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(acceptedFiles);
        if (mode === 'extract' && acceptedFiles.length > 0) {
            unzip(acceptedFiles[0]);
        }
    }, [mode]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        multiple: mode === 'compress',
        accept: mode === 'extract' ? { 'application/zip': ['.zip'] } : undefined
    });

    const handleDownload = (fileData: Uint8Array, fileName: string) => {
        // 修正: fileData as any で型チェックをバイパス
        const blob = new Blob([fileData as any]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex gap-4 border-b border-gray-700 pb-1">
                <button onClick={() => { setMode('compress'); setFiles([]); }} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'compress' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}>
                    <Archive size={20} /> Compress (Zip)
                </button>
                <button onClick={() => { setMode('extract'); setFiles([]); }} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'extract' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}>
                    <FileArchive size={20} /> Extract (Unzip)
                </button>
            </div>

            <div {...getRootProps()} className={clsx("border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all", isDragActive ? "border-primary-500 bg-primary-500/10" : "border-gray-700 hover:bg-gray-800")}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center text-gray-400">
                    {mode === 'compress' ? <Archive size={48} className="mb-2" /> : <FileArchive size={48} className="mb-2" />}
                    <p className="font-bold text-lg">{mode === 'compress' ? 'Drop files to Zip' : 'Drop Zip to Extract'}</p>
                </div>
            </div>

            {isArchiving && <div className="text-center text-primary-400 font-mono animate-pulse">{archiveLog}</div>}
            {error && <div className="text-center text-red-400 font-bold">Error: {error}</div>}

            {mode === 'compress' && files.length > 0 && !isArchiving && (
                <div className="text-center">
                    <p className="text-gray-400 mb-4">{files.length} files selected</p>
                    <button onClick={() => createZip(files)} className="bg-primary-500 text-black font-bold px-8 py-3 rounded-full hover:bg-primary-400 transition shadow-lg">
                        Download as .zip
                    </button>
                </div>
            )}

            {mode === 'extract' && extractedFiles.length > 0 && (
                <div className="bg-surface border border-gray-700 rounded-xl overflow-hidden">
                    <div className="bg-gray-900 p-3 border-b border-gray-700 text-sm text-gray-400 font-bold">Contents ({extractedFiles.length})</div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-800">
                        {extractedFiles.map((f, i) => (
                            <div key={i} className="p-3 flex items-center justify-between hover:bg-gray-800/50 transition">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileIcon size={16} className="text-gray-500" />
                                    <span className="text-sm text-gray-200 truncate">{f.name}</span>
                                    <span className="text-xs text-gray-600">{(f.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <button onClick={() => handleDownload(f.data, f.name)} className="p-2 bg-gray-800 hover:bg-primary-500 hover:text-black rounded text-gray-400 transition">
                                    <Download size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
