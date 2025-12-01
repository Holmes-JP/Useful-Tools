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

    // Zip圧縮 (Per-File Options方式に変更)
    const createZip = async (files: File[], config: ArchiveConfig) => {
        setIsArchiving(true);
        addLog('Preparing files...');
        setError(null);

        try {
            // fflateのzip関数は { "filename": [data, options] } の形式を受け取れる
            // これを利用して、全ファイルに対して明示的にパスワードを設定する
            const fileData: Record<string, any> = {};
            
            const hasPassword = config.password && config.password.trim().length > 0;
            
            if (hasPassword) {
                addLog(`Encrypting with password (${config.password!.length} chars)...`);
            } else {
                addLog('Compressing without password...');
            }

            for (const file of files) {
                const buffer = await file.arrayBuffer();
                const uint8 = new Uint8Array(buffer);

                if (hasPassword) {
                    // [データ, オプション] の形式で登録
                    fileData[file.name] = [uint8, {
                        level: config.level,
                        password: config.password,
                        mtime: new Date() // タイムスタンプも更新
                    }];
                } else {
                    // パスワードなしの場合
                    fileData[file.name] = [uint8, {
                        level: config.level,
                        mtime: new Date()
                    }];
                }
            }

            addLog('Generating Zip...');

            // 第2引数のグローバルオプションは簡素化（個別に設定しているため）
            fflate.zip(fileData, { level: config.level }, (err, data) => {
                if (err) {
                    setError("Compression Error: " + err.message);
                    setIsArchiving(false);
                    return;
                }
                
                // Blob生成
                const blob = new Blob([data as any], { type: 'application/zip' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                
                const now = new Date();
                const timestamp = now.getFullYear().toString() +
                    (now.getMonth() + 1).toString().padStart(2, '0') +
                    now.getDate().toString().padStart(2, '0') + '_' +
                    now.getHours().toString().padStart(2, '0') +
                    now.getMinutes().toString().padStart(2, '0');
                
                const fileName = hasPassword ? `archive_encrypted_${timestamp}.zip` : `archive_${timestamp}.zip`;
                link.download = fileName;
                link.click();
                
                addLog(`Success! Downloaded ${fileName}`);
                setIsArchiving(false);
            });

        } catch (err: any) {
            console.error(err);
            setError("Failed: " + err.message);
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
            if (!passwords.includes(undefined) && !config.password) passwords.push(undefined);

            let success = false;

            for (const pwd of passwords) {
                if (success) break;
                try {
                    await new Promise<void>((resolve, reject) => {
                        const opts: any = {};
                        if (pwd) opts.password = pwd;

                        fflate.unzip(bytes, opts, (err, unzipped) => {
                            if (err) { 
                                resolve(); 
                                return; 
                            }
                            
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
                 setError("Failed to extract. Password incorrect or file encrypted.");
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsArchiving(false);
        }
    };

    // フォルダへ保存
    const saveToFolder = async () => {
        if (extractedFiles.length === 0) return;

        try {
            // @ts-ignore
            if (!window.showDirectoryPicker) {
                alert("この機能は Chrome / Edge (PC版) でのみ利用可能です。");
                return;
            }

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
            addLog("All files saved!");
            alert("保存が完了しました！");

        } catch (err: any) {
            if (err.name !== 'AbortError') setError("Save failed: " + err.message);
        }
    };

    return { isArchiving, archiveLog, extractedFiles, error, isEncrypted, checkEncryption, createZip, unzip, saveToFolder };
};
