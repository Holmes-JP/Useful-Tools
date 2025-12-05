import { useState, useMemo } from 'react';
import { Play, Zap, RefreshCcw, BookOpen, Copy, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useRegexTester } from '../../../../hooks/useRegexTester';
import { REGEX_EXAMPLES } from '../../../../types/regex';
import type { RegexMatch } from '../../../../types/regex';

export default function RegexTesterPanel() {
    const {
        pattern,
        setPattern,
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
    } = useRegexTester();

    const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);
    const [showCheatSheet, setShowCheatSheet] = useState(false);
    const [copiedField, setCopiedField] = useState<string>('');

    const selectedMatch = selectedMatchIndex !== null ? testResult.matches[selectedMatchIndex] : null;

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(''), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    // テキストをハイライト表示用に分割
    const highlightedText = useMemo(() => {
        if (!testString || testResult.matches.length === 0) {
            return [{ text: testString, isMatch: false, matchIndex: -1 }];
        }

        const parts: Array<{ text: string; isMatch: boolean; matchIndex: number }> = [];
        let lastIndex = 0;

        testResult.matches.forEach((match, idx) => {
            // マッチ前のテキスト
            if (match.start > lastIndex) {
                parts.push({
                    text: testString.slice(lastIndex, match.start),
                    isMatch: false,
                    matchIndex: -1,
                });
            }

            // マッチ部分
            parts.push({
                text: match.fullMatch,
                isMatch: true,
                matchIndex: idx,
            });

            lastIndex = match.start + match.length;
        });

        // 残りのテキスト
        if (lastIndex < testString.length) {
            parts.push({
                text: testString.slice(lastIndex),
                isMatch: false,
                matchIndex: -1,
            });
        }

        return parts;
    }, [testString, testResult.matches]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
            {/* ヘッダー */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="text-xs uppercase tracking-wide text-gray-500">Text Tools</div>
                <h3 className="text-2xl font-bold text-white">Regex Tester</h3>
                <p className="text-sm text-gray-400 mt-1">
                    正規表現のテスト・デバッグ・視覚化ツール
                </p>
            </div>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* パターン入力エリア */}
                <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-semibold text-gray-300">Pattern</label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setLiveMode(!liveMode)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                                    liveMode
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <Zap className="w-3 h-3" />
                                Live
                            </button>
                            {!liveMode && (
                                <button
                                    onClick={runTest}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                                >
                                    <Play className="w-3 h-3" />
                                    Run
                                </button>
                            )}
                            <button
                                onClick={clearAll}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                            >
                                <RefreshCcw className="w-3 h-3" />
                                Clear
                            </button>
                        </div>
                    </div>

                    <input
                        type="text"
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                        placeholder="^\w+@\w+\.\w+$"
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {testResult.error && (
                        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-300">{testResult.error}</p>
                        </div>
                    )}

                    {/* フラグ */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <FlagToggle
                            label="g"
                            title="Global - すべてのマッチを検索"
                            active={flags.global}
                            onClick={() => toggleFlag('global')}
                        />
                        <FlagToggle
                            label="i"
                            title="Ignore case - 大文字小文字を区別しない"
                            active={flags.ignoreCase}
                            onClick={() => toggleFlag('ignoreCase')}
                        />
                        <FlagToggle
                            label="m"
                            title="Multiline - ^ と $ が行頭・行末にマッチ"
                            active={flags.multiline}
                            onClick={() => toggleFlag('multiline')}
                        />
                        <FlagToggle
                            label="s"
                            title="Dotall - . が改行にもマッチ"
                            active={flags.dotAll}
                            onClick={() => toggleFlag('dotAll')}
                        />
                        <FlagToggle
                            label="u"
                            title="Unicode - Unicode対応"
                            active={flags.unicode}
                            onClick={() => toggleFlag('unicode')}
                        />
                        <FlagToggle
                            label="y"
                            title="Sticky - lastIndexから開始"
                            active={flags.sticky}
                            onClick={() => toggleFlag('sticky')}
                        />
                    </div>

                    {/* サンプル読み込み */}
                    <div className="mt-4 flex items-center gap-2">
                        <label className="text-xs text-gray-400">Examples:</label>
                        <select
                            onChange={(e) => {
                                const example = REGEX_EXAMPLES.find(ex => ex.name === e.target.value);
                                if (example) {
                                    loadExample(example.pattern, example.flags, example.testString);
                                }
                            }}
                            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">選択してください</option>
                            {REGEX_EXAMPLES.map(example => (
                                <option key={example.name} value={example.name}>
                                    {example.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 置換モード */}
                {replaceMode && (
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                        <label className="text-sm font-semibold text-gray-300 block mb-2">Replacement</label>
                        <input
                            type="text"
                            value={replacePattern}
                            onChange={(e) => setReplacePattern(e.target.value)}
                            placeholder="$1@$2 or $<name>"
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            $1, $2: 番号付きキャプチャ | $&lt;name&gt;: 名前付きキャプチャ | $$: リテラル $
                        </p>
                    </div>
                )}

                {/* メインコンテンツ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* テスト文字列 */}
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-semibold text-gray-300">Test String</label>
                            <div className="text-xs text-gray-400">
                                {testResult.totalMatches} {testResult.totalMatches === 1 ? 'match' : 'matches'}
                            </div>
                        </div>

                        {/* ハイライト表示 */}
                        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-auto font-mono text-sm whitespace-pre-wrap break-words">
                            {highlightedText.map((part, idx) => (
                                <span
                                    key={idx}
                                    className={
                                        part.isMatch
                                            ? 'bg-yellow-500/30 border-b-2 border-yellow-500 cursor-pointer hover:bg-yellow-500/40'
                                            : ''
                                    }
                                    onClick={() => part.isMatch && setSelectedMatchIndex(part.matchIndex)}
                                >
                                    {part.text}
                                </span>
                            ))}
                        </div>

                        {/* テキストエリア（編集用） */}
                        <textarea
                            value={testString}
                            onChange={(e) => setTestString(e.target.value)}
                            placeholder="テスト用の文字列を入力してください..."
                            className="w-full mt-4 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        />
                    </div>

                    {/* マッチ結果 / 置換結果 */}
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-semibold text-gray-300">
                                {replaceMode ? 'Replace Result' : 'Matches'}
                            </label>
                            <button
                                onClick={() => setReplaceMode(!replaceMode)}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors"
                            >
                                {replaceMode ? 'マッチモード' : '置換モード'}
                            </button>
                        </div>

                        {replaceMode && replaceResult ? (
                            <div>
                                <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-auto font-mono text-sm whitespace-pre-wrap break-words">
                                    {replaceResult.output}
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-xs text-gray-400">
                                        {replaceResult.replacements} 箇所を置換
                                    </p>
                                    <button
                                        onClick={() => copyToClipboard(replaceResult.output, 'replace')}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                                    >
                                        {copiedField === 'replace' ? (
                                            <>
                                                <CheckCircle2 className="w-3 h-3" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" />
                                                Copy Result
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {testResult.matches.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-8">
                                        マッチする結果がありません
                                    </p>
                                ) : (
                                    <div className="space-y-2 max-h-[500px] overflow-auto">
                                        {testResult.matches.map((match, idx) => (
                                            <MatchCard
                                                key={idx}
                                                match={match}
                                                index={idx}
                                                isSelected={selectedMatchIndex === idx}
                                                onClick={() => setSelectedMatchIndex(idx)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* グループ詳細 */}
                {selectedMatch && (
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                        <h4 className="text-sm font-semibold text-gray-300 mb-4">
                            Match #{selectedMatchIndex! + 1} Details
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-700/50">
                                    <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                                        <th className="px-4 py-3">Group</th>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Value</th>
                                        <th className="px-4 py-3">Index</th>
                                        <th className="px-4 py-3">Length</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/50">
                                    {selectedMatch.groups.map((group, idx) => (
                                        <tr key={idx} className={idx === 0 ? 'bg-blue-500/5' : ''}>
                                            <td className="px-4 py-3 text-sm font-mono">{group.index}</td>
                                            <td className="px-4 py-3 text-sm">
                                                {group.name ? (
                                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                                                        {group.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">
                                                        {idx === 0 ? '(full)' : '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono">{group.value}</td>
                                            <td className="px-4 py-3 text-sm text-gray-400">{group.start}</td>
                                            <td className="px-4 py-3 text-sm text-gray-400">{group.length}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => copyToClipboard(group.value, `group-${idx}`)}
                                                    className="p-1 hover:bg-gray-600 rounded transition-colors"
                                                >
                                                    {copiedField === `group-${idx}` ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* クイックリファレンス */}
                <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                    <button
                        onClick={() => setShowCheatSheet(!showCheatSheet)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                    >
                        <BookOpen className="w-4 h-4" />
                        Quick Reference
                        <span className="text-xs text-gray-500">
                            {showCheatSheet ? '▼' : '▶'}
                        </span>
                    </button>

                    {showCheatSheet && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <CheatSheetSection title="基本メタキャラ">
                                <CheatSheetItem pattern="." description="任意の1文字" />
                                <CheatSheetItem pattern="\d \w \s" description="数字 / 英数字 / 空白" />
                                <CheatSheetItem pattern="\D \W \S" description="数字以外 / 英数字以外 / 空白以外" />
                                <CheatSheetItem pattern="^ $" description="行頭 / 行末" />
                                <CheatSheetItem pattern="[abc]" description="文字クラス" />
                                <CheatSheetItem pattern="[^abc]" description="否定文字クラス" />
                            </CheatSheetSection>

                            <CheatSheetSection title="繰り返し">
                                <CheatSheetItem pattern="*" description="0回以上" />
                                <CheatSheetItem pattern="+" description="1回以上" />
                                <CheatSheetItem pattern="?" description="0回または1回" />
                                <CheatSheetItem pattern="{n}" description="n回" />
                                <CheatSheetItem pattern="{n,m}" description="n〜m回" />
                                <CheatSheetItem pattern="*? +? ??  " description="最短マッチ" />
                            </CheatSheetSection>

                            <CheatSheetSection title="グループ・アサーション">
                                <CheatSheetItem pattern="(..." description="キャプチャグループ" />
                                <CheatSheetItem pattern="(?:...)" description="非キャプチャグループ" />
                                <CheatSheetItem pattern="(?<name>...)" description="名前付きグループ" />
                                <CheatSheetItem pattern="a|b" description="OR" />
                                <CheatSheetItem pattern="(?=...)" description="先読み" />
                                <CheatSheetItem pattern="(?!...)" description="否定先読み" />
                            </CheatSheetSection>
                        </div>
                    )}
                </div>

                {/* フッター */}
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-400">
                        <p>すべての処理はブラウザ内で実行されます。パターンとテスト文字列は localStorage に保存されます。</p>
                        <p className="mt-1 text-xs">JavaScript (ECMAScript) の正規表現エンジンを使用しています。</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// サブコンポーネント

function FlagToggle({ label, title, active, onClick }: { label: string; title: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`w-8 h-8 rounded-lg font-mono font-bold text-sm transition-colors ${
                active
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
        >
            {label}
        </button>
    );
}

function MatchCard({ match, index, isSelected, onClick }: { 
    match: RegexMatch; 
    index: number; 
    isSelected: boolean; 
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                isSelected
                    ? 'bg-blue-500/10 border-blue-500/50'
                    : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-xs font-semibold">
                            #{index + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                            Index {match.start}, Length {match.length}
                        </span>
                    </div>
                    <div className="font-mono text-sm break-all">{match.fullMatch}</div>
                    {match.groups.length > 1 && (
                        <div className="mt-2 text-xs text-gray-400">
                            {match.groups.slice(1).map((group, idx) => (
                                <span key={idx} className="mr-2">
                                    {group.name ? `${group.name}: ` : `${group.index}: `}
                                    <span className="text-gray-300">{group.value}</span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CheatSheetSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h5 className="font-semibold text-gray-300 mb-2">{title}</h5>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
}

function CheatSheetItem({ pattern, description }: { pattern: string; description: string }) {
    return (
        <div className="flex items-start gap-2">
            <code className="px-2 py-0.5 bg-gray-900 border border-gray-700 rounded text-xs font-mono text-blue-300 whitespace-nowrap">
                {pattern}
            </code>
            <span className="text-xs text-gray-400">{description}</span>
        </div>
    );
}
