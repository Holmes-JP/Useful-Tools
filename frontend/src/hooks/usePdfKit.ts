import { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';

export const usePdfKit = () => {
    const [isPdfWorking, setIsPdfWorking] = useState(false);
    const [pdfLog, setPdfLog] = useState('');

    const rotatePdf = async (file: File, angle: 90 | 180 | 270) => {
        setIsPdfWorking(true);
        setPdfLog('Rotating pages...');
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pages = pdfDoc.getPages();
            
            pages.forEach(page => {
                const currentRotation = page.getRotation().angle;
                page.setRotation(degrees(currentRotation + angle));
            });

            const pdfBytes = await pdfDoc.save();
            downloadBlob(pdfBytes, `rotated_${file.name}`);
            setPdfLog('Rotation complete.');
        } catch (e: any) {
            setPdfLog('Error: ' + e.message);
        } finally {
            setIsPdfWorking(false);
        }
    };

    const splitPdf = async (file: File) => {
        setIsPdfWorking(true);
        setPdfLog('Splitting pages...');
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pageCount = pdfDoc.getPageCount();
            
            for (let i = 0; i < pageCount; i++) {
                const newPdf = await PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
                newPdf.addPage(copiedPage);
                const pdfBytes = await newPdf.save();
                
                downloadBlob(pdfBytes, `${file.name.replace('.pdf', '')}_page_${i + 1}.pdf`);
                setPdfLog(`Saved page ${i + 1}/${pageCount}`);
                await new Promise(r => setTimeout(r, 500));
            }
            setPdfLog('All pages split!');
        } catch (e: any) {
            setPdfLog('Error: ' + e.message);
        } finally {
            setIsPdfWorking(false);
        }
    };

    const downloadBlob = (data: Uint8Array, filename: string) => {
        // 修正: data as any でBlobの型エラーを回避
        const blob = new Blob([data as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    return { isPdfWorking, pdfLog, rotatePdf, splitPdf };
};
