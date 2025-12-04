<<<<<<< HEAD
import { useState } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> 8a92cacec6b709993ac994f025af737c1c0a3fcf
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import * as fflate from 'fflate';
import { Archive, FileText, RefreshCw, X, File as FileIcon, Trash2, FolderOutput } from 'lucide-react';
import { usePdfConverter } from '@/hooks/usePdfConverter';
import DocumentSettings, { DocConfig } from '@/components/Tools/Settings/DocumentSettings';

export default function DocumentStudio() {
    const [files, setFiles] = useState<File[]>([]);
    const [docConfig, setDocConfig] = useState<DocConfig>({
<<<<<<< HEAD
        format: 'pdf', mode: 'default', rotateAngle: 90, imageFormat: 'jpg', removePageRanges: '', removeMetadata: true, optimizeForWeb: false, flattenAnnotations: false, compressionLevel: 'medium'
    });

    const pdf = usePdfConverter();
    const isProcessing = pdf.isPdfLoading;
    const results = pdf.pdfOutputUrl ? [{ name: 'output.pdf', url: pdf.pdfOutputUrl }] : [];
    const logs = pdf.pdfLog ? pdf.pdfLog.split('\n') : [];

    const handleReset = () => { if (window.confirm("Clear all files?")) setFiles([]); };
=======
        format: 'pdf', mode: 'default', rotateAngle: 90, imageFormat: 'jpg', removePageRanges: '', metadataTitle: '', metadataAuthor: '', metadataDate: ''
    });

    const pdf = usePdfConverter();
    const isProcessing = pdf.isLoading;
    const results = pdf.outputUrls;
    const logs = pdf.log;

    const handleReset = () => { if (window.confirm('Clear all files?')) setFiles([]); };
>>>>>>> 8a92cacec6b709993ac994f025af737c1c0a3fcf
    const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));
    const onDrop = (acceptedFiles: File[]) => setFiles(prev => [...prev, ...acceptedFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
<<<<<<< HEAD
        onDrop, accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] } 
    });

    const handleConvert = async () => {
        if (files.length === 0) return;
        if (docConfig.mode === 'merge') {
            await pdf.mergePdfs(files);
        } else if ((docConfig.outputFormat || 'pdf') === 'txt') {
            if (files[0]) await pdf.pdfToText(files[0]);
        } else {
            await pdf.mergePdfs(files);
        }
    };

=======
        onDrop, accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] } 
    });

    const handleConvert = () => pdf.processDocs(files, docConfig);
>>>>>>> 8a92cacec6b709993ac994f025af737c1c0a3fcf

    // フォルダ保存
    const saveToFolder = async () => {
        // @ts-ignore
        if (!window.showDirectoryPicker) { alert("Use Chrome/Edge"); return; }
        try {
            // @ts-ignore
            const dir = await window.showDirectoryPicker();
            for (const res of results) {
                const blob = await fetch(res.url).then(r => r.blob());
                // @ts-ignore
                const fh = await dir.getFileHandle(res.name, { create: true });
                // @ts-ignore
                const w = await fh.createWritable();
                await w.write(blob);
                await w.close();
            }
            alert("Saved!");
        } catch (e) { console.error(e); }
    };

    const downloadAllZip = async () => {
        if (results.length === 0) return;
        const zipFiles: { [name: string]: Uint8Array } = {};
        for (const res of results) {
            const blob = await fetch(res.url).then(r => r.blob());
            const buffer = await blob.arrayBuffer();
            zipFiles[res.name] = new Uint8Array(buffer);
        }
        // @ts-ignore
        fflate.zip(zipFiles, { level: 6 }, (err, data) => {
            if (err) return alert(err);
            // @ts-ignore
<<<<<<< HEAD
            const url = URL.createObjectURL(new Blob([data], { type: "application/zip" }));
            const a = document.createElement("a");
=======
            const url = URL.createObjectURL(new Blob([data], { type: 'application/zip' }));
            const a = document.createElement('a');
>>>>>>> 8a92cacec6b709993ac994f025af737c1c0a3fcf
            a.href = url; a.download = `documents_${Date.now()}.zip`; a.click();
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
<<<<<<< HEAD
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <FileText className="text-primary-500" /> Document Studio
                </h2>
                <p className="text-gray-500 text-sm">PDF & Text Operations</p>
            </div>

            <div className="bg-surface border border-gray-700 rounded-2xl p-6">
                <div
                    {...getRootProps()}
                    className={clsx(
                        "border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-6",
                        isDragActive ? "border-primary-500 bg-primary-500/10" : "border-gray-600 hover:bg-gray-800"
                    )}
                >
                    <input {...getInputProps()} />
                    <p className="text-gray-300 font-bold text-lg">Drag & Drop Documents</p>
                    <p className="text-gray-500 text-sm">PDF (.pdf) or Text (.txt)</p>
                </div>

                {files.length > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-bold">{files.length} Files</span>
                            <button onClick={handleReset} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm">
                                <Trash2 size={14}/> Clear All
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-gray-800 rounded bg-black/30">
                            {files.map((f, i) => (
                                <div key={i} className="bg-gray-900 text-gray-300 pl-3 pr-1 py-1 rounded text-xs border border-gray-700 flex items-center gap-2 group">
                                    <FileIcon size={12}/>
                                    <span className="truncate max-w-[150px]">{f.name}</span>
                                    <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/10 transition">
                                        <X size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {files.length > 0 && (
                    <div className="space-y-6">
                        <DocumentSettings config={docConfig} onChange={setDocConfig} inputType={files[0].type} />
                        <button
                            onClick={handleConvert}
                            disabled={isProcessing}
                            className={clsx(
                                "w-full py-4 rounded-xl font-bold text-lg text-black shadow-lg transition-transform",
                                isProcessing ? "bg-gray-500 cursor-not-allowed" : "bg-primary-500 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                            )}
                        >
                            {isProcessing ? (
                                <>
                                    <RefreshCw className="animate-spin"/> Processing...
                                </>
                            ) : (
                                'Start Processing'
                            )}
                        </button>
                    </div>
                )}

                {(logs.length > 0 || results.length > 0) && (
                    <div className="bg-black border border-gray-800 rounded-xl p-4 font-mono text-xs">
                        <div className="h-64 overflow-y-auto text-green-400 space-y-1 mb-4 custom-scrollbar p-2 bg-gray-900/50 rounded">
                            {logs.map((l: string, i: number) => (
                                <div key={i}>{l}</div>
                            ))}
                        </div>

                        {results.length > 0 && (
                            <div className="border-t border-gray-800 pt-4 flex justify-between">
                                <span className="text-white font-bold text-lg">Result: {results.length} Files</span>
                                <div className="flex gap-2">
                                    <button onClick={saveToFolder} className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-gray-200 flex gap-2">
                                        <FolderOutput size={16}/> Save Folder
                                    </button>
                                    <button onClick={downloadAllZip} className="bg-gray-700 text-white px-4 py-2 rounded font-bold hover:bg-gray-600 flex gap-2">
                                        <Archive size={16}/> Zip
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
=======
            <div className="text-center"><h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3"><FileText className="text-primary-500" /> Document Studio</h2><p className="text-gray-500 text-sm">PDF & Text Operations</p></div>
            <div className="bg-surface border border-gray-700 rounded-2xl p-6">
                <div {...getRootProps()} className={clsx("border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-6", isDragActive ? "border-primary-500 bg-primary-500/10" : "border-gray-600 hover:bg-gray-800")}><input {...getInputProps()} /><p className="text-gray-300 font-bold text-lg">Drag & Drop Documents</p><p className="text-gray-500 text-sm">PDF (.pdf) or Text (.txt)</p></div>
                {files.length > 0 && (
                    <div className="mb-6"><div className="flex justify-between items-center mb-2"><span className="text-white font-bold">{files.length} Files</span><button onClick={handleReset} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm"><Trash2 size={14}/> Clear All</button></div><div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-gray-800 rounded bg-black/30">{files.map((f, i) => (<div key={i} className="bg-gray-900 text-gray-300 pl-3 pr-1 py-1 rounded text-xs border border-gray-700 flex items-center gap-2 group"><FileIcon size={12}/> <span className="truncate max-w-[150px]">{f.name}</span><button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/10 transition"><X size={12}/></button></div>))}</div></div>
                )}
                {files.length > 0 && (
                    <div className="space-y-6"><DocumentSettings config={docConfig} onChange={setDocConfig} inputType={files[0].type} /><button onClick={handleConvert} disabled={isProcessing} className={clsx("w-full py-4 rounded-xl font-bold text-lg text-black shadow-lg transition-transform", isProcessing ? "bg-gray-500 cursor-not-allowed" : "bg-primary-500 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2")}>{isProcessing ? <><RefreshCw className="animate-spin"/> Processing...</> : 'Start Processing'}</button></div>
                )}
            </div>
            {(logs.length > 0 || results.length > 0) && (
                <div className="bg-black border border-gray-800 rounded-xl p-4 font-mono text-xs">
                    <div className="h-64 overflow-y-auto text-green-400 space-y-1 mb-4 custom-scrollbar p-2 bg-gray-900/50 rounded">{logs.map((l, i) => <div key={i}>{l}</div>)}</div>
                    {results.length > 0 && (<div className="border-t border-gray-800 pt-4 flex justify-between"><span className="text-white font-bold text-lg">Result: {results.length} Files</span><div className="flex gap-2"><button onClick={saveToFolder} className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-gray-200 flex gap-2"><FolderOutput size={16}/> Save Folder</button><button onClick={downloadAllZip} className="bg-gray-700 text-white px-4 py-2 rounded font-bold hover:bg-gray-600 flex gap-2"><Archive size={16}/> Zip</button></div></div>)}
                </div>
            )}
>>>>>>> 8a92cacec6b709993ac994f025af737c1c0a3fcf
        </div>
    );
}
