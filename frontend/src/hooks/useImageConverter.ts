import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import type { ImageConfig } from '@/components/Tools/Settings/ImageSettings';
import { ProcessStatus } from './useVideoStudio'; // 型を共有

export const useImageConverter = () => {
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [processList, setProcessList] = useState<ProcessStatus[]>([]);

    const compressImages = async (files: File[], config: ImageConfig) => {
        setIsImageLoading(true);
        
        // 初期化
        const initialList: ProcessStatus[] = files.map(f => ({
            id: f.name + Date.now(),
            name: f.name,
            status: 'waiting',
            progress: 0,
            url: null
        }));
        setProcessList(initialList);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Processing開始
                setProcessList(prev => {
                    const newList = [...prev];
                    newList[i].status = 'processing';
                    return newList;
                });

<<<<<<< HEAD
            const compressedFile = await imageCompression(file, options);
            const url = URL.createObjectURL(compressedFile);
            
            setOutputUrl(url);
            setLog(`Done! ${(compressedFile.size / 1024).toFixed(1)} KB`);
            return url;
        } catch (error: any) {
            setError(error.message);
            return null;
=======
                // browser-image-compression の onProgress を使用
                const options = {
                    maxSizeMB: 1,
                    useWebWorker: true,
                    initialQuality: config.quality,
                    fileType: config.format === 'original' ? undefined : `image/${config.format}`,
                    onProgress: (p: number) => {
                        setProcessList(prev => {
                            const newList = [...prev];
                            newList[i].progress = p;
                            return newList;
                        });
                    }
                };

                let outputBlob: Blob = file;
                try {
                    if (config.format !== 'pdf') {
                        outputBlob = await imageCompression(file, options);
                    } else {
                        // PDF変換ロジックが必要ならここに記述（今回は省略または別処理）
                        // 簡易的にBlobそのまま渡す例
                    }
                } catch (e) {}

                const url = URL.createObjectURL(outputBlob);
                const ext = config.format === 'original' ? file.name.split('.').pop() : config.format;
                
                // Done
                setProcessList(prev => {
                    const newList = [...prev];
                    newList[i].status = 'done';
                    newList[i].progress = 100;
                    newList[i].url = url;
                    newList[i].name = `${file.name.split('.')[0]}.${ext}`;
                    return newList;
                });
            }
        } catch (err: any) {
             setProcessList(prev => {
                const idx = prev.findIndex(p => p.status === 'processing');
                if (idx !== -1) {
                    const newList = [...prev];
                    newList[idx].status = 'error';
                    newList[idx].errorMsg = err.message;
                    return newList;
                }
                return prev;
            });
>>>>>>> 8a92cacec6b709993ac994f025af737c1c0a3fcf
        } finally {
            setIsImageLoading(false);
        }
    };

    return { isImageLoading, processList, compressImages };
};
