import { useState } from 'react';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export const usePdfConverter = () => {
    const [isPdfLoading, setIsLoading] = useState(false);
    const [pdfLog, setLog] = useState<string>("");
    const [pdfError, setError] = useState<string | null>(null);
    const [pdfOutputUrl, setOutputUrl] = useState<string | null>(null);

    const mergePdfs = async (files: File[]) => {
        setIsLoading(true);
        setLog("Merging PDFs...");
        setError(null);
        
        try {
            const mergedPdf = await PDFDocument.create();

            // helper: convert plain text file to PDF bytes
                const textFileToPdfBytes = async (file: File) => {
                const text = await file.text();
                const doc = await PDFDocument.create();
                const font = await doc.embedFont(StandardFonts.Helvetica);
                let page = doc.addPage();
                const { width, height } = page.getSize();
                const margin = 36;
                const fontSize = 12;
                const lineHeight = fontSize + 4;
                let x = margin;
                let y = height - margin;

                const lines = text.split(/\r?\n/);
                    for (const rawLine of lines) {
                    // simple wrap by splitting long lines
                    const words = rawLine.split(' ');
                    let line = '';
                    for (const word of words) {
                        const testLine = line ? line + ' ' + word : word;
                        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
                            if (textWidth + margin * 2 > width) {
                            // draw current line
                            page.drawText(line, { x, y, size: fontSize, font });
                            y -= lineHeight;
                            line = word;
                            if (y < margin) {
                                // add new page
                                    const newPage = doc.addPage();
                                    y = newPage.getSize().height - margin;
                                    page = newPage; // reassign page for subsequent draws
                            }
                        } else {
                            line = testLine;
                        }
                    }
                    if (line) {
                        page.drawText(line, { x, y, size: fontSize, font });
                        y -= lineHeight;
                    }
                    if (y < margin) {
                        const newPage = doc.addPage();
                        y = newPage.getSize().height - margin;
                        page = newPage;
                    }
                }

                const pdfBytes = await doc.save();
                return pdfBytes;
            };

            for (const file of files) {
                setLog(`Processing ${file.name} ...`);
                // normalize to Uint8Array for pdf-lib
                let uint8: Uint8Array;
                const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                if (isPdf) {
                    const ab = await file.arrayBuffer();
                    uint8 = new Uint8Array(ab);
                } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
                    const pdfBytes = await textFileToPdfBytes(file);
                    uint8 = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes as any);
                } else {
                    // For non-pdf files that reached here, attempt to read as arrayBuffer and try to load as PDF
                    const ab = await file.arrayBuffer();
                    uint8 = new Uint8Array(ab);
                }

                let srcPdf: any = null;
                try {
                    try {
                        srcPdf = await PDFDocument.load(uint8);
                    } catch (loadErr) {
                        // retry with ignoreEncryption
                        srcPdf = await PDFDocument.load(uint8, { ignoreEncryption: true as any });
                    }
                } catch (loadFinalErr: any) {
                    throw new Error(`Failed to load PDF '${file.name}': ${loadFinalErr?.message || String(loadFinalErr)}`);
                }

                if (!srcPdf) {
                    throw new Error(`Failed to load PDF '${file.name}': unknown error`);
                }

                // copy pages safely
                try {
                    const indices = srcPdf.getPageIndices?.();
                    setLog(`Loaded ${file.name} (${indices?.length ?? 0} pages)`);

                    if (!indices || indices.length === 0) {
                        // skip files with no pages
                        continue;
                    }

                    // copy pages one-by-one to isolate failing index if any
                    for (const idx of indices) {
                        try {
                            const copied = await mergedPdf.copyPages(srcPdf, [idx]);
                            if (!copied || copied.length === 0 || !copied[0]) {
                                throw new Error(`copyPages returned invalid result for index ${idx}`);
                            }
                            mergedPdf.addPage(copied[0]);
                        } catch (singleErr: any) {
                            // rethrow with contextual information
                            throw new Error(`Failed to copy page ${idx} from '${file.name}': ${singleErr?.message || String(singleErr)}`);
                        }
                    }
                } catch (copyErr: any) {
                    throw copyErr;
                }
            }
            
            // Ensure merged PDF metadata is cleared
            try {
                mergedPdf.setTitle('');
                mergedPdf.setAuthor('');
                mergedPdf.setSubject('');
                mergedPdf.setKeywords([]);
            } catch (e) { /* ignore if not supported */ }

            const pdfBytes = await mergedPdf.save();
            
            // Fix: 'pdfBytes as any' to bypass Uint8Array/BlobPart type mismatch
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            setOutputUrl(url);
            setLog("Merged successfully!");
            return url;
        } catch (e: any) {
            console.error(e);
            setError(e.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Convert a single PDF File to plain text using pdfjs-dist at runtime
    const pdfToText = async (file: File) => {
        setIsLoading(true);
        setError(null);
        setLog(`Converting ${file.name} to text...`);
        try {
            const ab = await file.arrayBuffer();
            // dynamic import to avoid bundling pdfjs unnecessarily unless used
            // @ts-ignore - runtime import of pdfjs-dist (may not be present until npm install)
            const pdfjs: any = await import('pdfjs-dist');
            
            // Provide the bundled worker URL so pdf.js can start its worker without relying on CDN paths
            try {
                const workerSrcModule: any = await import('pdfjs-dist/build/pdf.worker.min.js?url');
                const workerSrc: string = workerSrcModule?.default || workerSrcModule;
                // @ts-ignore - runtime assign for pdfjs
                if (pdfjs.GlobalWorkerOptions && workerSrc) {
                    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
                }
            } catch (e) {
                // ignore
            }

            // Load document with the configured worker source
            const loadingTask = pdfjs.getDocument({ 
                data: ab, 
                useWorkerFetch: false,
                isEvalSupported: false,
                useSystemFonts: true
            });
            const pdfDoc = await loadingTask.promise;
            const pageCount = pdfDoc.numPages || 0;
            let fullText = '';
            for (let i = 1; i <= pageCount; i++) {
                const page = await pdfDoc.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items.map((it: any) => (it.str || '')).join('');
                fullText += strings + '\n\n';
            }

            const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);
            setLog('Converted to text');
            return url;
        } catch (e: any) {
            console.error(e);
            setError(e?.message || String(e));
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { isPdfLoading, pdfLog, pdfError, pdfOutputUrl, mergePdfs, pdfToText };
};
