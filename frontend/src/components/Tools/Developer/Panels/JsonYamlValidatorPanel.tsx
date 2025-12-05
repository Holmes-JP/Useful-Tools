import { useMemo, useState } from "react";
import yaml from "js-yaml";
import { AlertCircle, CheckCircle2, Copy, RefreshCcw } from "lucide-react";

type Mode = "json" | "yaml" | "auto";
type ResultTab = "pretty" | "tojson" | "toyaml";

type ParseResult = {
    ok: boolean;
    data?: any;
    error?: string;
    line?: number;
    column?: number;
    detected?: "json" | "yaml";
};

const SAMPLES: Record<string, { label: string; value: string }> = {
    simpleJson: { label: "Simple JSON", value: '{\n  "name": "Yuki",\n  "age": 26,\n  "skills": ["security", "network", "cpp"]\n}' },
    nestedJson: { label: "Nested JSON", value: '{\n  "env": {\n    "prod": {"url": "https://api.example.com", "timeout": 30},\n    "stg": {"url": "https://stg.example.com", "timeout": 10}\n  },\n  "features": ["a", "b", "c"]\n}' },
    yamlConfig: { label: "YAML Config", value: 'name: Yuki\nage: 26\nskills:\n  - security\n  - network\n  - cpp\n' },
};

function parseInput(text: string, mode: Mode): ParseResult {
    if (!text.trim()) return { ok: false, error: "入力が空です。" };

    const tryJson = (): ParseResult => {
        try {
            const data = JSON.parse(text);
            return { ok: true, data, detected: "json" };
        } catch (e: any) {
            // JSON.parse line/column estimation is hard; show message only.
            return { ok: false, error: e?.message || "Invalid JSON" };
        }
    };
    const tryYaml = (): ParseResult => {
        try {
            const data = yaml.load(text, { json: false, schema: yaml.DEFAULT_SCHEMA });
            return { ok: true, data, detected: "yaml" };
        } catch (e: any) {
            return { ok: false, error: e?.message || "Invalid YAML" };
        }
    };

    if (mode === "json") return tryJson();
    if (mode === "yaml") return tryYaml();

    const j = tryJson();
    if (j.ok) return j;
    const y = tryYaml();
    if (y.ok) return y;
    return { ok: false, error: `JSON も YAML もパースできませんでした。\nJSON: ${j.error || ""}\nYAML: ${y.error || ""}` };
}

function prettyJson(data: any, indent: number, sortKeys: boolean) {
    try {
        const replacer = sortKeys
            ? (_k: string, v: any) => {
                if (v && typeof v === "object" && !Array.isArray(v)) {
                    return Object.keys(v).sort().reduce((acc, key) => {
                        acc[key] = v[key];
                        return acc;
                    }, {} as any);
                }
                return v;
            }
            : undefined;
        return JSON.stringify(data, replacer, indent);
    } catch {
        return "";
    }
}

function copyText(text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
}

export default function JsonYamlValidatorPanel() {
    const [mode, setMode] = useState<Mode>("auto");
    const [indent, setIndent] = useState(2);
    const [sortKeys, setSortKeys] = useState(false);
    const [input, setInput] = useState("");
    const [tab, setTab] = useState<ResultTab>("pretty");
    const [sample, setSample] = useState("simpleJson");

    const parsed = useMemo(() => parseInput(input, mode), [input, mode]);

    const pretty = useMemo(() => {
        if (!parsed.ok || parsed.data === undefined) return "";
        if (parsed.detected === "json") return prettyJson(parsed.data, indent, sortKeys);
        try {
            return yaml.dump(parsed.data, { indent });
        } catch {
            return "";
        }
    }, [parsed, indent, sortKeys]);

    const toJson = useMemo(() => {
        if (!parsed.ok || parsed.data === undefined) return "";
        return prettyJson(parsed.data, indent, sortKeys);
    }, [parsed, indent, sortKeys]);

    const toYaml = useMemo(() => {
        if (!parsed.ok || parsed.data === undefined) return "";
        try {
            return yaml.dump(parsed.data, { indent });
        } catch {
            return "";
        }
    }, [parsed, indent]);

    function handleValidate() {
        // parse is already computed; just trigger re-render.
        setTab("pretty");
    }

    function handleFormat() {
        if (!parsed.ok || !pretty) return;
        setInput(pretty);
    }

    function handleClear() {
        setInput("");
    }

    function loadSample() {
        const s = SAMPLES[sample];
        if (!s) return;
        setInput(s.value);
    }

    return (
        <div className="space-y-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">Analyzer</div>
            <h3 className="text-2xl font-bold text-white">JSON / YAML Validator</h3>
            <p className="text-gray-400 text-sm">構文チェック、整形、相互変換を行います。入力はブラウザ内のみで処理されます。</p>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <label className="flex items-center gap-2 text-gray-300">
                        <input type="radio" checked={mode === "json"} onChange={() => setMode("json")} /> JSON
                    </label>
                    <label className="flex items-center gap-2 text-gray-300">
                        <input type="radio" checked={mode === "yaml"} onChange={() => setMode("yaml")} /> YAML
                    </label>
                    <label className="flex items-center gap-2 text-gray-300">
                        <input type="radio" checked={mode === "auto"} onChange={() => setMode("auto")} /> Auto detect
                    </label>
                    <div className="flex items-center gap-2 ml-auto">
                        <select
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-100"
                            value={sample}
                            onChange={e => setSample(e.target.value)}
                        >
                            {Object.entries(SAMPLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 hover:border-primary-500/60" onClick={loadSample}>Load Sample</button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <label className="flex items-center gap-2 text-gray-300">
                        Indent
                        <select
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-100"
                            value={indent}
                            onChange={e => setIndent(Number(e.target.value))}
                        >
                            <option value={2}>2 spaces</option>
                            <option value={4}>4 spaces</option>
                            <option value={0}>Minify (0)</option>
                        </select>
                    </label>
                    <label className="flex items-center gap-2 text-gray-300">
                        <input type="checkbox" checked={sortKeys} onChange={e => setSortKeys(e.target.checked)} />
                        Sort object keys (JSON)
                    </label>
                    <div className="flex gap-2 ml-auto">
                        <button className="px-4 py-2 bg-primary-500 text-black rounded font-semibold" onClick={handleValidate}>Validate</button>
                        <button className="px-3 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700" onClick={handleFormat}>
                            Format
                        </button>
                        <button className="px-3 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700" onClick={handleClear}>
                            <RefreshCcw size={14} className="inline mr-1" /> Clear
                        </button>
                    </div>
                </div>

                <textarea
                    className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-100 min-h-[200px] font-mono"
                    placeholder='{ "name": "Yuki", "age": 26 }'
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <button
                        className={`px-3 py-2 rounded border ${tab === "pretty" ? "border-primary-500/60 text-primary-300" : "border-gray-700 text-gray-300"}`}
                        onClick={() => setTab("pretty")}
                    >
                        Pretty
                    </button>
                    <button
                        className={`px-3 py-2 rounded border ${tab === "tojson" ? "border-primary-500/60 text-primary-300" : "border-gray-700 text-gray-300"}`}
                        onClick={() => setTab("tojson")}
                        disabled={!parsed.ok}
                    >
                        Convert to JSON
                    </button>
                    <button
                        className={`px-3 py-2 rounded border ${tab === "toyaml" ? "border-primary-500/60 text-primary-300" : "border-gray-700 text-gray-300"}`}
                        onClick={() => setTab("toyaml")}
                        disabled={!parsed.ok}
                    >
                        Convert to YAML
                    </button>
                    <button
                        className="ml-auto px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 flex items-center gap-1"
                        onClick={() => copyText(tab === "tojson" ? toJson : tab === "toyaml" ? toYaml : pretty)}
                    >
                        <Copy size={14} /> Copy
                    </button>
                </div>

                <pre className="bg-gray-950 border border-gray-800 rounded p-3 text-xs text-gray-100 min-h-[200px] overflow-auto">
                    {tab === "pretty" && (parsed.ok ? pretty : "Validate to see formatted output.")}
                    {tab === "tojson" && (parsed.ok ? toJson : "変換する前に、入力が有効である必要があります。")}
                    {tab === "toyaml" && (parsed.ok ? toYaml : "変換する前に、入力が有効である必要があります。")}
                </pre>
            </div>

            <div>
                {parsed.ok ? (
                    <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/40 text-green-200 p-3 rounded text-sm">
                        <CheckCircle2 size={18} />
                        <div>
                            {parsed.detected === "json" && "JSON is valid."}
                            {parsed.detected === "yaml" && "YAML is valid."}
                            {mode === "auto" && parsed.detected && <div className="text-xs text-gray-300">Detected as {parsed.detected.toUpperCase()}</div>}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded text-sm">
                        <AlertCircle size={18} />
                        <div>
                            {parsed.error || "解析に失敗しました。"}
                            <div className="text-xs text-gray-400">※最初に検出されたエラーのみ表示しています。</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
