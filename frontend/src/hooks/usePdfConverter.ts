import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export const usePdfConverter = () => {
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [pdfLog, setPdfLog] = useState<string>("");
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [pdfOutputUrl, setPdfOutputUrl] = useState<string | null>(null);

    // 複数のPDFを結合する関数
    const mergePdfs = async (files: File[]) => {
        setIsPdfLoading(true);
        setPdfError(null);
        setPdfOutputUrl(null);
        setPdfLog("Loading PDFs...");

        try {
            // 1. 空の新しいPDFを作成
            const mergedPdf = await PDFDocument.create();

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setPdfLog(`Processing ${file.name} (${i + 1}/${files.length})...`);

                try {
                    // ファイルをArrayBufferとして読み込む
                    const arrayBuffer = await file.arrayBuffer();
                    
                    // 【修正ポイント1】暗号化フラグを無視する設定を追加（誤検知対策）
                    let pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

                    // 【修正ポイント2: サニタイズ処理】
                    // 構造エラーを回避するため、一度メモリ上で保存して構造を再構築させる
                    // これにより "Expected instance of PDFDict" エラーを回避できる場合がある
                    const sanitizedBytes = await pdf.save();
                    pdf = await PDFDocument.load(sanitizedBytes);
                    
                    // 全ページをコピー
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    
                    // 新しいPDFに追加
                    copiedPages.forEach((page) => mergedPdf.addPage(page));

                } catch (innerErr: any) {
                    console.warn(`Skipping file ${file.name} due to error:`, innerErr);
                    // 1つのファイルがダメでも、エラーを出して止まるのではなく
                    // ログに出してスキップするか、ここで全体をエラーにするか選べます。
                    // 今回は原因特定のためにエラーとして投げます。
                    throw new Error(`Failed to process "${file.name}": ${innerErr.message}`);
                }
            }

            setPdfLog("Finalizing merged PDF...");
            
            // 2. 結合したPDFを保存
            const pdfBytes = await mergedPdf.save();
            
            // 3. ダウンロード用URL生成
            const blob = new Blob([(pdfBytes as any)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            setPdfOutputUrl(url);
            setPdfLog(`Successfully merged ${files.length} files!`);

        } catch (err: any) {
            console.error(err);
            setPdfError(err.message);
        } finally {
            setIsPdfLoading(false);
        }
    };

    return {
        isPdfLoading,
        pdfLog,
        pdfError,
        pdfOutputUrl,
        mergePdfs
    };
};