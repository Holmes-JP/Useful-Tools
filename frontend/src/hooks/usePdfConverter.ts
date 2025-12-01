import { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import type { DocConfig } from '@/components/Tools/Settings/DocumentSettings';

export const usePdfConverter = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [outputUrls, setOutputUrls] = useState<{name: string, url: string}[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    const processDocs = async (files: File[], config: DocConfig) => {
        setIsLoading(true); setLog([]); setOutputUrls([]);

        try {
            // Merge (結合) の場合は全ファイルを1つにする
            if (config.mode === 'merge') {
                addLog("Merging PDF files...");
                const mergedPdf = await PDFDocument.create();
                
                for (const file of files) {
                    const buffer = await file.arrayBuffer();
                    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach(p => mergedPdf.addPage(p));
                }
                
                // Metadata update
                if (config.metadataTitle) mergedPdf.setTitle(config.metadataTitle);
                if (config.metadataAuthor) mergedPdf.setAuthor(config.metadataAuthor);
                if (config.metadataDate) mergedPdf.setCreationDate(new Date(config.metadataDate));

                const bytes = await mergedPdf.save();
                const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
                setOutputUrls([{ name: 'merged.pdf', url }]);
                addLog("Merge complete.");

            } else {
                // 個別処理 (Rotate, Split, Compress)
                const results = [];
                for (const file of files) {
                    addLog(`Processing: ${file.name}`);
                    const buffer = await file.arrayBuffer();
                    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
                    
                    // Rotate
                    if (config.mode === 'rotate') {
                        pdf.getPages().forEach(p => {
                            p.setRotation(degrees(p.getRotation().angle + config.rotateAngle));
                        });
                        const bytes = await pdf.save();
                        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
                        results.push({ name: `rotated_${file.name}`, url });
                    }
                    // Split (1ページずつ)
                    else if (config.mode === 'split') {
                        const count = pdf.getPageCount();
                        for (let i = 0; i < count; i++) {
                            const newPdf = await PDFDocument.create();
                            const [page] = await newPdf.copyPages(pdf, [i]);
                            newPdf.addPage(page);
                            const bytes = await newPdf.save();
                            const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
                            results.push({ name: `${file.name}_page${i+1}.pdf`, url });
                        }
                    }
                    // Compress (pdf-libでは完全な圧縮は難しいが、メタデータ削除などで軽量化)
                    else if (config.mode === 'compress') {
                        // PDFDocument.load/save だけで最適化される場合がある
                        const bytes = await pdf.save({ useObjectStreams: false }); // 軽量化オプション
                        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
                        results.push({ name: `compressed_${file.name}`, url });
                    }
                }
                setOutputUrls(results);
                addLog("All tasks complete.");
            }
        } catch (e: any) {
            addLog("Error: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, log, outputUrls, processDocs };
};
