import { useState, useRef, useCallback } from 'react';
import { PixelCrop } from 'react-image-crop';

export type FilterConfig = {
    brightness: number; // 100%
    contrast: number;   // 100%
    saturate: number;   // 100%
    grayscale: number;  // 0%
    blur: number;       // 0px
};

export const defaultFilters: FilterConfig = {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    blur: 0,
};

export const useImageEditor = () => {
    const [imgSrc, setImgSrc] = useState('');
    const imgRef = useRef<HTMLImageElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [crop, setCrop] = useState<PixelCrop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [filters, setFilters] = useState<FilterConfig>(defaultFilters);
    const [aspect, setAspect] = useState<number | undefined>(undefined);

    // 画像読み込み
    const onSelectFile = (file: File) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
        reader.readAsDataURL(file);
    };

    // Canvasへの描画（フィルター & 切り抜き適用）
    const canvasPreview = useCallback(async () => {
        const image = imgRef.current;
        const canvas = previewCanvasRef.current;
        if (!image || !canvas || !completedCrop) return;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pixelRatio = window.devicePixelRatio;

        // キャンバスサイズを切り抜きサイズに合わせる
        canvas.width = completedCrop.width * pixelRatio * scaleX;
        canvas.height = completedCrop.height * pixelRatio * scaleY;

        ctx.scale(pixelRatio, pixelRatio);
        ctx.imageSmoothingQuality = 'high';

        // フィルターの適用 string作成
        const filterStr = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) grayscale(${filters.grayscale}%) blur(${filters.blur}px)`;
        ctx.filter = filterStr;

        // 切り抜き描画
        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const cropW = completedCrop.width * scaleX;
        const cropH = completedCrop.height * scaleY;

        // 描画
        // 引数: image, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH
        ctx.drawImage(
            image,
            cropX,
            cropY,
            cropW,
            cropH,
            0,
            0,
            cropW,
            cropH
        );
        
    }, [completedCrop, filters]);

    // ダウンロード処理
    const download = () => {
        const canvas = previewCanvasRef.current;
        if (!canvas) return;
        
        // Canvasの内容をBlob化してDL
        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = 'edited_image.png';
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    };

    return {
        imgSrc,
        setImgSrc,
        imgRef,
        previewCanvasRef,
        crop,
        setCrop,
        completedCrop,
        setCompletedCrop,
        filters,
        setFilters,
        aspect,
        setAspect,
        onSelectFile,
        canvasPreview,
        download
    };
};
