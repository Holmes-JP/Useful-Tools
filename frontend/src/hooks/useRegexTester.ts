import { useState, useCallback, useEffect, useRef } from 'react';
import type { RegexFlags, RegexMatch, RegexTestResult, ReplaceResult, CaptureGroup } from '../types/regex';

const STORAGE_KEY = 'regex-tester-state';

interface SavedState {
    pattern: string;
    flags: RegexFlags;
    testString: string;
    replacePattern: string;
    liveMode: boolean;
}

export function useRegexTester() {
    const [pattern, setPattern] = useState('');
    const [flags, setFlags] = useState<RegexFlags>({
        global: true,
        ignoreCase: false,
        multiline: false,
        dotAll: false,
        unicode: false,
        sticky: false,
    });
    const [testString, setTestString] = useState('');
    const [replacePattern, setReplacePattern] = useState('');
    const [replaceMode, setReplaceMode] = useState(false);
    const [liveMode, setLiveMode] = useState(true);
    const [testResult, setTestResult] = useState<RegexTestResult>({ matches: [], totalMatches: 0 });
    const [replaceResult, setReplaceResult] = useState<ReplaceResult | null>(null);

    const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // localStorage から状態を復元
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state: SavedState = JSON.parse(saved);
                setPattern(state.pattern || '');
                setFlags(state.flags || flags);
                setTestString(state.testString || '');
                setReplacePattern(state.replacePattern || '');
                setLiveMode(state.liveMode ?? true);
            }
        } catch (err) {
            console.error('Failed to restore regex tester state:', err);
        }
    }, []);

    // 状態を localStorage に保存
    useEffect(() => {
        try {
            const state: SavedState = {
                pattern,
                flags,
                testString,
                replacePattern,
                liveMode,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
            console.error('Failed to save regex tester state:', err);
        }
    }, [pattern, flags, testString, replacePattern, liveMode]);

    // パターンから正規表現を生成
    const createRegex = useCallback((): { regex: RegExp | null; error?: string } => {
        if (!pattern) {
            return { regex: null, error: undefined };
        }

        try {
            const flagsString = 
                (flags.global ? 'g' : '') +
                (flags.ignoreCase ? 'i' : '') +
                (flags.multiline ? 'm' : '') +
                (flags.dotAll ? 's' : '') +
                (flags.unicode ? 'u' : '') +
                (flags.sticky ? 'y' : '');

            const regex = new RegExp(pattern, flagsString);
            return { regex, error: undefined };
        } catch (err) {
            return { 
                regex: null, 
                error: err instanceof Error ? `正規表現の構文エラー: ${err.message}` : '正規表現の構文エラー',
            };
        }
    }, [pattern, flags]);

    // テストを実行
    const runTest = useCallback(() => {
        if (!testString) {
            setTestResult({ matches: [], totalMatches: 0 });
            setReplaceResult(null);
            return;
        }

        const { regex, error } = createRegex();

        if (error) {
            setTestResult({ matches: [], totalMatches: 0, error });
            setReplaceResult(null);
            return;
        }

        if (!regex) {
            setTestResult({ matches: [], totalMatches: 0 });
            setReplaceResult(null);
            return;
        }

        try {
            const matches: RegexMatch[] = [];
            let match: RegExpExecArray | null;

            // globalフラグがある場合は全マッチを取得
            if (flags.global) {
                while ((match = regex.exec(testString)) !== null) {
                    matches.push(createMatchObject(match, testString));
                    // 無限ループ防止
                    if (matches.length > 1000) {
                        setTestResult({ 
                            matches: [], 
                            totalMatches: 0, 
                            error: 'マッチ数が多すぎます（1000件以上）',
                        });
                        return;
                    }
                }
            } else {
                // globalフラグがない場合は最初のマッチのみ
                match = regex.exec(testString);
                if (match) {
                    matches.push(createMatchObject(match, testString));
                }
            }

            setTestResult({ matches, totalMatches: matches.length, error: undefined });

            // 置換モードの場合は置換結果も生成
            if (replaceMode && replacePattern !== undefined) {
                try {
                    const output = testString.replace(regex, replacePattern);
                    const replacements = matches.length;
                    setReplaceResult({ output, replacements, error: undefined });
                } catch (err) {
                    setReplaceResult({ 
                        output: '', 
                        replacements: 0, 
                        error: err instanceof Error ? err.message : '置換エラー',
                    });
                }
            } else {
                setReplaceResult(null);
            }
        } catch (err) {
            setTestResult({ 
                matches: [], 
                totalMatches: 0, 
                error: err instanceof Error ? err.message : 'マッチングエラー',
            });
            setReplaceResult(null);
        }
    }, [testString, createRegex, flags.global, replaceMode, replacePattern]);

    // ライブモードの場合は自動実行
    useEffect(() => {
        if (!liveMode) return;

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            runTest();
        }, 400);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [pattern, flags, testString, replacePattern, replaceMode, liveMode, runTest]);

    // /pattern/flags 形式の入力を解析
    const parsePatternInput = useCallback((input: string) => {
        const match = input.match(/^\/(.+)\/([gimsuy]*)$/);
        if (match) {
            const [, extractedPattern, flagsStr] = match;
            setPattern(extractedPattern);
            setFlags({
                global: flagsStr.includes('g'),
                ignoreCase: flagsStr.includes('i'),
                multiline: flagsStr.includes('m'),
                dotAll: flagsStr.includes('s'),
                unicode: flagsStr.includes('u'),
                sticky: flagsStr.includes('y'),
            });
        } else {
            setPattern(input);
        }
    }, []);

    const toggleFlag = useCallback((flag: keyof RegexFlags) => {
        setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
    }, []);

    const loadExample = useCallback((examplePattern: string, exampleFlags: RegexFlags, exampleTestString: string) => {
        setPattern(examplePattern);
        setFlags(exampleFlags);
        setTestString(exampleTestString);
    }, []);

    const clearAll = useCallback(() => {
        setPattern('');
        setFlags({
            global: true,
            ignoreCase: false,
            multiline: false,
            dotAll: false,
            unicode: false,
            sticky: false,
        });
        setTestString('');
        setReplacePattern('');
        setReplaceMode(false);
        setTestResult({ matches: [], totalMatches: 0 });
        setReplaceResult(null);
    }, []);

    return {
        pattern,
        setPattern: parsePatternInput,
        flags,
        toggleFlag,
        testString,
        setTestString,
        replacePattern,
        setReplacePattern,
        replaceMode,
        setReplaceMode,
        liveMode,
        setLiveMode,
        testResult,
        replaceResult,
        runTest,
        loadExample,
        clearAll,
    };
}

// マッチオブジェクトを生成
function createMatchObject(match: RegExpExecArray, testString: string): RegexMatch {
    const groups: CaptureGroup[] = [];

    // グループ 0 (全体マッチ)
    groups.push({
        index: 0,
        value: match[0],
        start: match.index,
        length: match[0].length,
    });

    // キャプチャグループ (1〜)
    for (let i = 1; i < match.length; i++) {
        if (match[i] !== undefined) {
            const value = match[i];
            const start = testString.indexOf(value, match.index);
            groups.push({
                index: i,
                value,
                start,
                length: value.length,
            });
        }
    }

    // 名前付きグループ
    if (match.groups) {
        Object.entries(match.groups).forEach(([name, value]) => {
            if (value !== undefined) {
                const start = testString.indexOf(value, match.index);
                const existingGroup = groups.find(g => g.value === value && g.start === start);
                if (existingGroup) {
                    existingGroup.name = name;
                } else {
                    groups.push({
                        index: groups.length,
                        name,
                        value,
                        start,
                        length: value.length,
                    });
                }
            }
        });
    }

    return {
        index: groups.length > 0 ? groups.length - 1 : 0,
        fullMatch: match[0],
        start: match.index,
        length: match[0].length,
        groups,
    };
}
