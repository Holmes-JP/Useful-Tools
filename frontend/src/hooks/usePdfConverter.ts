import { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
// インポートパスを修正
import type { DocConfig } from '@/components/Tools/Settings/DocumentSettings';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export const usePdfConverter = () => {
<<<<<<< HEAD
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [pdfLog, setPdfLog] = useState<string>('');
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [pdfOutputUrl, setPdfOutputUrl] = useState<string | null>(null);

    const addLog = (msg: string) => setPdfLog(prev => prev ? `${prev}\n${msg}` : msg);

    const mergePdfs = async (files: File[]): Promise<string | null> => {
        setIsPdfLoading(true);
        setPdfError(null);
        setPdfOutputUrl(null);
        setPdfLog('');
        try {
            addLog(`Merging ${files.length} file(s)...`);
            const mergedPdf = await PDFDocument.create();

            for (const file of files) {
                addLog(`Loading ${file.name}...`);
                const ab = await file.arrayBuffer();
                const uint8 = new Uint8Array(ab);

                let srcPdf: PDFDocument | null = null;
                try {
                    srcPdf = await PDFDocument.load(uint8);
                } catch (err) {
                    try {
                        srcPdf = await PDFDocument.load(uint8, { ignoreEncryption: true as any });
                    } catch (err2: any) {
                        throw new Error(`Failed to load PDF '${file.name}': ${err2?.message || String(err2)}`);
                    }
                }

                const pageCount = srcPdf.getPageCount();
                addLog(`${file.name}: ${pageCount} page(s)`);

                for (let idx = 0; idx < pageCount; idx++) {
                    try {
                        const copied = await mergedPdf.copyPages(srcPdf, [idx]);
                        if (copied && copied.length > 0) mergedPdf.addPage(copied[0]);
                    } catch (singleErr: any) {
                        throw new Error(`Failed to copy page ${idx} from '${file.name}': ${singleErr?.message || String(singleErr)}`);
                    }
                }
            }

            // clear simple metadata if present
            try {
                mergedPdf.setTitle('');
                mergedPdf.setAuthor('');
                mergedPdf.setSubject('');
                mergedPdf.setKeywords([]);
            } catch (e) { /* ignore if not supported */ }

            const bytes = await mergedPdf.save();
            const blob = new Blob([bytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setPdfOutputUrl(url);
            addLog('Merge complete');
            return url;
        } catch (e: any) {
            console.error(e);
            setPdfError(e?.message || String(e));
            addLog(`Error: ${e?.message || String(e)}`);
            return null;
        } finally {
            setIsPdfLoading(false);
        }
    };

    const pdfToText = async (file: File): Promise<string | null> => {
        setIsPdfLoading(true);
        setPdfError(null);
        try {
            addLog(`Converting ${file.name} to text...`);
            const ab = await file.arrayBuffer();
            // dynamic import to avoid bundling pdfjs unless used
            // @ts-ignore
            const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf');

            try {
                // @ts-ignore
                const workerSrcModule: any = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
                const workerSrc: string = workerSrcModule?.default || workerSrcModule;
                if (pdfjs.GlobalWorkerOptions && workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
            } catch (e) {
                // ignore worker assignment failure
            }

            const loadingTask = pdfjs.getDocument({ data: ab, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true });
            const pdfDoc = await loadingTask.promise;
            const pageCount = pdfDoc.numPages || 0;
            let fullText = '';
            for (let i = 1; i <= pageCount; i++) {
                const page = await pdfDoc.getPage(i);
                const content = await page.getTextContent();
                const strings = (content.items || []).map((it: any) => it.str || '').join(' ');
                fullText += `--- Page ${i} ---\n${strings}\n\n`;
            }

            const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            setPdfOutputUrl(url);
            addLog('Converted to text');
            return url;
        } catch (e: any) {
            console.error(e);
            setPdfError(e?.message || String(e));
            addLog(`Error: ${e?.message || String(e)}`);
            return null;
        } finally {
            setIsPdfLoading(false);
        }
    };

    return { isPdfLoading, pdfLog, pdfError, pdfOutputUrl, mergePdfs, pdfToText };
=======
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [outputUrls, setOutputUrls] = useState<{name: string, url: string}[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev.slice(-19), msg]);

    const processDocs = async (files: File[], config: DocConfig) => {
        setIsLoading(true); setLog([]); setOutputUrls([]);
        try {
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
                setOutputUrls([{ name: 'merged.pdf', url: URL.createObjectURL(new Blob([bytes as any], { type: 'application/pdf' })) }]);
                addLog("Merge complete.");
                return;
            }
            
            const results = [];
            for (const file of files) {
                addLog(`Processing: ${file.name}`);
                const buffer = await file.arrayBuffer();
                if (file.type === 'application/pdf') {
                    if (config.format === 'jpg' || config.format === 'png') {
                        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const viewport = page.getViewport({ scale: 2.0 });
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            canvas.height = viewport.height; canvas.width = viewport.width;
                            if (context) {
                                await page.render({ canvasContext: context, viewport } as any).promise;
                                const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, `image/${config.imageFormat}`));
                                if (blob) results.push({ name: `${file.name}_p${i}.${config.imageFormat}`, url: URL.createObjectURL(blob) });
                            }
                        }
                    } else if (config.format === 'txt') {
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
                    } else {
                        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
                        if (config.mode === 'rotate') pdfDoc.getPages().forEach(p => p.setRotation(degrees(p.getRotation().angle + config.rotateAngle)));
                        else if (config.mode === 'remove_pages') {
                            const ranges = config.removePageRanges.split(/[,\s]+/);
                            const toRemove = new Set<number>();
                            // 型指定を追加
                            ranges.forEach((r: string) => {
                                if(r.includes('-')) {
                                    const [s, e] = r.split('-').map((n: string) => parseInt(n)-1);
                                    for(let k=s; k<=e; k++) toRemove.add(k);
                                } else {
                                    const n = parseInt(r) - 1;
                                    if(!isNaN(n)) toRemove.add(n);
                                }
                            });
                            const sorted = Array.from(toRemove).sort((a, b) => b - a);
                            sorted.forEach(idx => { if(idx >= 0 && idx < pdfDoc.getPageCount()) pdfDoc.removePage(idx); });
                        }
                        else if (config.mode === 'split') {
                            const count = pdfDoc.getPageCount();
                            for (let i = 0; i < count; i++) {
                                const newDoc = await PDFDocument.create();
                                const [p] = await newDoc.copyPages(pdfDoc, [i]);
                                newDoc.addPage(p);
                                const b = await newDoc.save();
                                results.push({ name: `${file.name}_p${i+1}.pdf`, url: URL.createObjectURL(new Blob([b as any], { type: 'application/pdf' })) });
                            }
                            continue;
                        }
                        const bytes = await pdfDoc.save();
                        results.push({ name: `edited_${file.name}`, url: URL.createObjectURL(new Blob([bytes as any], { type: 'application/pdf' })) });
                    }
                }
            }
            setOutputUrls(results);
            addLog("Completed.");
        } catch (e: any) { addLog("Error: " + e.message); } finally { setIsLoading(false); }
    };
    return { isLoading, log, outputUrls, processDocs };
>>>>>>> 8a92cacec6b709993ac994f025af737c1c0a3fcf
};
