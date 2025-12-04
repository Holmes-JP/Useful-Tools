import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export const usePdfConverter = () => {
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
};
