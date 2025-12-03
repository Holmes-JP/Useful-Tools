import { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
// PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

import type { DocConfig } from '@/components/Tools/Settings/DocumentSettings';

export const usePdfConverter = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [outputUrls, setOutputUrls] = useState<{name: string, url: string}[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev.slice(-19), msg]);

    const processDocs = async (files: File[], config: DocConfig) => {
        setIsLoading(true);
        setLog([]);
        setOutputUrls([]);
        
        try {
            addLog("Starting process...");

            // Merge Mode
            if (config.mode === 'merge' && config.format === 'pdf') {
                if (files.length < 2) {
                    throw new Error("Merge requires at least 2 PDF files.");
                }
                addLog("Merging PDF files...");
                const mergedPdf = await PDFDocument.create();
                
                for (const file of files) {
                    if (file.type !== 'application/pdf') continue;
                    const buffer = await file.arrayBuffer();
                    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach(p => mergedPdf.addPage(p));
                }
                
                const bytes = await mergedPdf.save();
                const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
                setOutputUrls([{ name: 'merged_document.pdf', url }]);
                addLog("Merge complete!");
                return;
            }
            
            // Process files individually
            const results: {name: string, url: string}[] = [];
            
            for (const file of files) {
                addLog(`Processing: ${file.name}`);
                const buffer = await file.arrayBuffer();

                if (file.type === 'application/pdf') {
                    // Convert to Image (JPG/PNG)
                    if (config.format === 'jpg' || config.format === 'png') {
                        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const viewport = page.getViewport({ scale: 2.0 }); // High quality
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;
                            
                            if (context) {
                                await page.render({ canvasContext: context, viewport }).promise;
                                const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, `image/${config.imageFormat}`));
                                if (blob) {
                                    const url = URL.createObjectURL(blob);
                                    results.push({ name: `${file.name}_page${i}.${config.imageFormat}`, url });
                                }
                            }
                        }
                    } 
                    // Extract Text
                    else if (config.format === 'txt') {
                        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
                        let fullText = "";
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            // @ts-ignore
                            const str = content.items.map(item => item.str).join(' ');
                            fullText += `--- Page ${i} ---\n${str}\n\n`;
                        }
                        const url = URL.createObjectURL(new Blob([fullText], { type: 'text/plain' }));
                        results.push({ name: `${file.name}.txt`, url });
                    } 
                    // PDF Manipulation (Rotate, Split, Remove)
                    else {
                        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
                        
                        if (config.mode === 'rotate') {
                            pdfDoc.getPages().forEach(p => p.setRotation(degrees(p.getRotation().angle + config.rotateAngle)));
                        } 
                        else if (config.mode === 'remove_pages') {
                            const ranges = config.removePageRanges.split(/[,\s]+/);
                            const toRemove = new Set<number>();
                            ranges.forEach(r => {
                                if (r.includes('-')) {
                                    const [s, e] = r.split('-').map(n => parseInt(n) - 1);
                                    for (let k = s; k <= e; k++) toRemove.add(k);
                                } else {
                                    const n = parseInt(r) - 1;
                                    if (!isNaN(n)) toRemove.add(n);
                                }
                            });
                            // 降順で削除しないとインデックスがずれる
                            const sorted = Array.from(toRemove).sort((a, b) => b - a);
                            const pageCount = pdfDoc.getPageCount();
                            sorted.forEach(idx => {
                                if (idx >= 0 && idx < pageCount) pdfDoc.removePage(idx);
                            });
                        }
                        else if (config.mode === 'split') {
                            const count = pdfDoc.getPageCount();
                            for (let i = 0; i < count; i++) {
                                const newDoc = await PDFDocument.create();
                                const [p] = await newDoc.copyPages(pdfDoc, [i]);
                                newDoc.addPage(p);
                                const b = await newDoc.save();
                                const url = URL.createObjectURL(new Blob([b], { type: 'application/pdf' }));
                                results.push({ name: `${file.name}_page${i + 1}.pdf`, url });
                            }
                            continue; // 次のファイルへ（splitの場合はここで追加済み）
                        }

                        const bytes = await pdfDoc.save();
                        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
                        results.push({ name: `processed_${file.name}`, url });
                    }
                }
            }
            
            setOutputUrls(results);
            addLog("All operations completed.");
            
        } catch (e: any) {
            console.error(e);
            addLog("Error: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, log, outputUrls, processDocs };
};
