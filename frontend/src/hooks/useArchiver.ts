import { useState } from 'react';
import * as zip from '@zip.js/zip.js';

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

    // 暗号化チェック (zip.js版)
    const checkEncryption = async (file: File) => {
        setIsArchiving(true);
        setError(null);
        setIsEncrypted(false);
        setArchiveLog('Analyzing archive...');

        try {
            const reader = new zip.ZipReader(new zip.BlobReader(file));
            const entries = await reader.getEntries();
            
            // 少なくとも1つのファイルが暗号化されているかチェック
            const hasEncryption = entries.some(entry => entry.encrypted);
            
            if (hasEncryption) {
                setIsEncrypted(true);
                addLog("Encrypted archive detected.");
            } else {
                addLog("Archive is not encrypted.");
            }
            await reader.close();
        } catch (e: any) {
            setError("Analysis failed: " + e.message);
        } finally {
            setIsArchiving(false);
        }
    };

    // Zip圧縮 (zip.js版 - 確実な暗号化)
    const createZip = async (files: File[], config: ArchiveConfig) => {
        setIsArchiving(true);
        setError(null);
        addLog('Initializing Writer...');

        try {
            // 出力先のBlobWriterを作成
            const blobWriter = new zip.BlobWriter("application/zip");
            
            // ZipWriterを作成
            const writer = new zip.ZipWriter(blobWriter);

            const hasPassword = config.password && config.password.trim().length > 0;
            if (hasPassword) {
                addLog(`Encrypting with password (AES-256)...`);
            }

            for (const file of files) {
                addLog(`Adding: ${file.name}`);
                
                // オプション設定
                const options: any = {
                    level: config.level ?? 5,
                    bufferedWrite: true, // メモリ節約
                };

                // パスワードがある場合のみ設定
                if (hasPassword) {
                    options.password = config.password;
                    options.encryptionStrength = 3; // 3 = AES-256 (Strong)
                }

                // ファイルを追加
                await writer.add(file.name, new zip.BlobReader(file), options);
            }

            addLog('Finalizing Zip...');
            await writer.close();

            // Blobを取得
            const blob = await blobWriter.getData();
            
            // ダウンロード
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const now = new Date();
            const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
            const fileName = hasPassword ? `secure_archive_${timestamp}.zip` : `archive_${timestamp}.zip`;
            
            link.download = fileName;
            link.click();

            addLog('Done!');

        } catch (err: any) {
            console.error(err);
            setError("Compression failed: " + err.message);
        } finally {
            setIsArchiving(false);
        }
    };

    // Zip解凍 (zip.js版)
    const unzip = async (file: File, config: ArchiveConfig) => {
        setIsArchiving(true);
        addLog('Reading entries...');
        setExtractedFiles([]);
        setError(null);

        try {
            // パスワードリスト作成
            let passwords: (string | undefined)[] = [config.password || undefined];
            if (config.passwordListFile) {
                const text = await config.passwordListFile.text();
                const list = text.split(/\r\n|\n/).map(p => p.trim()).filter(p => p);
                passwords = [...passwords, ...list];
            }
            // undefined (パスワードなし) も試行候補に入れる
            if (!passwords.includes(undefined) && !config.password) passwords.push(undefined);

            let success = false;

            // 総当たりループ
            for (const pwd of passwords) {
                if (success) break;
                
                try {
                    const reader = new zip.ZipReader(new zip.BlobReader(file));
                    const entries = await reader.getEntries();
                    const tempFiles: ArchiveFile[] = [];

                    for (const entry of entries) {
                        if (entry.directory) continue;

                        // パスワード設定 (entryごとに必要)
                        const options: any = {};
                        if (pwd) options.password = pwd;

                        // 展開試行 (パスワードが違うとここでエラーになる)
                        const dataWriter = new zip.Uint8ArrayWriter();
                        const data = await entry.getData!(dataWriter, options);
                        
                        tempFiles.push({
                            name: entry.filename,
                            size: entry.uncompressedSize,
                            data: data
                        });
                    }

                    await reader.close();
                    
                    // エラーなくここまで来たら成功
                    setExtractedFiles(tempFiles);
                    addLog('Extraction successful!');
                    success = true;

                } catch (e: any) {
                    // パスワード違いのエラーなら次へ
                    // zip.jsは "Encrypted" や "Password" を含むエラーを投げる
                    continue;
                }
            }

            if (!success) {
                setError("Failed to extract. Password incorrect.");
            }

        } catch (err: any) {
            setError("Error: " + err.message);
        } finally {
            setIsArchiving(false);
        }
    };

    // フォルダへ保存 (変更なし)
    const saveToFolder = async () => {
        if (extractedFiles.length === 0) return;
        try {
            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker();
            addLog("Saving...");
            for (const file of extractedFiles) {
                // @ts-ignore
                const fileHandle = await dirHandle.getFileHandle(file.name.split('/').pop(), { create: true });
                // @ts-ignore
                const writable = await fileHandle.createWritable();
                await writable.write(file.data);
                await writable.close();
            }
            addLog("Saved!");
            alert("保存完了しました");
        } catch (err: any) {
            if (err.name !== 'AbortError') setError("Save failed: " + err.message);
        }
    };

    return { isArchiving, archiveLog, extractedFiles, error, isEncrypted, checkEncryption, createZip, unzip, saveToFolder };
};
