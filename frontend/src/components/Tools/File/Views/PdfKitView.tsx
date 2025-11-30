import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { usePdfKit } from '@/hooks/usePdfKit';
import { FileText, RotateCw, Scissors } from 'lucide-react';
import clsx from 'clsx';

export default function PdfKitView() {
    const { isPdfWorking, pdfLog, rotatePdf, splitPdf } = usePdfKit();
    const [file, setFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if(acceptedFiles.length > 0) setFile(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop, 
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false 
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div {...getRootProps()} className={clsx("border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all", isDragActive ? "border-primary-500 bg-primary-500/10" : "border-gray-700 hover:bg-gray-800")}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center text-gray-400">
                    <FileText size={48} className="mb-2" />
                    <p className="font-bold text-lg">{file ? file.name : 'Drop PDF file here'}</p>
                </div>
            </div>

            {isPdfWorking && <div className="text-center text-primary-400 font-mono animate-pulse">{pdfLog}</div>}

            {file && !isPdfWorking && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface border border-gray-700 p-6 rounded-xl">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><RotateCw size={20} /> Rotate</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => rotatePdf(file, 90)} className="bg-gray-800 hover:bg-gray-700 text-white py-2 rounded border border-gray-600 transition">Rotate 90° CW</button>
                            <button onClick={() => rotatePdf(file, 180)} className="bg-gray-800 hover:bg-gray-700 text-white py-2 rounded border border-gray-600 transition">Rotate 180°</button>
                        </div>
                    </div>
                    <div className="bg-surface border border-gray-700 p-6 rounded-xl">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Scissors size={20} /> Split</h3>
                        <p className="text-gray-500 text-sm mb-4">Extract all pages as separate files.</p>
                        <button onClick={() => splitPdf(file)} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded border border-gray-600 transition">Split All Pages</button>
                    </div>
                </div>
            )}
        </div>
    );
}
