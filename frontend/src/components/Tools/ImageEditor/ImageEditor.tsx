import React, { useState, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    Download,
    RefreshCcw,
    Sliders,
    Image as ImageIcon,
    Crop as CropIcon,
    RotateCw,
    FlipHorizontal,
    FlipVertical,
    Settings2
} from 'lucide-react';
import clsx from 'clsx';
import { useImageEditor, type FilterConfig } from '@/hooks/useImageEditor';

export default function ImageEditor() {
    const {
        imgSrc, imgRef, previewCanvasRef,
        crop, setCrop, completedCrop, setCompletedCrop,
        filters, setFilters, aspect, setAspect,
        rotation, setRotation, flipX, setFlipX, flipY, setFlipY,
        exportScale, setExportScale, exportFormat, setExportFormat, exportQuality, setExportQuality,
        exportFileName, setExportFileName,
        enableTransparency, setEnableTransparency, transparencyTolerance, setTransparencyTolerance,
        onSelectFile, canvasPreview, download, resetFilters, resetTransform, resetAll, buildFilterString, fileName,
    } = useImageEditor();

    const [activeTab, setActiveTab] = useState<'crop' | 'adjust' | 'transform'>('crop');
    const [showTransparencyPreview, setShowTransparencyPreview] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => canvasPreview(), 80);
        return () => clearTimeout(t);
    }, [completedCrop, filters, rotation, flipX, flipY, exportScale, canvasPreview]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onSelectFile(e.target.files[0]);
        }
    };

    const rotateStep = (delta: number) => setRotation(prev => {
        let next = prev + delta;
        if (next > 180) next -= 360;
        if (next < -180) next += 360;
        return next;
    });

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onSelectFile(file);
        }
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-4 px-3 lg:px-4">
            <div
                className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col p-4 relative overflow-hidden"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={handleDrop}
            >
                <div className="w-full flex items-center gap-3 mb-3">
                    <label className="bg-primary-500 text-black font-bold px-3 py-2 rounded-lg cursor-pointer hover:bg-primary-400 transition text-sm shadow">
                        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                        Upload / Replace
                    </label>
                    {fileName && <span className="text-xs text-gray-400 truncate max-w-[220px]">Loaded: {fileName}</span>}
                    {!fileName && <span className="text-xs text-gray-500">Drag & drop an image or click Upload</span>}
                </div>

                {!imgSrc ? (
                    <div className="text-center flex-1 flex flex-col items-center justify-center">
                        <div className="bg-gray-800 p-6 rounded-full inline-flex mb-4">
                            <ImageIcon size={48} className="text-primary-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Image Editor</h3>
                        <p className="text-gray-500 mb-6">Drop an image anywhere in this panel or click Upload</p>
                        <label className="bg-primary-500 text-black font-bold px-6 py-3 rounded-full cursor-pointer hover:bg-primary-400 transition">
                            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                            Select Image
                        </label>
                    </div>
                ) : (
                    <div className="relative max-w-full max-h-full flex-1 flex items-center justify-center">
                        {/* @ts-ignore */}
                        <ReactCrop
                            crop={crop}
                            onChange={(_: PixelCrop, percentCrop: Crop) => setCrop(percentCrop)}
                            onComplete={(c: PixelCrop) => setCompletedCrop(c)}
                            aspect={aspect}
                            className="max-h-[70vh] flex items-center justify-center"
                        >
                            <img
                                ref={imgRef}
                                src={imgSrc}
                                alt="Source"
                                style={{
                                    maxHeight: '70vh',
                                    maxWidth: '100%',
                                    objectFit: 'contain',
                                    display: 'block',
                                    filter: buildFilterString(filters),
                                    transform: `rotate(${rotation}deg) scale(${(flipX ? -1 : 1) * exportScale}, ${(flipY ? -1 : 1) * exportScale})`,
                                    transformOrigin: 'center center',
                                }}
                                onLoad={(e) => {
                                    const img = e.currentTarget;
                                    setCompletedCrop({
                                        unit: 'px',
                                        width: img.width,
                                        height: img.height,
                                        x: 0,
                                        y: 0
                                    });
                                    setCrop(undefined);
                                }}
                            />
                        </ReactCrop>
                    </div>
                )}
            </div>

            {imgSrc && (
                <div className="w-full lg:w-[420px] bg-surface border border-gray-700 rounded-2xl flex flex-col">
                    <div className="flex border-b border-gray-700">
                        <button
                            onClick={() => setActiveTab('crop')}
                            className={clsx("flex-1 p-4 font-bold flex items-center justify-center gap-2", activeTab === 'crop' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400")}
                        >
                            <CropIcon size={18} /> Crop
                        </button>
                        <button
                            onClick={() => setActiveTab('adjust')}
                            className={clsx("flex-1 p-4 font-bold flex items-center justify-center gap-2", activeTab === 'adjust' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400")}
                        >
                            <Sliders size={18} /> Adjust
                        </button>
                        <button
                            onClick={() => setActiveTab('transform')}
                            className={clsx("flex-1 p-4 font-bold flex items-center justify-center gap-2", activeTab === 'transform' ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400")}
                        >
                            <Settings2 size={18} /> Export
                        </button>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'crop' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold mb-3 block">ASPECT RATIO</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'Free', val: undefined },
                                            { label: '1:1', val: 1 },
                                            { label: '16:9', val: 16 / 9 },
                                            { label: '4:3', val: 4 / 3 },
                                            { label: '9:16', val: 9 / 16 },
                                            { label: '3:2', val: 3 / 2 },
                                        ].map(opt => (
                                            <button
                                                key={opt.label}
                                                onClick={() => setAspect(opt.val)}
                                                className={clsx(
                                                    "py-2 rounded text-sm font-bold border",
                                                    aspect === opt.val
                                                        ? "bg-primary-500 text-black border-primary-500"
                                                        : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <button onClick={resetAll} className="text-xs text-red-400 flex items-center gap-1 hover:underline">
                                        <RefreshCcw size={12} /> Reset All
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'adjust' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-gray-500 font-bold">FILTERS</label>
                                    <button onClick={resetFilters} className="text-xs text-primary-500 flex items-center gap-1 hover:underline">
                                        <RefreshCcw size={12} /> Reset
                                    </button>
                                </div>

                                {[
                                    { label: 'Brightness', key: 'brightness', min: 0, max: 200 },
                                    { label: 'Contrast', key: 'contrast', min: 0, max: 200 },
                                    { label: 'Saturation', key: 'saturate', min: 0, max: 200 },
                                    { label: 'Grayscale', key: 'grayscale', min: 0, max: 100 },
                                    { label: 'Sepia', key: 'sepia', min: 0, max: 100 },
                                    { label: 'Invert', key: 'invert', min: 0, max: 100 },
                                    { label: 'Hue', key: 'hueRotate', min: -180, max: 180 },
                                    { label: 'Blur', key: 'blur', min: 0, max: 10 }
                                ].map(f => (
                                    <div key={f.label}>
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>{f.label}</span>
                                            <span>{filters[f.key as keyof FilterConfig]}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={f.min}
                                            max={f.max}
                                            value={filters[f.key as keyof FilterConfig]}
                                            onChange={(e) => setFilters({ ...filters, [f.key]: Number(e.target.value) })}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                        />
                                    </div>
                                ))}

                                <div className="border-t border-gray-800 pt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 font-bold">BACKGROUND</span>
                                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={enableTransparency}
                                                onChange={(e) => setEnableTransparency(e.target.checked)}
                                                className="accent-primary-500"
                                            />
                                            Make background transparent
                                        </label>
                                    </div>
                                    {enableTransparency && (
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>Similarity threshold</span>
                                                <span>{transparencyTolerance}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={120}
                                                value={transparencyTolerance}
                                                onChange={(e) => setTransparencyTolerance(Number(e.target.value))}
                                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                            />
                                            <p className="text-[11px] text-gray-500 mt-1">左上の色に近い領域を透過します。類似度はスライダーで調整してください。</p>
                                            <label className="mt-2 flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={showTransparencyPreview}
                                                    onChange={(e) => setShowTransparencyPreview(e.target.checked)}
                                                    className="accent-primary-500"
                                                />
                                                Show transparency preview
                                            </label>
                                            <div
                                                className={clsx(
                                                    "mt-2 rounded-lg border border-gray-700 p-2",
                                                    showTransparencyPreview ? "bg-[linear-gradient(45deg,#2c2f38_25%,transparent_25%,transparent_75%,#2c2f38_75%,#2c2f38),linear-gradient(45deg,#2c2f38_25%,transparent_25%,transparent_75%,#2c2f38_75%,#2c2f38)] bg-[length:12px_12px] bg-[position:0_0,6px_6px]" : ""
                                                )}
                                            >
                                                <canvas
                                                    ref={previewCanvasRef}
                                                    className={clsx("w-full h-auto max-h-64 object-contain", showTransparencyPreview ? "" : "hidden")}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'transform' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-gray-500 font-bold">ROTATE & FLIP</label>
                                    <button onClick={resetTransform} className="text-xs text-primary-500 flex items-center gap-1 hover:underline">
                                        <RefreshCcw size={12} /> Reset
                                    </button>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Rotation</span>
                                        <span>{rotation}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={-180}
                                        max={180}
                                        value={rotation}
                                        onChange={(e) => setRotation(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => rotateStep(-90)} className="flex-1 py-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm flex items-center justify-center gap-1">
                                            <RotateCw size={14} className="transform rotate-180" /> -90°
                                        </button>
                                        <button onClick={() => rotateStep(90)} className="flex-1 py-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm flex items-center justify-center gap-1">
                                            <RotateCw size={14} /> +90°
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setFlipX(v => !v)}
                                        className={clsx("py-2 rounded border text-sm font-bold flex items-center justify-center gap-2",
                                            flipX ? "bg-primary-500 text-black border-primary-500" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700")}
                                    >
                                        <FlipHorizontal size={14} /> Flip X
                                    </button>
                                    <button
                                        onClick={() => setFlipY(v => !v)}
                                        className={clsx("py-2 rounded border text-sm font-bold flex items-center justify-center gap-2",
                                            flipY ? "bg-primary-500 text-black border-primary-500" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700")}
                                    >
                                        <FlipVertical size={14} /> Flip Y
                                    </button>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Export Scale</span>
                                        <span>{Math.round(exportScale * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={50}
                                        max={200}
                                        value={exportScale * 100}
                                        onChange={(e) => setExportScale(Number(e.target.value) / 100)}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold">Export Name</label>
                                        <input
                                            type="text"
                                            value={exportFileName}
                                            onChange={(e) => setExportFileName(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm mt-1"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['png', 'jpeg', 'webp'] as const).map(fmt => (
                                            <button
                                                key={fmt}
                                                onClick={() => setExportFormat(fmt)}
                                                className={clsx("py-2 rounded text-sm font-bold border capitalize",
                                                    exportFormat === fmt
                                                        ? "bg-primary-500 text-black border-primary-500"
                                                        : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700")}
                                            >
                                                {fmt}
                                            </button>
                                        ))}
                                    </div>
                                    {exportFormat !== 'png' && (
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>Quality</span>
                                                <span>{Math.round(exportQuality * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={50}
                                                max={100}
                                                value={exportQuality * 100}
                                                onChange={(e) => setExportQuality(Number(e.target.value) / 100)}
                                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                        <button
                            onClick={download}
                            disabled={!completedCrop}
                            className="w-full bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-400 transition shadow-lg active:scale-95"
                        >
                            <Download size={20} /> Download Result
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
