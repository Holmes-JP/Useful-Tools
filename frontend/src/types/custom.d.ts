declare module 'crypto-js';

declare module 'qrcode' {
    interface QRCodeOptions {
        errorCorrectionLevel?: string;
        type?: string;
        quality?: number;
        margin?: number;
        width?: number;
        color?: {
            dark?: string;
            light?: string;
        };
    }
    export function toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
    export function toString(text: string, options?: QRCodeOptions): Promise<string>;
}

declare module '*.mjs?url' {
    const url: string;
    export default url;
}

declare module '*.js?url' {
    const url: string;
    export default url;
}
