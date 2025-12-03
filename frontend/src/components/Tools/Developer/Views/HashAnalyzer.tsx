import { useState } from 'react';
import { useHashAnalyzer } from '../../../../hooks/useHashAnalyzer';
import { Search, CheckCircle2, HelpCircle } from 'lucide-react';

export default function HashAnalyzer() {
    const [input, setInput] = useState('');
    const { analyzeHash, results } = useHashAnalyzer();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);
        analyzeHash(val);
    };

    return (
        <div className="space-y-6 animate-fade-in-up max-w-3xl mx-auto">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Search className="text-primary-500" /> Hash Analyzer
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                    ハッシュ値を入力すると、その形式（MD5, SHA-256など）を自動判別します。
                </p>

                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={handleChange}
                        placeholder="Enter hash string (e.g., 5d41402abc4b2a76b9719d911017c592)"
                        className="w-full bg-gray-900 border border-gray-600 text-white px-4 py-4 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono text-sm shadow-inner transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                        Length: {input.length}
                    </div>
                </div>
            </div>

            {/* Results Area */}
            {input && (
                <div className="space-y-4">
                    <h4 className="text-gray-400 text-sm font-bold uppercase tracking-wider ml-2">Analysis Results</h4>
                    
                    {results.length > 0 ? (
                        <div className="grid gap-3">
                            {results.map((res, i) => (
                                <div key={i} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-start gap-4 animate-fade-in hover:border-primary-500/50 transition-colors">
                                    <div className="p-2 bg-green-500/10 rounded-full text-green-400 mt-1">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <h5 className="text-lg font-bold text-white">{res.name}</h5>
                                        <p className="text-gray-400 text-sm mt-1">{res.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 text-center">
                            <HelpCircle className="mx-auto text-gray-500 mb-2" size={32} />
                            <p className="text-gray-400">該当するハッシュ形式が見つかりませんでした。</p>
                            <p className="text-xs text-gray-600 mt-1">入力値が正しいか、または一般的なハッシュ形式か確認してください。</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
