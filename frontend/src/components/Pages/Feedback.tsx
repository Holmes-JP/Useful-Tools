import { MessageSquarePlus, ExternalLink,} from 'lucide-react';

export default function Feedback() {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-100 rounded-full">
                        <MessageSquarePlus className="text-orange-500" size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Request & Feedback</h2>
                        <p className="text-gray-500 text-sm">Help us improve this tool</p>
                    </div>
                </div>
                
                <div className="prose text-gray-600 mb-8 leading-relaxed">
                    <p>
                        「このファイル形式に対応してほしい」「ここが使いにくい」「バグを見つけた」など、
                        あらゆるご意見・ご要望をお待ちしています。
                    </p>
                    <p>
                        開発者が内容を確認し、可能な限り機能追加や改善を行います。
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <a 
                        href="https://docs.google.com/forms/" // ※後で自分のGoogleフォームURLに書き換えてください
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                        <span>ご要望フォームを開く</span>
                        <ExternalLink size={18} />
                    </a>
                    
                    <p className="text-xs text-center text-gray-400">
                        ※Googleフォームへ移動します。アカウントなしで送信可能です。
                    </p>
                </div>
            </div>

            {/* おまけ：連絡先など */}
            <div className="mt-8 text-center text-gray-400 text-sm">
                <p>Designed & Developed by Holmes-JP</p>
            </div>
        </div>
    );
}