import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import type { ImageConfig } from '@/components/Tools/Settings/ImageSettings';

export const useImageConverter = () => {
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    // 修正: outputUrls を追加
    const [outputUrls, setOutputUrls] = useState<{name: string, url: string}[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev.slice(-19), msg]);

    const compressImages = async (files: File[], config: ImageConfig) => {
        setIsImageLoading(true); setLog([]); setOutputUrls([]);

        try {
            const results = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                addLog(`Processing: ${file.name}`);

                const options = {
                    maxSizeMB: 1,
                    useWebWorker: true,
                    fileType: config.format === 'original' ? undefined : `image/${config.format}`,
                    initialQuality: config.quality,
                    alwaysKeepResolution: true
                };

                let outputBlob: Blob = file;
                let isProcessed = false;
                try {
                    const compressedFile = await imageCompression(file, options);
                    if (compressedFile.size < file.size || config.format !== 'original') {
                        outputBlob = compressedFile;
                        isProcessed = true;
                    }
                } catch (e) {}

                const url = URL.createObjectURL(outputBlob);
                const ext = config.format === 'original' ? file.name.split('.').pop() || 'jpg' : config.format;
                const name = `${file.name.split('.')[0]}_${isProcessed ? 'min' : 'copy'}.${ext}`;
                results.push({ name, url });
            }
            setOutputUrls(results);
            addLog("All processed!");
        } catch (err: any) {
            addLog("Error: " + err.message);
        } finally {
            setIsImageLoading(false);
        }
    };

    return { isImageLoading, log, outputUrls, compressImages };
};
