export interface RegexFlags {
    global: boolean;
    ignoreCase: boolean;
    multiline: boolean;
    dotAll: boolean;
    unicode: boolean;
    sticky: boolean;
}

export interface CaptureGroup {
    index: number;
    name?: string;
    value: string;
    start: number;
    length: number;
}

export interface RegexMatch {
    index: number;
    fullMatch: string;
    start: number;
    length: number;
    groups: CaptureGroup[];
}

export interface RegexTestResult {
    matches: RegexMatch[];
    totalMatches: number;
    error?: string;
}

export interface ReplaceResult {
    output: string;
    replacements: number;
    error?: string;
}

export interface TestCase {
    id: string;
    label: string;
    input: string;
    shouldMatch: boolean;
    actualMatch?: boolean;
}

export interface RegexExample {
    name: string;
    pattern: string;
    flags: RegexFlags;
    testString: string;
    description: string;
}

export const REGEX_EXAMPLES: RegexExample[] = [
    {
        name: 'Email',
        pattern: '^[\\w.-]+@[\\w.-]+\\.\\w+$',
        flags: { global: false, ignoreCase: true, multiline: true, dotAll: false, unicode: false, sticky: false },
        testString: 'user@example.com\nadmin@test.jp\ninvalid-email@\ntest.user+tag@domain.co.jp',
        description: 'メールアドレスの検証',
    },
    {
        name: 'URL',
        pattern: 'https?://[\\w/:%#\\$&\\?\\(\\)~\\.=\\+\\-]+',
        flags: { global: true, ignoreCase: true, multiline: false, dotAll: false, unicode: false, sticky: false },
        testString: 'Visit https://example.com or http://test.org/path?query=value',
        description: 'URL の抽出',
    },
    {
        name: 'IPv4 Address',
        pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
        flags: { global: true, ignoreCase: false, multiline: false, dotAll: false, unicode: false, sticky: false },
        testString: 'Server: 192.168.1.1\nGateway: 10.0.0.1\nInvalid: 256.1.1.1',
        description: 'IPv4 アドレスの抽出',
    },
    {
        name: '日本の郵便番号',
        pattern: '\\d{3}-\\d{4}',
        flags: { global: true, ignoreCase: false, multiline: false, dotAll: false, unicode: false, sticky: false },
        testString: '〒100-0001 東京都千代田区\n〒530-0001 大阪府大阪市\n12345',
        description: '郵便番号（XXX-XXXX形式）',
    },
    {
        name: '日付 (YYYY-MM-DD)',
        pattern: '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])',
        flags: { global: true, ignoreCase: false, multiline: false, dotAll: false, unicode: false, sticky: false },
        testString: '2025-12-05\n2024-01-31\n2023-13-01\n2022-02-30',
        description: 'YYYY-MM-DD 形式の日付',
    },
    {
        name: '電話番号 (日本)',
        pattern: '0\\d{1,4}-\\d{1,4}-\\d{4}',
        flags: { global: true, ignoreCase: false, multiline: false, dotAll: false, unicode: false, sticky: false },
        testString: '03-1234-5678\n090-1234-5678\n0120-123-456',
        description: '日本の電話番号',
    },
    {
        name: 'HTMLタグ',
        pattern: '<([a-z]+)([^>]*)>(.*?)</\\1>',
        flags: { global: true, ignoreCase: true, multiline: false, dotAll: true, unicode: false, sticky: false },
        testString: '<div class="test">Content</div>\n<p>Paragraph</p>\n<span>Text</span>',
        description: 'HTMLタグとその内容',
    },
    {
        name: '名前付きキャプチャ',
        pattern: '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})',
        flags: { global: true, ignoreCase: false, multiline: false, dotAll: false, unicode: false, sticky: false },
        testString: '2025-12-05\n2024-01-15',
        description: '名前付きグループの使用例',
    },
];
