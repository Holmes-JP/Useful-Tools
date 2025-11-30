import React, { useState, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
// エラー修正: FilterConfig をインポートに追加
import { useImageEditor, defaultFilters, type FilterConfig } from '@/hooks/useImageEditor';
import { Download, RefreshCcw, Sliders, Image as ImageIcon, Crop as CropIcon } from 'lucide-react';
import clsx from 'clsx';

export default function ImageEditor() {
    const {
        imgSrc, imgRef, previewCanvasRef,
        crop, setCrop, completedCrop, setCompletedCrop,
        filters, setFilters, aspect, setAspect,
        onSelectFile, canvasPreview, download
    } = useImageEditor();

    const [activeTab, setActiveTab] = useState<'crop' | 'adjust'>('crop');

    useEffect(() => {
        const t = setTimeout(() => canvasPreview(), 100);
        return () => clearTimeout(t);
    }, [completedCrop, filters, canvasPreview]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onSelectFile(e.target.files[0]);
        }
    };

    const resetFilters = () => setFilters(defaultFilters);

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 p-4">
            
            <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
                {!imgSrc ? (
                    <div className="text-center">
                        <div className="bg-gray-800 p-6 rounded-full inline-flex mb-4">
                            <ImageIcon size={48} className="text-primary-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Image Editor</h3>
                        <p className="text-gray-500 mb-6">Drop an image or select file to edit</p>
                        <label className="bg-primary-500 text-black font-bold px-6 py-3 rounded-full cursor-pointer hover:bg-primary-400 transition">
                            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                            Select Image
                        </label>
                    </div>
                ) : (
                    <div className="relative max-w-full max-h-full">
                        {/* @ts-ignore */}
                        <ReactCrop
                            crop={crop}
                            onChange={(_: PixelCrop, percentCrop: Crop) => setCrop(percentCrop)}
                            onComplete={(c: PixelCrop) => setCompletedCrop(c)}
                            aspect={aspect}
                            className="max-h-[70vh]"
                        >
                            <img
                                ref={imgRef}
                                src={imgSrc}
                                alt="Source"
                                style={{ 
                                    maxHeight: '70vh', 
                                    filter: activeTab === 'adjust' 
                                        ? `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) grayscale(${filters.grayscale}%) blur(${filters.blur}px)` 
                                        : 'none'
                                }}
                                // エラー修正: 未使用の変数を削除
                                onLoad={() => {
                                    setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
                                }}
                            />
                        </ReactCrop>
                    </div>
                )}
            </div>

            {imgSrc && (
                <div className="w-full lg:w-80 bg-surface border border-gray-700 rounded-2xl flex flex-col">
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
                                            { label: '16:9', val: 16/9 },
                                            { label: '4:3', val: 4/3 },
                                            { label: '9:16', val: 9/16 },
                                            { label: '3:2', val: 3/2 },
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
                                            onChange={(e) => setFilters({...filters, [f.key]: Number(e.target.value)})}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                        <button 
                            onClick={download}
                            className="w-full bg-primary-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-400 transition shadow-lg active:scale-95"
                        >
                            <Download size={20} /> Download Result
                        </button>
                        <canvas ref={previewCanvasRef} className="hidden" />
                    </div>
                </div>
            )}
        </div>
    );
}
