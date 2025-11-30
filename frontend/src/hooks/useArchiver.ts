import { useState } from 'react';
import * as fflate from 'fflate';

export type ArchiveFile = {
    name: string;
    size: number;
    data: Uint8Array;
};

export const useArchiver = () => {
    const [isArchiving, setIsArchiving] = useState(false);
    const [archiveLog, setArchiveLog] = useState('');
    const [extractedFiles, setExtractedFiles] = useState<ArchiveFile[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Zip圧縮
    const createZip = async (files: File[]) => {
        setIsArchiving(true);
        setArchiveLog('Preparing files...');
        setError(null);

        try {
            const fileData: { [key: string]: Uint8Array } = {};
            
            for (const file of files) {
                const buffer = await file.arrayBuffer();
                fileData[file.name] = new Uint8Array(buffer);
            }

            setArchiveLog('Compressing...');

            // 修正: オプションを any にキャストして型エラー(number vs 0|1|...|9)を回避
            const options = {
                level: 6,
            } as any;

            fflate.zip(
                Object.fromEntries(files.map(f => [f.name, fileData[f.name]])), 
                options, 
                (err, data) => {
                    if (err) {
                        setError(err.message);
                        setIsArchiving(false);
                        return;
                    }
                    
                    // 修正: data as any
                    const blob = new Blob([data as any], { type: 'application/zip' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `archive_${Date.now()}.zip`;
                    link.click();
                    setArchiveLog(`Created zip with ${files.length} files!`);
                    setIsArchiving(false);
                }
            );

        } catch (err: any) {
            setError(err.message);
            setIsArchiving(false);
        }
    };

    // Zip解凍
    const unzip = async (file: File) => {
        setIsArchiving(true);
        setArchiveLog('Reading zip file...');
        setExtractedFiles([]);
        setError(null);

        try {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);

            fflate.unzip(bytes, (err, unzipped) => {
                if (err) {
                    setError("Failed to unzip. " + err.message);
                    setIsArchiving(false);
                    return;
                }

                const files: ArchiveFile[] = [];
                for (const [filename, fileData] of Object.entries(unzipped)) {
                    if (filename.endsWith('/')) continue;
                    
                    files.push({
                        name: filename,
                        size: fileData.length,
                        data: fileData
                    });
                }
                
                setExtractedFiles(files);
                setArchiveLog(`Extracted ${files.length} files.`);
                setIsArchiving(false);
            });

        } catch (err: any) {
            setError(err.message);
            setIsArchiving(false);
        }
    };

    return { isArchiving, archiveLog, extractedFiles, error, createZip, unzip };
};
