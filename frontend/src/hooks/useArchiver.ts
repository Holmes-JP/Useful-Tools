import { useState } from 'react';
import * as fflate from 'fflate';

export type ArchiveFile = {
    name: string;
    size: number;
    data: Uint8Array;
};

export type ArchiveConfig = {
    level: number;
    password?: string;
    passwordListFile?: File;
};

export const useArchiver = () => {
    const [isArchiving, setIsArchiving] = useState(false);
    const [archiveLog, setArchiveLog] = useState('');
    const [extractedFiles, setExtractedFiles] = useState<ArchiveFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isEncrypted, setIsEncrypted] = useState(false);

    const addLog = (msg: string) => setArchiveLog(msg);

    const checkEncryption = async (file: File) => {
        setIsArchiving(true);
        setError(null);
        setIsEncrypted(false);
        setArchiveLog('Analyzing file...');

        try {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);

            await new Promise<void>((resolve, reject) => {
                fflate.unzip(bytes, (err, _) => {
                    if (err) {
                        if (err.message.toLowerCase().includes("encrypted") || err.message.toLowerCase().includes("password")) {
                            setIsEncrypted(true);
                            addLog("Encrypted archive detected.");
                            resolve();
                        } else {
                            reject(err);
                        }
                    } else {
                        setIsEncrypted(false);
                        addLog("Archive is not encrypted.");
                        resolve();
                    }
                });
            });
        } catch (e: any) {
            const msg = e.message ? e.message.toLowerCase() : "";
            if (msg.includes("encrypted") || msg.includes("password")) {
                setIsEncrypted(true);
                addLog("Encrypted archive detected.");
            } else {
                setError("Analysis failed: " + e.message);
            }
        } finally {
            setIsArchiving(false);
        }
    };

    const createZip = async (files: File[], config: ArchiveConfig) => {
        setIsArchiving(true);
        addLog('Preparing files...');
        setError(null);

        try {
            const fileData: Record<string, Uint8Array> = {};
            for (const file of files) {
                const buffer = await file.arrayBuffer();
                fileData[file.name] = new Uint8Array(buffer);
            }

            addLog('Compressing...');
            
            const options: any = {
                level: config.level,
                mem: 12,
            };
            
            if (config.password && config.password.trim() !== '') {
                options.password = config.password;
            }

            fflate.zip(fileData, options, (err, data) => {
                if (err) {
                    setError(err.message);
                    setIsArchiving(false);
                    return;
                }
                const blob = new Blob([data as any], { type: 'application/zip' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `archive_${Date.now()}.zip`;
                link.click();
                addLog(`Created zip with ${files.length} files!`);
                setIsArchiving(false);
            });

        } catch (err: any) {
            setError(err.message);
            setIsArchiving(false);
        }
    };

    const unzip = async (file: File, config: ArchiveConfig) => {
        setIsArchiving(true);
        addLog('Decrypting...');
        setExtractedFiles([]);
        setError(null);

        try {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            
            let passwords: (string | undefined)[] = [config.password || undefined];
            if (config.passwordListFile) {
                const text = await config.passwordListFile.text();
                const list = text.split(/\r\n|\n/).map(p => p.trim()).filter(p => p);
                passwords = [...passwords, ...list];
            }
            if (passwords.length === 0 && !config.password) passwords.push(undefined);

            let success = false;

            for (const pwd of passwords) {
                if (success) break;
                try {
                    await new Promise<void>((resolve, reject) => {
                        const opts: any = {};
                        if (pwd) opts.password = pwd;

                        fflate.unzip(bytes, opts, (err, unzipped) => {
                            if (err) { reject(err); return; }
                            
                            const files: ArchiveFile[] = [];
                            for (const [filename, fileData] of Object.entries(unzipped)) {
                                if (filename.endsWith('/')) continue;
                                files.push({ name: filename, size: fileData.length, data: fileData });
                            }
                            setExtractedFiles(files);
                            addLog(`Unzip success!`);
                            success = true;
                            resolve();
                        });
                    });
                } catch (e) { continue; }
            }

            if (!success) {
                throw new Error("Failed to unzip. Password incorrect.");
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsArchiving(false);
        }
    };

    const saveToFolder = async () => {
        // @ts-ignore
        if (!window.showDirectoryPicker) { alert("Use Chrome/Edge"); return; }
        try {
            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker();
            addLog("Saving files...");

            for (const file of extractedFiles) {
                const parts = file.name.split('/');
                const fileName = parts.pop();
                let currentHandle = dirHandle;

                for (const part of parts) {
                    if (part === '.' || part === '') continue;
                    // @ts-ignore
                    currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
                }

                if (fileName) {
                    // @ts-ignore
                    const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
                    // @ts-ignore
                    const writable = await fileHandle.createWritable();
                    await writable.write(file.data);
                    await writable.close();
                }
            }
            addLog("Saved to folder!");
            alert("Saved successfully!");
        } catch (err: any) {
            if (err.name !== 'AbortError') setError("Save failed: " + err.message);
        }
    };
    
    const downloadAllExtracted = () => { /* Zip download logic if needed */ };

    return { isArchiving, archiveLog, extractedFiles, error, isEncrypted, checkEncryption, createZip, unzip, saveToFolder, downloadAllExtracted };
};
