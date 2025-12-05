import QRCode from "qrcode";
import jsQR from "jsqr";
import { QRGenerateOptions, QRGenerateResult, QRDecodeResult, EncodingFormat } from "../types/qr";

function encodeTextBytes(text: string, encoding: EncodingFormat): Uint8Array {
    if (encoding === "binary") {
        const cleaned = text.replace(/\s/g, "");
        const bytes = new Uint8Array(cleaned.length / 2);
        for (let i = 0; i < cleaned.length; i += 2) {
            bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
        }
        return bytes;
    }
    // For MVP, treat shift-jis as utf-8
    return new TextEncoder().encode(text);
}

export function useQRGenerator() {
    async function generateQR(options: QRGenerateOptions): Promise<QRGenerateResult> {
        const { text, size, errorCorrectionLevel, margin, foregroundColor, backgroundColor, transparentBackground, encoding } = options;
        if (!text) throw new Error("Text is required");

        const dark = foregroundColor || "#000000";
        const light = transparentBackground ? "#00000000" : (backgroundColor || "#ffffff");
        const dataSize = encodeTextBytes(text, encoding).length;

        const dataUrl = await QRCode.toDataURL(text, {
            errorCorrectionLevel,
            width: size,
            margin,
            color: { dark, light },
        });

        const svgString = await QRCode.toString(text, {
            errorCorrectionLevel,
            width: size,
            margin,
            color: { dark, light },
            type: "svg",
        });

        const base64 = dataUrl.split(",")[1] || "";

        return {
            dataUrl,
            svgString,
            base64,
            dataSize,
            size,
            errorCorrectionLevel,
        };
    }

    function decodeQR(imageFile: File | Blob): Promise<QRDecodeResult> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        resolve({ text: "", isValid: false, error: "Canvas is not available in this browser." });
                        return;
                    }
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, canvas.width, canvas.height);
                    if (code && code.data) {
                        resolve({ text: code.data, isValid: true });
                    } else {
                        resolve({ text: "", isValid: false, error: "QRコードを検出できませんでした。画像サイズやコントラストを確認してください。" });
                    }
                };
                img.onerror = () => resolve({ text: "", isValid: false, error: "画像の読み込みに失敗しました。" });
                img.src = reader.result as string;
            };
            reader.onerror = () => resolve({ text: "", isValid: false, error: "ファイルの読み込みに失敗しました。" });
            reader.readAsDataURL(imageFile);
        });
    }

    function downloadQR(dataUrlOrSvg: string, filename: string, format: "png" | "svg" | "base64") {
        if (format === "png") {
            const a = document.createElement("a");
            a.href = dataUrlOrSvg;
            a.download = filename;
            a.click();
            return;
        }
        if (format === "svg") {
            const a = document.createElement("a");
            a.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(dataUrlOrSvg)}`;
            a.download = filename;
            a.click();
            return;
        }
        if (format === "base64") {
            navigator.clipboard?.writeText(dataUrlOrSvg);
        }
    }

    function generateWifiQR(ssid: string, password: string, securityType: string): string {
        return `WIFI:T:${securityType};S:${ssid};P:${password};;`;
    }

    function generatevCard(name: string, phone: string, email: string, url: string, address: string, org: string): string {
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nURL:${url}\nADR:;;${address}\nORG:${org}\nEND:VCARD`;
    }

    return {
        generateQR,
        decodeQR,
        downloadQR,
        generateWifiQR,
        generatevCard,
    };
}
