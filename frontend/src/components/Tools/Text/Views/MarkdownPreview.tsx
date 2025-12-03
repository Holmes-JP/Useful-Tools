import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileCode, Eye } from 'lucide-react';

export default function MarkdownPreview() {
    const [markdown, setMarkdown] = useState('# Hello, Markdown!\n\nThis tool supports **GFM** (GitHub Flavored Markdown).\n\n- [x] List items\n- [ ] Task lists\n\n```js\nconsole.log("Code blocks");\n```\n\n| Header | Header |\n| --- | --- |\n| Cell | Cell |');

    return (
        <div className="h-[calc(100vh-250px)] min-h-[500px] flex flex-col md:flex-row gap-4 animate-fade-in-up">
            {/* Editor */}
            <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-2 px-2">
                    <FileCode size={14} /> EDITOR
                </div>
                <textarea 
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="flex-1 w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white font-mono text-sm resize-none focus:border-primary-500 focus:outline-none"
                />
            </div>

            {/* Preview */}
            <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-2 px-2">
                    <Eye size={14} /> PREVIEW
                </div>
                <div className="flex-1 w-full bg-white text-gray-900 rounded-xl p-6 overflow-y-auto border border-gray-300 prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {markdown}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
