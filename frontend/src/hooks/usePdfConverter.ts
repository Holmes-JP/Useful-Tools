import { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib'; // 修正: 未使用の rgb, StandardFonts を削除
import * as pdfjsLib from 'pdfjs-dist';
import type { DocConfig } from '@/components/Tools/Settings/DocumentSettings';

// Worker設定
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export const usePdfConverter = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [outputUrls, setOutputUrls] = useState<{name: string, url: string}[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev.slice(-19), msg]);

    const processDocs = async (files: File[], config: DocConfig) => {
        setIsLoading(true); setLog([]); setOutputUrls([]);

        try {
            // 1. 結合モード (Merge) - PDFのみ
            if (config.mode === 'merge' && config.format === 'pdf') {
                addLog("Merging PDF files...");
                const mergedPdf = await PDFDocument.create();
                
                for (const file of files) {
                    if (file.type === 'application/pdf') {
                        const buffer = await file.arrayBuffer();
                        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
                        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                        copiedPages.forEach(p => mergedPdf.addPage(p));
                    }
                }
                const bytes = await mergedPdf.save();
                // 修正: as any
                setOutputUrls([{ name: 'merged.pdf', url: URL.createObjectURL(new Blob([bytes as any], { type: 'application/pdf' })) }]);
                addLog("Merge complete.");
                return;
            }

            // 2. 個別ファイル処理
            const results = [];
            for (const file of files) {
                // PDFファイルのみ処理
                if (file.type !== 'application/pdf') continue;
                
                addLog(`Processing: ${file.name}`);
                const buffer = await file.arrayBuffer();

                // A. PDF -> Image
                if (config.format === 'jpg' || config.format === 'png') {
                    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 2.0 });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        if (context) {
                            // 修正: RenderParameters の型エラーを回避するため as any を使用
                            await page.render({ canvasContext: context, viewport } as any).promise;
                            
                            const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, `image/${config.imageFormat}`));
                            if (blob) {
                                results.push({ name: `${file.name}_p${i}.${config.imageFormat}`, url: URL.createObjectURL(blob) });
                            }
                        }
                    }
                }
                // B. PDF -> Text
                else if (config.format === 'txt') {
                    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
                    let fullText = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        // @ts-ignore
                        const str = content.items.map(item => item.str).join(' ');
                        fullText += str + "\n\n";
                    }
                    results.push({ name: `${file.name}.txt`, url: URL.createObjectURL(new Blob([fullText], { type: 'text/plain' })) });
                }
                // C. PDF 編集 (Rotate, Split, Remove)
                else if (config.format === 'pdf') {
                    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

                    if (config.mode === 'rotate') {
                        pdfDoc.getPages().forEach(p => p.setRotation(degrees(p.getRotation().angle + config.rotateAngle)));
                    }
                    else if (config.mode === 'remove_pages') {
                        const ranges = config.removePageRanges.split(/[,\s]+/);
                        const toRemove = new Set<number>();
                        ranges.forEach(r => {
                            if(r.includes('-')) {
                                const [s, e] = r.split('-').map(n => parseInt(n)-1);
                                for(let k=s; k<=e; k++) toRemove.add(k);
                            } else {
                                const n = parseInt(r) - 1;
                                if(!isNaN(n)) toRemove.add(n);
                            }
                        });
                        const sorted = Array.from(toRemove).sort((a, b) => b - a);
                        sorted.forEach(idx => {
                            if(idx >= 0 && idx < pdfDoc.getPageCount()) pdfDoc.removePage(idx);
                        });
                    }
                    else if (config.mode === 'split') {
                        const count = pdfDoc.getPageCount();
                        for (let i = 0; i < count; i++) {
                            const newDoc = await PDFDocument.create();
                            const [p] = await newDoc.copyPages(pdfDoc, [i]);
                            newDoc.addPage(p);
                            const b = await newDoc.save();
                            // 修正: as any
                            results.push({ name: `${file.name}_p${i+1}.pdf`, url: URL.createObjectURL(new Blob([b as any], { type: 'application/pdf' })) });
                        }
                        continue;
                    }

                    const bytes = await pdfDoc.save();
                    // 修正: as any
                    results.push({ name: `edited_${file.name}`, url: URL.createObjectURL(new Blob([bytes as any], { type: 'application/pdf' })) });
                }
            }
            setOutputUrls(results);
            addLog("Completed.");

        } catch (e: any) {
            console.error(e);
            addLog("Error: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, log, outputUrls, processDocs };
};
