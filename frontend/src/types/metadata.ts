export type PrivacyRisk = 'high' | 'medium' | 'low';

export type MetadataCategory = 'EXIF' | 'IPTC' | 'XMP' | 'ID3' | 'PDF' | 'Office' | 'Container' | 'Other';

export interface MetadataField {
    category: MetadataCategory;
    label: string;
    key: string;
    value: string | number | boolean;
    isPrivacySensitive?: boolean;
}

export interface GPSInfo {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    latitudeRef?: string;
    longitudeRef?: string;
    latitudeDMS?: string;
    longitudeDMS?: string;
}

export interface DateTimeInfo {
    type: string;
    valueUTC: string;
    valueLocal: string;
    sourceField: string;
}

export interface PrivacyInfo {
    hasLocation: boolean;
    hasPersonName: boolean;
    hasCompanyName: boolean;
    hasEmail: boolean;
    hasSoftwareInfo: boolean;
    personNames: string[];
    companyNames: string[];
    emails: string[];
    softwareInfo: string[];
    deviceInfo: string[];
}

export interface TechnicalInfo {
    // 画像
    width?: number;
    height?: number;
    aspectRatio?: string;
    bitDepth?: number;
    colorSpace?: string;
    compression?: string;
    
    // 動画
    duration?: number;
    videoCodec?: string;
    audioCodec?: string;
    frameRate?: number;
    
    // 音声
    sampleRate?: number;
    channels?: number;
    bitrate?: number;
    
    // 文書
    pdfVersion?: string;
    producer?: string;
    creator?: string;
    pageCount?: number;
}

export interface AnalyzedMetadata {
    id: string;
    file: File;
    fileName: string;
    fileType: string;
    fileSize: number;
    metadataCount: number;
    privacyRisk: PrivacyRisk;
    privacyRiskReason: string;
    
    // 詳細データ
    fields: MetadataField[];
    gpsInfo?: GPSInfo;
    dateTimes: DateTimeInfo[];
    privacyInfo: PrivacyInfo;
    technicalInfo: TechnicalInfo;
    rawMetadata: Record<string, unknown>;
    
    // 解析状態
    analyzedAt: Date;
    error?: string;
}

export type TabType = 'overview' | 'technical' | 'tags' | 'location' | 'timeline' | 'raw';
