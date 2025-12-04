import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useArchiver, ArchiveConfig } from '@/hooks/useArchiver';
import { Archive, Download, FileArchive, File as FileIcon, Lock, Settings2, FolderOutput, X, Square } from 'lucide-react';
import clsx from 'clsx';

export default function ArchiverView() {
    const { isArchiving, archiveLog, extractedFiles, error, isEncrypted, zipUrl, zipName, stopRequested, requestStop, foundPassword, checkEncryption, createZip, unzip, saveToFolder } = useArchiver();
    const [mode, setMode] = useState<'compress' | 'extract'>('compress');
    const [compressFiles, setCompressFiles] = useState<File[]>([]);
    const [extractFiles, setExtractFiles] = useState<File[]>([]);
    
    const [config, setConfig] = useState<ArchiveConfig>({
        level: 6,
        password: '',
        passwordListFile: undefined
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (mode === 'compress') {
            // Append new files, avoid duplicates by name+size
            setCompressFiles(prev => {
                const existing = new Map(prev.map(f => [`${f.name}:${f.size}`, f]));
                for (const f of acceptedFiles) {
                    existing.set(`${f.name}:${f.size}`, f);
                }
                return Array.from(existing.values());
            });
        } else {
            // extract mode: keep single file replacement
            setExtractFiles(acceptedFiles);
            if (acceptedFiles.length > 0) {
                checkEncryption(acceptedFiles[0]);
            }
        }
    }, [mode, checkEncryption]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        multiple: mode === 'compress',
        accept: mode === 'extract' ? { 'application/zip': ['.zip'] } : undefined
    });

    const handleExecute = () => {
        if (mode === 'compress') {
            if (compressFiles.length === 0) return;
            createZip(compressFiles, config);
        } else {
            if (extractFiles.length === 0) return;
            unzip(extractFiles[0], config);
        }
    };

    const handleDownloadArchive = () => {
        if (!zipUrl) return;
        const a = document.createElement('a');
        a.href = zipUrl;
        a.download = zipName || 'archive.zip';
        a.click();
    };

    const handleDownload = (fileData: Uint8Array, fileName: string) => {
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
                <button onClick={() => { setMode('compress'); }} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'compress' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}>
                    <Archive size={20} /> Compress
                </button>
                <button onClick={() => { setMode('extract'); }} className={clsx("pb-2 px-4 font-bold flex items-center gap-2", mode === 'extract' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500")}>
                    <FileArchive size={20} /> Extract
                </button>
            </div>

            {/* Dropzone */}
            <div {...getRootProps()} className={clsx("border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all bg-gray-900/40 shadow-lg", isDragActive ? "border-primary-500 bg-primary-500/10" : "border-gray-700 hover:bg-gray-800/70")}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center text-gray-200 space-y-2">
                    <span className="px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-primary-500/15 text-primary-300 border border-primary-500/30">
                        {mode === 'compress' ? 'Drop files to Zip' : 'Drop Zip to Extract'}
                    </span>
                    {mode === 'compress' ? <Archive size={48} className="mb-1 text-primary-300" /> : <FileArchive size={48} className="mb-1 text-primary-300" />}
                    <p className="font-bold text-xl">
                        {mode === 'compress'
                            ? (compressFiles.length > 0 ? `${compressFiles.length} file(s) selected` : 'Drag & drop or click to add files')
                            : (extractFiles.length > 0 ? `${extractFiles[0].name}` : 'Drag & drop a zip file')}
                    </p>
                    {mode === 'compress' && compressFiles.length > 0 && (
                        <p className="text-sm text-primary-300 mt-1">
                            {compressFiles.map(f => f.name).slice(0,3).join(', ')}
                            {compressFiles.length > 3 ? `, +${compressFiles.length-3} more` : ''}
                        </p>
                    )}
                </div>
            </div>

            {/* Compress Settings */}
            {mode === 'compress' && (
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                    <div className="flex items-center gap-2 mb-2 text-gray-300 font-bold">
                        <Settings2 size={18} /> Compression Settings
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Compression Level: {config.level}</label>
                            <input 
                                type="range" min="0" max="9" step="1" 
                                value={config.level} 
                                onChange={e => setConfig({...config, level: Number(e.target.value)})} 
                                className="w-full accent-primary-500"
                            />
                            <div className="flex justify-between text-[10px] text-gray-500"><span>0 (Store)</span><span>9 (Best)</span></div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1"><Lock size={10} /> Password (Optional)</label>
                            <input 
                                type="text" 
                                value={config.password} 
                                onChange={e => setConfig({...config, password: e.target.value})} 
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm"
                                placeholder="No password"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Compress: selected files list with remove and reset */}
            {mode === 'compress' && compressFiles.length > 0 && (
                <div className="bg-surface border border-gray-700 rounded-xl overflow-hidden animate-fade-in-up">
                    <div className="bg-gray-900 p-3 border-b border-gray-700 text-sm text-gray-400 font-bold flex justify-between items-center">
                        <span>Selected Files ({compressFiles.length})</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCompressFiles([])} className="text-xs bg-gray-800 px-3 py-1 rounded hover:bg-gray-700">Reset List</button>
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-800">
                        {compressFiles.map((f: File, i: number) => (
                            <div key={`${f.name}-${f.size}-${i}`} className="p-3 flex items-center justify-between hover:bg-gray-800/50 transition">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileIcon size={16} className="text-gray-500" />
                                    <span className="text-sm text-gray-200 truncate" title={f.name}>{f.name}</span>
                                    <span className="text-xs text-gray-600">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                                <button onClick={() => setCompressFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-2 bg-gray-800 hover:bg-red-600 hover:text-black rounded text-gray-400 transition" aria-label={`Remove ${f.name}`}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Extract Settings */}
            {mode === 'extract' && isEncrypted && (
                <div className="bg-gray-800 p-6 rounded-xl border border-red-900/50 shadow-lg animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-4 text-red-400 font-bold"><Lock size={18} /> Encrypted Archive Detected</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Enter Password</label>
                            <input type="text" value={config.password} onChange={e => setConfig({...config, password: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm" placeholder="Password" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Or Upload Password List (.txt)</label>
                            <input type="file" accept=".txt" onChange={e => e.target.files && setConfig({...config, passwordListFile: e.target.files[0]})} className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-white text-xs file:bg-gray-700 file:text-white file:border-0" />
                        </div>
                    </div>
                </div>
            )}

            {(mode === 'compress' ? compressFiles.length > 0 : extractFiles.length > 0) && !isArchiving && (
                <button onClick={handleExecute} className="w-full bg-primary-500 text-black font-bold py-4 rounded-xl hover:bg-primary-400 shadow-lg transition">
                    {mode === 'compress' ? 'Create Archive' : (isEncrypted ? 'Decrypt & Extract' : 'Extract Files')}
                </button>
            )}

            {mode === 'compress' && zipUrl && !isArchiving && (
                <button onClick={handleDownloadArchive} className="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl hover:bg-emerald-400 shadow-lg transition">
                    <div className="flex items-center justify-center gap-2">
                        <Download size={18} /> Download {zipName || 'archive.zip'}
                    </div>
                </button>
            )}

            {isArchiving && (
                <div className="text-center text-primary-400 font-mono animate-pulse flex items-center justify-center gap-3 min-h-[52px]">
                    {archiveLog.startsWith('Analyzing password list:') ? (
                        <div className="flex items-center gap-3">
                            <span className="shrink-0">Analyzing password list:</span>
                            <span className="inline-block w-56 truncate text-left font-mono">
                                {archiveLog.replace('Analyzing password list:', '').trim() || '(empty)'}
                            </span>
                        </div>
                    ) : (
                        <span className="inline-block w-80 max-w-full truncate text-left">{archiveLog}</span>
                    )}
                    <button
                        onClick={requestStop}
                        disabled={stopRequested}
                        className="ml-2 flex items-center justify-center w-8 h-8 rounded bg-red-600 text-white hover:bg-red-500 transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Stop analysis"
                    >
                        <Square size={14} />
                    </button>
                </div>
            )}
            {error && <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg text-center font-bold">Error: {error}</div>}
            {mode === 'extract' && foundPassword && !isArchiving && (
                <div className="bg-emerald-900/40 border border-emerald-600 text-emerald-100 p-3 rounded-lg text-center font-mono">
                    The password was found: <span className="font-bold">{foundPassword}</span>
                </div>
            )}

            {/* Results */}
            {mode === 'extract' && extractedFiles.length > 0 && (
                <div className="bg-surface border border-gray-700 rounded-xl overflow-hidden animate-fade-in-up">
                    <div className="bg-gray-900 p-3 border-b border-gray-700 text-sm text-gray-400 font-bold flex justify-between items-center">
                        <span>Contents ({extractedFiles.length})</span>
                        
                        {/* 修正: フォルダへ保存ボタン */}
                        <button onClick={saveToFolder} className="bg-white text-black px-4 py-1 rounded text-xs font-bold hover:bg-gray-200 flex items-center gap-2">
                            <FolderOutput size={14} /> Save to PC Folder
                        </button>
                    </div>
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
