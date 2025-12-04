import { useState } from 'react';
import * as fflate from 'fflate';

export type ArchiveFile = { name: string; size: number; data: Uint8Array };
export type ArchiveConfig = { level: number; password?: string; passwordListFile?: File };

export const useArchiver = () => {
    const [isArchiving, setIsArchiving] = useState(false);
    const [archiveLog, setArchiveLog] = useState('');
    const [extractedFiles, setExtractedFiles] = useState<ArchiveFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [zipUrl, setZipUrl] = useState<string | null>(null);
    const [zipName, setZipName] = useState<string | null>(null);

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
                fflate.unzip(bytes, (err) => {
                    if (err) {
                        const msg = String(err.message || err).toLowerCase();
                        if (msg.includes('encrypted') || msg.includes('password')) {
                            setIsEncrypted(true);
                            addLog('Encrypted archive detected.');
                            resolve();
                        } else {
                            reject(err);
                        }
                    } else {
                        setIsEncrypted(false);
                        addLog('Archive is not encrypted.');
                        resolve();
                    }
                });
            });
        } catch (e: any) {
            const msg = e && e.message ? e.message.toLowerCase() : '';
            if (msg.includes('encrypted') || msg.includes('password')) {
                setIsEncrypted(true);
                addLog('Encrypted archive detected.');
            } else {
                setError('Analysis failed: ' + (e && e.message ? e.message : String(e)));
            }
        } finally {
            setIsArchiving(false);
        }
    };

    const createZip = async (files: File[], config: ArchiveConfig) => {
        setIsArchiving(true);
        addLog('Preparing files...');
        setError(null);
        setZipUrl(null);
        setZipName(null);
        try {
            const zipjs = await import('@zip.js/zip.js');
            const { ZipWriter, BlobWriter, BlobReader } = zipjs as any;

            // Instantiate writer with password to ensure encryption propagates; zip.js expects encryptionStrength 1..3 (3 = 256-bit).
            const writer = new ZipWriter(new BlobWriter('application/zip'), config.password?.trim()
                ? { password: config.password, encryptionStrength: 3, level: config.level ?? 6 }
                : { level: config.level ?? 6 }
            );
            for (const file of files) {
                const reader = new BlobReader(file);
                const addOptions: any = { level: config.level ?? 6 };
                if (config.password && config.password.trim()) {
                    addOptions.password = config.password;
                    addOptions.encryptionStrength = 3; // 3 = 256-bit
                }
                // @ts-ignore
                await writer.add(file.name, reader, addOptions);
            }
            const blob: Blob = await writer.close();
            const name = `archive_${Date.now()}.zip`;
            const url = URL.createObjectURL(blob);
            setZipUrl(url);
            setZipName(name);
            addLog(`Created zip with ${files.length} files. Ready to download.`);
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setIsArchiving(false);
        }
    };

    const unzip = async (file: File, config: ArchiveConfig) => {
        setIsArchiving(true);
        addLog('Extracting...');
        setExtractedFiles([]);
        setError(null);
        try {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let success = false;

            // Quick attempt with fflate for non-encrypted archives
            try {
                await new Promise<void>((resolve, reject) => {
                    fflate.unzip(bytes, (err, unzipped) => {
                        if (err) { reject(err); return; }
                        const filesArr: ArchiveFile[] = [];
                        for (const [filename, fdata] of Object.entries(unzipped || {})) {
                            if (filename.endsWith('/')) continue;
                            const data = fdata as Uint8Array;
                            filesArr.push({ name: filename, size: data.length, data });
                        }
                        setExtractedFiles(filesArr);
                        addLog('Unzip success (fflate)');
                        success = true;
                        resolve();
                    });
                });
            } catch {
                // ignore and fall through
            }

            if (!success) {
                const passwords: (string | undefined)[] = [];
                if (config.password) passwords.push(config.password);
                if (config.passwordListFile) {
                    const text = await config.passwordListFile.text();
                    const list = text.split(/\r\n|\n/).map(p => p.trim()).filter(Boolean);
                    passwords.push(...list);
                }
                if (passwords.length === 0) passwords.push(undefined);

                const zipjs = await import('@zip.js/zip.js');
                const { ZipReader, BlobReader, BlobWriter } = zipjs as any;
                const blob = new Blob([bytes.buffer], { type: 'application/zip' });

                for (const pwd of passwords) {
                    try {
                        const reader = new ZipReader(new BlobReader(blob));
                        const entries: any[] = await reader.getEntries();
                        const filesArr: ArchiveFile[] = [];
                        for (const entry of entries) {
                            if (entry.directory) continue;
                            // @ts-ignore
                            const entryBlob: Blob = await entry.getData(new BlobWriter(), pwd ? { password: pwd } : undefined);
                            const arr = new Uint8Array(await entryBlob.arrayBuffer());
                            const name = entry.filename || (entry as any).filenameUTF8 || (entry as any).name || 'file';
                            filesArr.push({ name, size: arr.length, data: arr });
                        }
                        await reader.close();
                        setExtractedFiles(filesArr);
                        addLog('Unzip success (zip.js)');
                        success = true;
                        break;
                    } catch (e) {
                        continue;
                    }
                }
            }

            if (!success) throw new Error('Failed to unzip. Password incorrect or archive unsupported.');
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setIsArchiving(false);
        }
    };

    const saveToFolder = async () => {
        // @ts-ignore
        if (!window.showDirectoryPicker) { alert('Use Chrome/Edge'); return; }
        try {
            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker();
            addLog('Saving files...');
            for (const file of extractedFiles) {
                const parts = file.name.split('/');
                const fileName = parts.pop();
                let currentHandle: any = dirHandle;
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
            addLog('Saved to folder!');
            alert('Saved successfully!');
        } catch (err: any) {
            if (err?.name !== 'AbortError') setError('Save failed: ' + (err?.message || String(err)));
        }
    };

    const downloadAllExtracted = () => {
        // optional future improvement
    };

    return { isArchiving, archiveLog, extractedFiles, error, isEncrypted, zipUrl, zipName, checkEncryption, createZip, unzip, saveToFolder, downloadAllExtracted };
};
