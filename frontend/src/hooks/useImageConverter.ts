import { useState } from 'react';
import imageCompression from 'browser-image-compression';

// 設定用の型定義
export type ImageOptions = {
    format: 'original' | 'png' | 'jpeg' | 'webp';
    quality: number; // 0.1 ～ 1.0
    maxWidth: number; // 0ならリサイズなし
};

export const useImageConverter = () => {
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [imageLog, setImageLog] = useState<string>("");
    const [imageError, setImageError] = useState<string | null>(null);
    const [imageOutputUrl, setImageOutputUrl] = useState<string | null>(null);

    // 複数画像の一括圧縮処理
    const compressImages = async (files: File[], options: ImageOptions) => {
        setIsImageLoading(true);
        setImageError(null);
        setImageOutputUrl(null);
        setImageLog("Initializing compression...");

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setImageLog(`Compressing ${i + 1}/${files.length}: ${file.name}...`);

                // 【修正1】元画像より小さくすることを目指すため、maxSizeMBを元サイズ(MB)以下に設定
                // ただし、Quality設定が優先されるように少し余裕を持たせるか、あるいは厳しくするか調整
                const sourceSizeMB = file.size / 1024 / 1024;
                
                // 圧縮設定
                const compressionConfig = {
                    // 元のサイズより小さくしたいので、上限を「元サイズ」または「1MB」の小さい方に設定してみる
                    // もしくは Quality を優先したいなら、ここは大きめにする手もあるが、
                    // 「サイズが増える」のを防ぐなら元サイズを上限にするのが効果的。
                    maxSizeMB: sourceSizeMB < 1 ? sourceSizeMB : 1, 
                    
                    maxWidthOrHeight: options.maxWidth > 0 ? options.maxWidth : undefined,
                    useWebWorker: true,
                    fileType: options.format === 'original' ? file.type : `image/${options.format}`,
                    initialQuality: options.quality, // ユーザー指定の画質
                    alwaysKeepResolution: true // リサイズ指定がない場合は解像度を維持
                };

                let outputBlob: Blob = file; // デフォルトは元ファイル
                let isCompressed = false;

                try {
                    const compressedFile = await imageCompression(file, compressionConfig);

                    // 【修正2】サイズチェック: 圧縮して逆に増えていたら元ファイルを使う
                    if (compressedFile.size < file.size) {
                        outputBlob = compressedFile;
                        isCompressed = true;
                    } else {
                        console.log(`Skipped ${file.name}: Compression increased size (${file.size} -> ${compressedFile.size})`);
                    }
                } catch (e) {
                    console.warn("Compression logic failed, using original file.", e);
                    // 失敗しても止まらず元ファイルを出力する（バッチ処理のため）
                    outputBlob = file; 
                }
                
                // ダウンロードリンクを生成
                const url = URL.createObjectURL(outputBlob);
                const link = document.createElement('a');
                link.href = url;
                
                // 拡張子の決定
                let ext = options.format === 'original' ? file.name.split('.').pop() : options.format;
                // JPEG等は jpg に統一するなど
                if (ext === 'jpeg') ext = 'jpg';

                const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
                // 圧縮されたかどうかに応じてファイル名を変える
                const prefix = isCompressed ? 'min_' : 'org_';
                link.download = `${prefix}${nameWithoutExt}.${ext}`;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // プレビュー更新
                if (i === files.length - 1) {
                    setImageOutputUrl(url);
                    // 削減率の計算
                    if (isCompressed) {
                        const reduction = ((file.size - outputBlob.size) / file.size * 100).toFixed(1);
                        setImageLog(`Finished! Last file reduced by ${reduction}%`);
                    } else {
                        setImageLog(`Finished! (No size reduction possible for last file)`);
                    }
                }
            }

        } catch (err: any) {
            console.error(err);
            setImageError("Process failed: " + err.message);
        } finally {
            setIsImageLoading(false);
        }
    };

    return {
        isImageLoading,
        imageLog,
        imageError,
        imageOutputUrl,
        compressImages
    };
};