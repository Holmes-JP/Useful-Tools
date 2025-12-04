import { useState, useRef, useCallback } from 'react';
import { type Crop, type PixelCrop } from 'react-image-crop';

export type FilterConfig = {
    brightness: number;
    contrast: number;
    saturate: number;
    grayscale: number;
    sepia: number;
    invert: number;
    hueRotate: number;
    blur: number;
};

export const defaultFilters: FilterConfig = {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    hueRotate: 0,
    blur: 0,
};

type ExportFormat = 'png' | 'jpeg' | 'webp';

export const useImageEditor = () => {
    const [imgSrc, setImgSrc] = useState('');
    const [fileName, setFileName] = useState('');
    const imgRef = useRef<HTMLImageElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [filters, setFilters] = useState<FilterConfig>(defaultFilters);
    const [aspect, setAspect] = useState<number | undefined>(undefined);
    const [rotation, setRotation] = useState(0);
    const [flipX, setFlipX] = useState(false);
    const [flipY, setFlipY] = useState(false);
    const [exportScale, setExportScale] = useState(1);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
    const [exportQuality, setExportQuality] = useState(0.92);
    const [exportFileName, setExportFileName] = useState('edited_image');
    const [enableTransparency, setEnableTransparency] = useState(false);
    const [transparencyTolerance, setTransparencyTolerance] = useState(30);

    const onSelectFile = (file: File) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
        reader.readAsDataURL(file);
        const base = file.name.replace(/\.[^/.]+$/, '');
        setExportFileName(`${base}_edited`);
        setFileName(file.name);
        setTransparencyTolerance(30);
    };

    const buildFilterString = (f: FilterConfig) =>
        `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) grayscale(${f.grayscale}%) sepia(${f.sepia}%) invert(${f.invert}%) hue-rotate(${f.hueRotate}deg) blur(${f.blur}px)`;

    const canvasPreview = useCallback(async () => {
        const image = imgRef.current;
        const canvas = previewCanvasRef.current;
        if (!image || !canvas || !completedCrop) return;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pixelRatio = window.devicePixelRatio || 1;
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const cropW = completedCrop.width * scaleX;
        const cropH = completedCrop.height * scaleY;

        const drawW = cropW * exportScale;
        const drawH = cropH * exportScale;

        const rotatedWidth = Math.abs(drawW * cos) + Math.abs(drawH * sin);
        const rotatedHeight = Math.abs(drawW * sin) + Math.abs(drawH * cos);

        canvas.width = rotatedWidth * pixelRatio;
        canvas.height = rotatedHeight * pixelRatio;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';
        ctx.filter = buildFilterString(filters);

        ctx.clearRect(0, 0, rotatedWidth, rotatedHeight);
        ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
        ctx.rotate(rad);
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

        ctx.drawImage(
            image,
            cropX,
            cropY,
            cropW,
            cropH,
            -drawW / 2,
            -drawH / 2,
            drawW,
            drawH
        );
        if (enableTransparency) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const tol = transparencyTolerance;
            const baseR = data[0];
            const baseG = data[1];
            const baseB = data[2];
            for (let i = 0; i < data.length; i += 4) {
                const dr = Math.abs(data[i] - baseR);
                const dg = Math.abs(data[i + 1] - baseG);
                const db = Math.abs(data[i + 2] - baseB);
                if (dr <= tol && dg <= tol && db <= tol) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);
        }
    }, [completedCrop, filters, rotation, flipX, flipY, exportScale, enableTransparency, transparencyTolerance]);

    const download = () => {
        const canvas = previewCanvasRef.current;
        if (!canvas) return;
        const mime = exportFormat === 'png' ? 'image/png' : exportFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
        const quality = exportFormat === 'png' ? undefined : exportQuality;
        const ext = exportFormat === 'jpeg' ? 'jpg' : exportFormat;
        const name = `${exportFileName || 'edited_image'}.${ext}`;

        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.download = name;
                a.href = url;
                a.click();
                URL.revokeObjectURL(url);
            },
            mime,
            quality
        );
    };

    const resetFilters = () => setFilters(defaultFilters);
    const resetTransform = () => {
        setRotation(0);
        setFlipX(false);
        setFlipY(false);
        setExportScale(1);
    };
    const resetAll = () => {
        resetFilters();
        resetTransform();
        setAspect(undefined);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setEnableTransparency(false);
        setTransparencyTolerance(30);
    };

    return {
        imgSrc,
        setImgSrc,
        fileName,
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
        rotation,
        setRotation,
        flipX,
        setFlipX,
        flipY,
        setFlipY,
        exportScale,
        setExportScale,
        exportFormat,
        setExportFormat,
        exportQuality,
        setExportQuality,
        exportFileName,
        setExportFileName,
        enableTransparency,
        setEnableTransparency,
        transparencyTolerance,
        setTransparencyTolerance,
        onSelectFile,
        canvasPreview,
        download,
        resetFilters,
        resetTransform,
        resetAll,
        buildFilterString,
    };
};
