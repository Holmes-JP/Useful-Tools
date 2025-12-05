import { useState } from 'react';
import type { AnalyzedMetadata, MetadataField, GPSInfo, DateTimeInfo, PrivacyInfo, TechnicalInfo, PrivacyRisk, MetadataCategory } from '../types/metadata';

const MAX_FILES = 20;
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export function useMetadataAnalyzer() {
    const [analyzedFiles, setAnalyzedFiles] = useState<AnalyzedMetadata[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string>('');

    const analyzeFiles = async (files: File[]) => {
        setError('');
        
        if (files.length > MAX_FILES) {
            setError(`最大${MAX_FILES}個までのファイルを解析できます。`);
            return;
        }

        const oversized = files.find(f => f.size > MAX_SIZE_BYTES);
        if (oversized) {
            setError(`ファイルサイズが大きすぎます。最大 ${Math.floor(MAX_SIZE_BYTES / (1024 * 1024))} MB まで解析可能です。`);
            return;
        }

        setIsAnalyzing(true);

        try {
            const results = await Promise.all(files.map(file => analyzeFile(file)));
            setAnalyzedFiles(prev => [...prev, ...results]);
        } catch (err) {
            setError(err instanceof Error ? err.message : '解析中にエラーが発生しました。');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearResults = () => {
        setAnalyzedFiles([]);
        setError('');
    };

    const removeFile = (id: string) => {
        setAnalyzedFiles(prev => prev.filter(f => f.id !== id));
    };

    return {
        analyzedFiles,
        isAnalyzing,
        error,
        analyzeFiles,
        clearResults,
        removeFile,
    };
}

async function analyzeFile(file: File): Promise<AnalyzedMetadata> {
    const id = crypto.randomUUID();
    const fileType = detectFileType(file);
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        const fields: MetadataField[] = [];
        const dateTimes: DateTimeInfo[] = [];
        let gpsInfo: GPSInfo | undefined;
        let technicalInfo: TechnicalInfo = {};
        let rawMetadata: Record<string, unknown> = {};

        // ファイルタイプ別にメタデータを抽出
        if (fileType.includes('JPEG') || fileType.includes('PNG')) {
            const imageData = await extractImageMetadata(file, bytes);
            fields.push(...imageData.fields);
            dateTimes.push(...imageData.dateTimes);
            gpsInfo = imageData.gpsInfo;
            technicalInfo = imageData.technicalInfo;
            rawMetadata = imageData.raw;
        } else if (fileType.includes('PDF')) {
            const pdfData = extractPDFMetadata(bytes);
            fields.push(...pdfData.fields);
            dateTimes.push(...pdfData.dateTimes);
            technicalInfo = pdfData.technicalInfo;
            rawMetadata = pdfData.raw;
        } else if (fileType.includes('MP3') || fileType.includes('音声')) {
            const audioData = extractAudioMetadata(bytes);
            fields.push(...audioData.fields);
            technicalInfo = audioData.technicalInfo;
            rawMetadata = audioData.raw;
        } else if (fileType.includes('MP4') || fileType.includes('動画')) {
            const videoData = extractVideoMetadata(bytes);
            fields.push(...videoData.fields);
            dateTimes.push(...videoData.dateTimes);
            technicalInfo = videoData.technicalInfo;
            rawMetadata = videoData.raw;
        } else if (file.name.endsWith('.docx') || file.name.endsWith('.xlsx') || file.name.endsWith('.pptx')) {
            const officeData = await extractOfficeMetadata(file);
            fields.push(...officeData.fields);
            dateTimes.push(...officeData.dateTimes);
            technicalInfo = officeData.technicalInfo;
            rawMetadata = officeData.raw;
        }

        // ファイルシステム情報を追加
        fields.push({
            category: 'Other',
            label: 'ファイル名',
            key: 'fileName',
            value: file.name,
        });
        fields.push({
            category: 'Other',
            label: 'ファイルサイズ',
            key: 'fileSize',
            value: formatFileSize(file.size),
        });
        fields.push({
            category: 'Other',
            label: 'MIME Type',
            key: 'mimeType',
            value: file.type || 'unknown',
        });
        dateTimes.push({
            type: 'ファイル更新日時',
            valueUTC: new Date(file.lastModified).toISOString(),
            valueLocal: new Date(file.lastModified).toLocaleString('ja-JP'),
            sourceField: 'file.lastModified',
        });

        // プライバシー情報を分析
        const privacyInfo = analyzePrivacyInfo(fields, gpsInfo);
        
        // プライバシーリスクを評価
        const { risk, reason } = assessPrivacyRisk(privacyInfo);

        return {
            id,
            file,
            fileName: file.name,
            fileType,
            fileSize: file.size,
            metadataCount: fields.length,
            privacyRisk: risk,
            privacyRiskReason: reason,
            fields,
            gpsInfo,
            dateTimes,
            privacyInfo,
            technicalInfo,
            rawMetadata,
            analyzedAt: new Date(),
        };
    } catch (err) {
        return {
            id,
            file,
            fileName: file.name,
            fileType,
            fileSize: file.size,
            metadataCount: 0,
            privacyRisk: 'low',
            privacyRiskReason: '解析エラー',
            fields: [],
            dateTimes: [],
            privacyInfo: {
                hasLocation: false,
                hasPersonName: false,
                hasCompanyName: false,
                hasEmail: false,
                hasSoftwareInfo: false,
                personNames: [],
                companyNames: [],
                emails: [],
                softwareInfo: [],
                deviceInfo: [],
            },
            technicalInfo: {},
            rawMetadata: {},
            analyzedAt: new Date(),
            error: err instanceof Error ? err.message : '解析エラー',
        };
    }
}

function detectFileType(file: File): string {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mime = file.type;

    if (ext === 'jpg' || ext === 'jpeg' || mime === 'image/jpeg') return 'JPEG 画像';
    if (ext === 'png' || mime === 'image/png') return 'PNG 画像';
    if (ext === 'gif' || mime === 'image/gif') return 'GIF 画像';
    if (ext === 'webp' || mime === 'image/webp') return 'WebP 画像';
    if (ext === 'heic' || ext === 'heif') return 'HEIC/HEIF 画像';
    if (ext === 'tiff' || ext === 'tif') return 'TIFF 画像';
    if (ext === 'pdf' || mime === 'application/pdf') return 'PDF 文書';
    if (ext === 'mp4' || mime === 'video/mp4') return 'MP4 動画';
    if (ext === 'mov' || mime === 'video/quicktime') return 'MOV 動画';
    if (ext === 'mkv' || mime === 'video/x-matroska') return 'MKV 動画';
    if (ext === 'avi' || mime === 'video/x-msvideo') return 'AVI 動画';
    if (ext === 'webm' || mime === 'video/webm') return 'WebM 動画';
    if (ext === 'mp3' || mime === 'audio/mpeg') return 'MP3 音声';
    if (ext === 'flac' || mime === 'audio/flac') return 'FLAC 音声';
    if (ext === 'wav' || mime === 'audio/wav') return 'WAV 音声';
    if (ext === 'aac' || mime === 'audio/aac') return 'AAC 音声';
    if (ext === 'ogg' || mime === 'audio/ogg') return 'OGG 音声';
    if (ext === 'docx') return 'Word 文書';
    if (ext === 'xlsx') return 'Excel 文書';
    if (ext === 'pptx') return 'PowerPoint 文書';
    if (ext === 'odt') return 'OpenDocument テキスト';
    if (ext === 'txt' || mime === 'text/plain') return 'テキストファイル';
    if (ext === 'md') return 'Markdown ファイル';

    return 'サポート対象外';
}

async function extractImageMetadata(file: File, bytes: Uint8Array) {
    const fields: MetadataField[] = [];
    const dateTimes: DateTimeInfo[] = [];
    let gpsInfo: GPSInfo | undefined;
    const technicalInfo: TechnicalInfo = {};
    const raw: Record<string, unknown> = {};

    // 画像をロードして基本情報を取得
    const img = await loadImage(file);
    technicalInfo.width = img.width;
    technicalInfo.height = img.height;
    technicalInfo.aspectRatio = `${img.width}:${img.height}`;

    // JPEG EXIF解析
    if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
        const exifData = parseJPEGExif(bytes);
        
        if (exifData.make) {
            fields.push({
                category: 'EXIF',
                label: 'カメラメーカー',
                key: 'Make',
                value: exifData.make,
            });
        }
        if (exifData.model) {
            fields.push({
                category: 'EXIF',
                label: 'カメラモデル',
                key: 'Model',
                value: exifData.model,
            });
        }
        if (exifData.software) {
            fields.push({
                category: 'EXIF',
                label: 'ソフトウェア',
                key: 'Software',
                value: exifData.software,
                isPrivacySensitive: true,
            });
        }
        if (exifData.dateTime) {
            dateTimes.push({
                type: '撮影日時',
                valueUTC: exifData.dateTime,
                valueLocal: new Date(exifData.dateTime).toLocaleString('ja-JP'),
                sourceField: 'EXIF:DateTimeOriginal',
            });
            fields.push({
                category: 'EXIF',
                label: '撮影日時',
                key: 'DateTimeOriginal',
                value: exifData.dateTime,
            });
        }
        if (exifData.artist) {
            fields.push({
                category: 'EXIF',
                label: '撮影者',
                key: 'Artist',
                value: exifData.artist,
                isPrivacySensitive: true,
            });
        }
        if (exifData.copyright) {
            fields.push({
                category: 'EXIF',
                label: '著作権',
                key: 'Copyright',
                value: exifData.copyright,
                isPrivacySensitive: true,
            });
        }

        // GPS情報
        if (exifData.gps) {
            gpsInfo = exifData.gps;
            if (gpsInfo && gpsInfo.latitude !== undefined && gpsInfo.longitude !== undefined) {
                fields.push({
                    category: 'EXIF',
                    label: 'GPS 緯度',
                    key: 'GPSLatitude',
                    value: `${gpsInfo.latitude}°`,
                    isPrivacySensitive: true,
                });
                fields.push({
                    category: 'EXIF',
                    label: 'GPS 経度',
                    key: 'GPSLongitude',
                    value: `${gpsInfo.longitude}°`,
                    isPrivacySensitive: true,
                });
            }
        }

        raw.exif = exifData;
    }

    // PNG メタデータ (tEXt, iTXt, zTXt チャンク)
    if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
        const pngMeta = parsePNGMetadata(bytes);
        pngMeta.forEach(item => {
            fields.push({
                category: 'Other',
                label: item.key,
                key: item.key,
                value: item.value,
            });
        });
        raw.png = pngMeta;
    }

    return { fields, dateTimes, gpsInfo, technicalInfo, raw };
}

function extractPDFMetadata(bytes: Uint8Array) {
    const fields: MetadataField[] = [];
    const dateTimes: DateTimeInfo[] = [];
    const technicalInfo: TechnicalInfo = {};
    const raw: Record<string, unknown> = {};

    try {
        const text = new TextDecoder('latin1').decode(bytes.slice(0, 8192));
        
        // PDF バージョン
        const versionMatch = text.match(/%PDF-(\d\.\d)/);
        if (versionMatch) {
            technicalInfo.pdfVersion = versionMatch[1];
            fields.push({
                category: 'PDF',
                label: 'PDFバージョン',
                key: 'Version',
                value: versionMatch[1],
            });
        }

        // メタデータ抽出（簡易版）
        const extractField = (pattern: RegExp, category: MetadataCategory, label: string, key: string, sensitive = false) => {
            const match = text.match(pattern);
            if (match && match[1]) {
                const value = match[1].trim();
                fields.push({
                    category,
                    label,
                    key,
                    value,
                    isPrivacySensitive: sensitive,
                });
                return value;
            }
            return null;
        };

        technicalInfo.creator = extractField(/\/Creator\s*\(([^)]+)\)/i, 'PDF', 'Creator', 'Creator', true) || undefined;
        technicalInfo.producer = extractField(/\/Producer\s*\(([^)]+)\)/i, 'PDF', 'Producer', 'Producer', true) || undefined;
        extractField(/\/Author\s*\(([^)]+)\)/i, 'PDF', '著者', 'Author', true);
        extractField(/\/Title\s*\(([^)]+)\)/i, 'PDF', 'タイトル', 'Title');
        extractField(/\/Subject\s*\(([^)]+)\)/i, 'PDF', 'サブジェクト', 'Subject');
        extractField(/\/Keywords\s*\(([^)]+)\)/i, 'PDF', 'キーワード', 'Keywords');

        const creationDate = extractField(/\/CreationDate\s*\(D:([^)]+)\)/i, 'PDF', '作成日時', 'CreationDate');
        const modDate = extractField(/\/ModDate\s*\(D:([^)]+)\)/i, 'PDF', '更新日時', 'ModDate');

        if (creationDate) {
            dateTimes.push({
                type: '作成日時',
                valueUTC: parsePDFDate(creationDate),
                valueLocal: new Date(parsePDFDate(creationDate)).toLocaleString('ja-JP'),
                sourceField: 'PDF:CreationDate',
            });
        }
        if (modDate) {
            dateTimes.push({
                type: '更新日時',
                valueUTC: parsePDFDate(modDate),
                valueLocal: new Date(parsePDFDate(modDate)).toLocaleString('ja-JP'),
                sourceField: 'PDF:ModDate',
            });
        }

        raw.pdf = { text: text.slice(0, 1000) };
    } catch (err) {
        console.error('PDF metadata extraction error:', err);
    }

    return { fields, dateTimes, technicalInfo, raw };
}

function extractAudioMetadata(bytes: Uint8Array) {
    const fields: MetadataField[] = [];
    const technicalInfo: TechnicalInfo = {};
    const raw: Record<string, unknown> = {};

    // MP3 ID3タグの簡易解析
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) { // "ID3"
        try {
            const id3Data = parseID3v2(bytes);
            Object.entries(id3Data).forEach(([key, value]) => {
                fields.push({
                    category: 'ID3',
                    label: key,
                    key,
                    value: String(value),
                    isPrivacySensitive: key === 'Artist' || key === 'Album Artist',
                });
            });
            raw.id3 = id3Data;
        } catch (err) {
            console.error('ID3 parse error:', err);
        }
    }

    return { fields, technicalInfo, raw };
}

function extractVideoMetadata(bytes: Uint8Array) {
    const fields: MetadataField[] = [];
    const dateTimes: DateTimeInfo[] = [];
    const technicalInfo: TechnicalInfo = {};
    const raw: Record<string, unknown> = {};

    // MP4/MOVの場合、atomを解析（簡易版）
    if (bytes.length > 12) {
        const fourCC = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
        
        if (fourCC === 'ftyp') {
            fields.push({
                category: 'Container',
                label: 'コンテナ形式',
                key: 'Format',
                value: 'MP4/MOV',
            });
        }

        // 簡易的なメタデータ検出
        const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 8192));

        raw.container = { fourCC, sample: text.slice(0, 500) };
    }

    return { fields, dateTimes, technicalInfo, raw };
}

async function extractOfficeMetadata(file: File) {
    const fields: MetadataField[] = [];
    const dateTimes: DateTimeInfo[] = [];
    const technicalInfo: TechnicalInfo = {};
    const raw: Record<string, unknown> = {};

    // Office文書は実際にはZIPファイル
    // ここでは簡易的な実装
    try {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(file);
        
        // docProps/core.xml を読む
        const coreXml = await zip.file('docProps/core.xml')?.async('string');
        if (coreXml) {
            const extractXMLField = (xml: string, tag: string) => {
                const match = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`, 'i'));
                return match ? match[1] : null;
            };

            const creator = extractXMLField(coreXml, 'dc:creator');
            if (creator) {
                fields.push({
                    category: 'Office',
                    label: '作成者',
                    key: 'creator',
                    value: creator,
                    isPrivacySensitive: true,
                });
            }

            const title = extractXMLField(coreXml, 'dc:title');
            if (title) {
                fields.push({
                    category: 'Office',
                    label: 'タイトル',
                    key: 'title',
                    value: title,
                });
            }

            const company = extractXMLField(coreXml, 'cp:company');
            if (company) {
                fields.push({
                    category: 'Office',
                    label: '会社名',
                    key: 'company',
                    value: company,
                    isPrivacySensitive: true,
                });
            }

            const created = extractXMLField(coreXml, 'dcterms:created');
            if (created) {
                dateTimes.push({
                    type: '作成日時',
                    valueUTC: created,
                    valueLocal: new Date(created).toLocaleString('ja-JP'),
                    sourceField: 'Office:created',
                });
            }

            const modified = extractXMLField(coreXml, 'dcterms:modified');
            if (modified) {
                dateTimes.push({
                    type: '更新日時',
                    valueUTC: modified,
                    valueLocal: new Date(modified).toLocaleString('ja-JP'),
                    sourceField: 'Office:modified',
                });
            }

            raw.office = { coreXml: coreXml.slice(0, 1000) };
        }
    } catch (err) {
        console.error('Office metadata extraction error:', err);
    }

    return { fields, dateTimes, technicalInfo, raw };
}

function analyzePrivacyInfo(fields: MetadataField[], gpsInfo?: GPSInfo): PrivacyInfo {
    const personNames: string[] = [];
    const companyNames: string[] = [];
    const emails: string[] = [];
    const softwareInfo: string[] = [];
    const deviceInfo: string[] = [];

    fields.forEach(field => {
        const value = String(field.value);
        
        // 人名検出
        if (field.key.toLowerCase().includes('author') || 
            field.key.toLowerCase().includes('artist') ||
            field.key.toLowerCase().includes('creator')) {
            if (value && value !== 'unknown') {
                personNames.push(value);
            }
        }

        // 会社名検出
        if (field.key.toLowerCase().includes('company') ||
            field.key.toLowerCase().includes('organization')) {
            if (value && value !== 'unknown') {
                companyNames.push(value);
            }
        }

        // メールアドレス検出
        if (value.includes('@') && value.includes('.')) {
            const emailMatch = value.match(/[\w.-]+@[\w.-]+\.\w+/g);
            if (emailMatch) {
                emails.push(...emailMatch);
            }
        }

        // ソフトウェア情報
        if (field.key.toLowerCase().includes('software') ||
            field.key.toLowerCase().includes('producer') ||
            field.key.toLowerCase().includes('creator')) {
            if (value && !personNames.includes(value)) {
                softwareInfo.push(value);
            }
        }

        // デバイス情報
        if (field.key.toLowerCase().includes('make') ||
            field.key.toLowerCase().includes('model') ||
            field.key.toLowerCase().includes('device')) {
            if (value) {
                deviceInfo.push(value);
            }
        }
    });

    return {
        hasLocation: !!gpsInfo && gpsInfo.latitude !== undefined,
        hasPersonName: personNames.length > 0,
        hasCompanyName: companyNames.length > 0,
        hasEmail: emails.length > 0,
        hasSoftwareInfo: softwareInfo.length > 0,
        personNames: [...new Set(personNames)],
        companyNames: [...new Set(companyNames)],
        emails: [...new Set(emails)],
        softwareInfo: [...new Set(softwareInfo)],
        deviceInfo: [...new Set(deviceInfo)],
    };
}

function assessPrivacyRisk(privacyInfo: PrivacyInfo): { risk: PrivacyRisk; reason: string } {
    const risks: string[] = [];

    if (privacyInfo.hasLocation) {
        risks.push('位置情報');
    }
    if (privacyInfo.hasPersonName) {
        risks.push('人名');
    }
    if (privacyInfo.hasCompanyName) {
        risks.push('会社名');
    }
    if (privacyInfo.hasEmail) {
        risks.push('メールアドレス');
    }

    if (risks.length >= 2 || privacyInfo.hasLocation) {
        return { risk: 'high', reason: `${risks.join('、')}が含まれています` };
    }
    if (risks.length === 1 || privacyInfo.hasSoftwareInfo || privacyInfo.deviceInfo.length > 0) {
        return { risk: 'medium', reason: risks.length > 0 ? `${risks.join('、')}が含まれています` : '作成情報が含まれています' };
    }
    return { risk: 'low', reason: 'センシティブな情報はほとんどありません' };
}

// ユーティリティ関数

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

function formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
}

function parsePDFDate(dateStr: string): string {
    // PDF日付形式: YYYYMMDDHHmmSS -> ISO
    try {
        const year = dateStr.slice(0, 4);
        const month = dateStr.slice(4, 6);
        const day = dateStr.slice(6, 8);
        const hour = dateStr.slice(8, 10) || '00';
        const min = dateStr.slice(10, 12) || '00';
        const sec = dateStr.slice(12, 14) || '00';
        return `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
    } catch {
        return dateStr;
    }
}

function parseJPEGExif(bytes: Uint8Array) {
    // 簡易EXIF解析（実際のプロジェクトではexif-jsなどのライブラリを使用）
    const result: Record<string, any> = {};
    
    try {
        // APP1マーカーを探す (0xFF 0xE1)
        for (let i = 0; i < Math.min(bytes.length - 10, 65536); i++) {
            if (bytes[i] === 0xFF && bytes[i + 1] === 0xE1) {
                const exifString = new TextDecoder('latin1').decode(bytes.slice(i, i + 2000));
                
                // 簡易的なテキスト抽出
                const makeMatch = exifString.match(/Make\0([^\0]{1,50})/);
                if (makeMatch) result.make = makeMatch[1].trim();
                
                const modelMatch = exifString.match(/Model\0([^\0]{1,50})/);
                if (modelMatch) result.model = modelMatch[1].trim();
                
                const softwareMatch = exifString.match(/Software\0([^\0]{1,100})/);
                if (softwareMatch) result.software = softwareMatch[1].trim();
                
                const artistMatch = exifString.match(/Artist\0([^\0]{1,100})/);
                if (artistMatch) result.artist = artistMatch[1].trim();
                
                break;
            }
        }
    } catch (err) {
        console.error('EXIF parse error:', err);
    }
    
    return result;
}

function parsePNGMetadata(bytes: Uint8Array) {
    const metadata: Array<{ key: string; value: string }> = [];
    
    // PNGチャンクを探す (簡易版)
    let offset = 8; // PNG署名をスキップ
    
    while (offset < bytes.length - 8) {
        const view = new DataView(bytes.buffer, offset);
        const length = view.getUint32(0);
        const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
        
        if (type === 'tEXt' && length < 1000) {
            const data = bytes.slice(offset + 8, offset + 8 + length);
            const nullIndex = data.indexOf(0);
            if (nullIndex > 0) {
                const key = new TextDecoder().decode(data.slice(0, nullIndex));
                const value = new TextDecoder().decode(data.slice(nullIndex + 1));
                metadata.push({ key, value });
            }
        }
        
        offset += 12 + length;
        if (type === 'IEND') break;
    }
    
    return metadata;
}

function parseID3v2(bytes: Uint8Array) {
    const result: Record<string, string> = {};
    
    // ID3v2の簡易パース
    try {
        const version = bytes[3];
        
        // サイズはsyncsafeで7bitずつ
        const size = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
        
        let offset = 10;
        
        while (offset < Math.min(size + 10, bytes.length - 10)) {
            const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
            
            if (!frameId.match(/^[A-Z0-9]+$/)) break;
            
            const frameSize = version === 4 
                ? (bytes[offset + 4] << 21) | (bytes[offset + 5] << 14) | (bytes[offset + 6] << 7) | bytes[offset + 7]
                : (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
            
            if (frameSize > 10000 || frameSize === 0) break;
            
            const frameData = bytes.slice(offset + 10, offset + 10 + frameSize);
            
            // テキストフレーム (encoding byte + text)
            if (frameId.startsWith('T')) {
                const text = new TextDecoder('utf-8', { fatal: false }).decode(frameData.slice(1));
                const label = {
                    'TIT2': 'Title',
                    'TPE1': 'Artist',
                    'TALB': 'Album',
                    'TYER': 'Year',
                    'TCON': 'Genre',
                    'TPE2': 'Album Artist',
                }[frameId] || frameId;
                
                result[label] = text.replace(/\0/g, '').trim();
            }
            
            offset += 10 + frameSize;
        }
    } catch (err) {
        console.error('ID3v2 parse error:', err);
    }
    
    return result;
}
