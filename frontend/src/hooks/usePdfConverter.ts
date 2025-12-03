import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

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
            for (const file of files) {
                const buffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(buffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            
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

    return { isPdfLoading, pdfLog, pdfError, pdfOutputUrl, mergePdfs };
};
