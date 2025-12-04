import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useArchiver, ArchiveConfig } from '@/hooks/useArchiver';
import { Archive, Download, FileArchive, File as FileIcon, Lock, Settings2, FolderOutput, X } from 'lucide-react';
import clsx from 'clsx';

export default function ArchiverView() {
    const { isArchiving, archiveLog, extractedFiles, error, isEncrypted, zipUrl, zipName, checkEncryption, createZip, unzip, saveToFolder } = useArchiver();
    const [mode, setMode] = useState<'compress' | 'extract'>('compress');
    const [files, setFiles] = useState<File[]>([]);
    
    const [config, setConfig] = useState<ArchiveConfig>({
        level: 6,
        password: '',
        passwordListFile: undefined
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (mode === 'compress') {
            // Append new files, avoid duplicates by name+size
            setFiles(prev => {
                const existing = new Map(prev.map(f => [`${f.name}:${f.size}`, f]));
                for (const f of acceptedFiles) {
                    existing.set(`${f.name}:${f.size}`, f);
                }
                return Array.from(existing.values());
            });
        } else {
            // extract mode: keep single file replacement
            setFiles(acceptedFiles);
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
        if (files.length === 0) return;
        if (mode === 'compress') {
            createZip(files, config);
        } else {
            unzip(files[0], config);
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

            {/* Dropzone */}
            <div {...getRootProps()} className={clsx("border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all", isDragActive ? "border-primary-500 bg-primary-500/10" : "border-gray-700 hover:bg-gray-800")}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center text-gray-400">
                    {mode === 'compress' ? <Archive size={48} className="mb-2" /> : <FileArchive size={48} className="mb-2" />}
                    <p className="font-bold text-lg">{files.length > 0 ? `${files.length} file(s) selected` : (mode === 'compress' ? 'Drop files to Zip' : 'Drop Zip to Extract')}</p>
                    {mode === 'compress' && files.length > 0 && <p className="text-sm text-primary-400 mt-2">{files.map(f => f.name).slice(0,3).join(', ')}{files.length > 3 ? `, +${files.length-3} more` : ''}</p>}
                    {mode === 'extract' && files.length > 0 && <p className="text-sm text-primary-400 mt-2">{files[0].name}</p>}
                </div>
            </div>

            {/* Compress: selected files list with remove and reset */}
            {mode === 'compress' && files.length > 0 && (
                <div className="bg-surface border border-gray-700 rounded-xl overflow-hidden animate-fade-in-up">
                    <div className="bg-gray-900 p-3 border-b border-gray-700 text-sm text-gray-400 font-bold flex justify-between items-center">
                        <span>Selected Files ({files.length})</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setFiles([])} className="text-xs bg-gray-800 px-3 py-1 rounded hover:bg-gray-700">Reset List</button>
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-800">
                        {files.map((f: File, i: number) => (
                            <div key={`${f.name}-${f.size}-${i}`} className="p-3 flex items-center justify-between hover:bg-gray-800/50 transition">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileIcon size={16} className="text-gray-500" />
                                    <span className="text-sm text-gray-200 truncate" title={f.name}>{f.name}</span>
                                    <span className="text-xs text-gray-600">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                                <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-2 bg-gray-800 hover:bg-red-600 hover:text-black rounded text-gray-400 transition" aria-label={`Remove ${f.name}`}>
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

            {files.length > 0 && !isArchiving && (
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

            {isArchiving && <div className="text-center text-primary-400 font-mono animate-pulse">{archiveLog}</div>}
            {error && <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg text-center font-bold">Error: {error}</div>}

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
