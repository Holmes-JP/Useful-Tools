import { useEffect, useMemo, useRef, useState, ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Download, FileText, RefreshCcw, Sparkles } from "lucide-react";

type OutputMode = "fragment" | "full";

const sampleMarkdown = `# タイトル

- リスト1
- リスト2

**太字** や *斜体*、\`インラインコード\`

\`\`\`js
console.log("Hello Markdown");
\`\`\`
`;

function slugify(text: string) {
    const base = text.trim();
    const ascii = base
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    return ascii || encodeURIComponent(base);
}

export default function MarkdownHtmlPanel() {
    const [markdown, setMarkdown] = useState(sampleMarkdown);
    const [html, setHtml] = useState("");
    const [gfm, setGfm] = useState(true);
    const [allowHtml, setAllowHtml] = useState(false);
    const [headingIds, setHeadingIds] = useState(true);
    const [outputMode, setOutputMode] = useState<OutputMode>("fragment");
    const [autoPreview, setAutoPreview] = useState(true);

    const lineCount = useMemo(() => (markdown ? markdown.split(/\r?\n/).length : 0), [markdown]);
    const charCount = useMemo(() => markdown.length, [markdown]);
    const previewRef = useRef<HTMLDivElement>(null);

    const components = useMemo(() => {
        if (!headingIds) return undefined;
        return {
            h1: (props: ComponentProps<'h1'>) => <h1 id={slugify(String(props.children))} {...props} />,
            h2: (props: ComponentProps<'h2'>) => <h2 id={slugify(String(props.children))} {...props} />,
            h3: (props: ComponentProps<'h3'>) => <h3 id={slugify(String(props.children))} {...props} />,
            h4: (props: ComponentProps<'h4'>) => <h4 id={slugify(String(props.children))} {...props} />,
            h5: (props: ComponentProps<'h5'>) => <h5 id={slugify(String(props.children))} {...props} />,
            h6: (props: ComponentProps<'h6'>) => <h6 id={slugify(String(props.children))} {...props} />,
        };
    }, [headingIds]);

    const remarkPlugins = useMemo(() => (gfm ? [remarkGfm] : []), [gfm]);

    const syncHtml = () => {
        const fragment = previewRef.current?.innerHTML ?? "";
        if (outputMode === "full") {
            const full = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Markdown Export</title>
</head>
<body>
${fragment}
</body>
</html>`;
            setHtml(full);
        } else {
            setHtml(fragment);
        }
    };

    useEffect(() => {
        if (autoPreview) syncHtml();
    }, [autoPreview, outputMode, markdown, gfm, allowHtml, headingIds]);

    function copy(text: string) {
        if (!text) return;
        navigator.clipboard?.writeText(text);
    }

    function download() {
        if (!html) return;
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "markdown.html";
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FileText size={18} /> Markdown → HTML Converter
                    </h4>
                    <p className="text-xs text-gray-400">リアルタイムで Markdown を HTML に変換し、コピー / ダウンロードできます。</p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-full px-3 py-1">GFM + ライブプレビュー</div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={gfm} onChange={e => setGfm(e.target.checked)} />
                    GitHub Flavored Markdown
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={allowHtml} onChange={e => setAllowHtml(e.target.checked)} />
                    Allow raw HTML (unsanitized)
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={headingIds} onChange={e => setHeadingIds(e.target.checked)} />
                    Add ids to headings
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={autoPreview} onChange={e => setAutoPreview(e.target.checked)} />
                    Auto preview
                </label>
                <label className="flex items-center gap-2">
                    Output
                    <select className="bg-gray-900 border border-gray-800 rounded p-2 text-white" value={outputMode} onChange={e => setOutputMode(e.target.value as OutputMode)}>
                        <option value="fragment">Fragment (body内)</option>
                        <option value="full">Full HTML document</option>
                    </select>
                </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-300">
                        <span>Markdown Input</span>
                        <div className="flex gap-2">
                            <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={() => copy(markdown)}>
                                <Copy size={12} className="inline mr-1" /> Copy
                            </button>
                            <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={() => setMarkdown(sampleMarkdown)}>
                                <Sparkles size={12} className="inline mr-1" /> Load sample
                            </button>
                            <button
                                className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200"
                                onClick={() => {
                                    setMarkdown("");
                                    setHtml("");
                                }}
                            >
                                <RefreshCcw size={12} className="inline mr-1" /> Clear
                            </button>
                        </div>
                    </div>
                    <textarea
                        className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[260px]"
                        value={markdown}
                        onChange={e => setMarkdown(e.target.value)}
                        placeholder="# Title..."
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Lines: {lineCount}</span>
                        <span>Chars: {charCount}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-300">
                        <span>Preview</span>
                        {!autoPreview && (
                            <button className="px-2 py-1 bg-primary-500 rounded text-xs text-black" onClick={syncHtml}>
                                更新
                            </button>
                        )}
                    </div>
                    <div ref={previewRef} className="bg-gray-950 border border-gray-800 rounded p-3 prose prose-invert max-w-none min-h-[260px] overflow-auto">
                        <ReactMarkdown remarkPlugins={remarkPlugins} skipHtml={!allowHtml} components={components}>
                            {markdown}
                        </ReactMarkdown>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-300">
                        <span>Generated HTML</span>
                        <div className="flex gap-2">
                            <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={() => copy(html)}>
                                <Copy size={12} className="inline mr-1" /> Copy HTML
                            </button>
                            <button className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200" onClick={download}>
                                <Download size={12} className="inline mr-1" /> Download
                            </button>
                        </div>
                    </div>
                    <textarea className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[260px]" value={html} readOnly placeholder="生成された HTML がここに表示されます" />
                    {allowHtml ? <p className="text-xs text-amber-300">サニタイズ無効です。信頼できない入力では XSS に注意してください。</p> : <p className="text-xs text-gray-400">HTML タグはエスケープされます。</p>}
                </div>
            </div>
        </section>
    );
}
