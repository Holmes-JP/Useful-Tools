import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';
import type { ImageConfig } from '@/components/Tools/Settings/ImageSettings';

export const useImageConverter = () => {
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [outputUrls, setOutputUrls] = useState<{name: string, url: string}[]>([]);
    const addLog = (msg: string) => setLog(prev => [...prev.slice(-19), msg]);

    const compressImages = async (files: File[], config: ImageConfig) => {
        setIsImageLoading(true); setLog([]); setOutputUrls([]);
        try {
            const results = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                addLog(`Processing: ${file.name}`);
                if (config.format === 'pdf') {
                    // PDFロジック
                    try {
                        const pdfDoc = await PDFDocument.create();
                        const buffer = await file.arrayBuffer();
                        let image;
                        if (file.type === 'image/jpeg') image = await pdfDoc.embedJpg(buffer);
                        else if (file.type === 'image/png') image = await pdfDoc.embedPng(buffer);
                        else {
                            const jpgFile = await imageCompression(file, { maxSizeMB: 1, useWebWorker: true, fileType: 'image/jpeg' });
                            image = await pdfDoc.embedJpg(await jpgFile.arrayBuffer());
                        }
                        const page = pdfDoc.addPage([image.width, image.height]);
                        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
                        const pdfBytes = await pdfDoc.save();
                        // 修正: as any
                        const url = URL.createObjectURL(new Blob([pdfBytes as any], { type: 'application/pdf' }));
                        results.push({ name: `${file.name.split('.')[0]}.pdf`, url });
                    } catch (e: any) { addLog(`Error: ${e.message}`); }
                    continue;
                }
                // 通常圧縮
                const options = { maxSizeMB: 1, useWebWorker: true, fileType: config.format === 'original' ? undefined : `image/${config.format}`, initialQuality: config.quality };
                let outputBlob = file;
                try {
                    const compressedFile = await imageCompression(file, options);
                    outputBlob = compressedFile;
                } catch (e) {}
                const url = URL.createObjectURL(outputBlob);
                const ext = config.format === 'original' ? file.name.split('.').pop() || 'jpg' : config.format;
                results.push({ name: `compressed_${file.name.split('.')[0]}.${ext}`, url });
            }
            setOutputUrls(results);
            addLog("Done!");
        } catch (err: any) { addLog("Error: " + err.message); } finally { setIsImageLoading(false); }
    };
    return { isImageLoading, log, outputUrls, compressImages };
};
