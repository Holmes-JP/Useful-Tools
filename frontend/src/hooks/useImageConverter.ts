import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { ImageConfig } from '../components/Tools/Settings/ImageSettings';

export const useImageConverter = () => {
    const [isImageLoading, setIsLoading] = useState(false);
    const [imageLog, setLog] = useState<string>("");
    const [imageError, setError] = useState<string | null>(null);
    const [imageOutputUrl, setOutputUrl] = useState<string | null>(null);

    const compressImages = async (files: File[], config: ImageConfig) => {
        setIsLoading(true);
        setLog("Compressing...");
        setError(null);
        setOutputUrl(null);

        try {
            const file = files[0];
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: config.maxWidth > 0 ? config.maxWidth : undefined,
                useWebWorker: true,
                fileType: config.format === 'original' ? undefined : `image/${config.format}`,
                initialQuality: config.quality
            };

            const compressedFile = await imageCompression(file, options);
            const url = URL.createObjectURL(compressedFile);
            
            setOutputUrl(url);
            setLog(`Done! ${(compressedFile.size / 1024).toFixed(1)} KB`);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { isImageLoading, imageLog, imageError, imageOutputUrl, compressImages };
};
