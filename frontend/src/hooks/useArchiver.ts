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

    // 暗号化チェック
    const checkEncryption = async (file: File) => {
        setIsArchiving(true);
        setError(null);
        setIsEncrypted(false);
        setArchiveLog('Analyzing file...');

        try {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);

            await new Promise<void>((resolve, reject) => {
                // 型エラー回避のため any キャスト
                fflate.unzip(bytes, (err, _) => {
                    if (err) {
                        const msg = err.message.toLowerCase();
                        if (msg.includes("encrypted") || msg.includes("password")) {
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

    // Zip圧縮 (パスワード対応修正)
    const createZip = async (files: File[], config: ArchiveConfig) => {
        setIsArchiving(true);
        addLog('Preparing files...');
        setError(null);

        try {
            // データ構造をシンプルにする: { "filename": Uint8Array }
            const fileData: Record<string, Uint8Array> = {};
            
            for (const file of files) {
                const buffer = await file.arrayBuffer();
                fileData[file.name] = new Uint8Array(buffer);
            }

            addLog('Compressing...');
            
            // オプション設定 (anyキャストで型エラー回避)
            const options: any = {
                level: config.level,
                mem: 12,
            };
            
            // グローバルオプションとしてパスワードを設定
            if (config.password && config.password.trim() !== '') {
                options.password = config.password;
            }

            fflate.zip(fileData, options, (err, data) => {
                if (err) {
                    setError(err.message);
                    setIsArchiving(false);
                    return;
                }
                
                // Blob生成時の型エラー回避
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

    // Zip解凍
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

    // ★ フォルダへ直接保存 (File System Access API)
    const saveToFolder = async () => {
        if (extractedFiles.length === 0) return;

        try {
            // @ts-ignore
            if (!window.showDirectoryPicker) {
                alert("この機能は Chrome / Edge (PC版) でのみ利用可能です。");
                return;
            }

            // ユーザーに保存先フォルダを選択させる
            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker();
            
            addLog("Saving files to folder...");

            for (const file of extractedFiles) {
                // パス解析 (folder/sub/file.txt)
                const parts = file.name.split('/');
                const fileName = parts.pop();
                let currentHandle = dirHandle;

                // サブディレクトリ作成
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

            addLog("All files saved to your folder!");
            alert("保存が完了しました！");

        } catch (err: any) {
            // ユーザーキャンセルは無視
            if (err.name !== 'AbortError') {
                setError("Save failed: " + err.message);
            }
        }
    };

    return { isArchiving, archiveLog, extractedFiles, error, isEncrypted, checkEncryption, createZip, unzip, saveToFolder };
};
