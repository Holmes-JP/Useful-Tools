export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type EncodingFormat = "utf8" | "shift-jis" | "binary";
export type QRVariant = "generate" | "decode";

export interface QRGenerateOptions {
    text: string;
    size: number; // pixels
    errorCorrectionLevel: ErrorCorrectionLevel;
    margin: number;
    foregroundColor: string;
    backgroundColor: string;
    transparentBackground: boolean;
    encoding: EncodingFormat;
}

export interface QRDecodeResult {
    text: string;
    isValid: boolean;
    error?: string;
}

export interface QRGenerateResult {
    dataUrl: string;
    svgString: string;
    base64: string;
    dataSize: number; // bytes
    size: number; // pixels
    errorCorrectionLevel: ErrorCorrectionLevel;
}

export interface WifiQRConfig {
    ssid: string;
    password: string;
    securityType: "WPA" | "WEP" | "None";
    hidden: boolean;
}

export interface vCardConfig {
    name: string;
    phone: string;
    email: string;
    url: string;
    address: string;
    organization: string;
}

// Error correction level descriptions
export const EC_LEVELS: Record<ErrorCorrectionLevel, { label: string; description: string; capacity: string }> = {
    L: {
        label: 'L (7%)',
        description: 'Largest capacity, lowest error tolerance',
        capacity: '~2953 bytes',
    },
    M: {
        label: 'M (15%)',
        description: 'Balanced capacity and error tolerance',
        capacity: '~2331 bytes',
    },
    Q: {
        label: 'Q (25%)',
        description: 'Better error tolerance (logo friendly)',
        capacity: '~1663 bytes',
    },
    H: {
        label: 'H (30%)',
        description: 'Highest error tolerance, lowest capacity',
        capacity: '~1273 bytes',
    },
};
