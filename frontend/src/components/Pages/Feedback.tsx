import { MessageSquarePlus, ExternalLink,} from 'lucide-react';

export default function Feedback() {
    return (
        <div className="max-w-3xl mx-auto h-full py-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
                
                <div className="p-4 bg-orange-100 text-orange-600 rounded-full mb-6">
                    <MessageSquarePlus size={48} />
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-2">Request & Feedback</h2>
                <p className="text-gray-500 mb-8 max-w-lg">
                    「このファイル形式に対応してほしい」「バグを見つけた」など、<br/>
                    あなたの声がこのツールを進化させます。
                </p>

                <div className="grid md:grid-cols-2 gap-6 w-full mb-8 text-left">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                            機能リクエスト
                        </h3>
                        <p className="text-sm text-gray-600">
                            対応してほしいフォーマットや、新しい機能のアイデアがあれば教えてください。
                        </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                            バグ報告
                        </h3>
                        <p className="text-sm text-gray-600">
                            うまく変換できないファイルや、表示崩れなどがあればご報告ください。
                        </p>
                    </div>
                </div>

                <a 
                    href="https://docs.google.com/forms/d/e/1FAIpQLSckTDscUR12GxxOlDkmaEh7e088k-RzOHG-UoRtjb_GwcITSQ/viewform?usp=publish-editor" 
                    target="_blank"
                    rel="noreferrer"
                    className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                    <span>フィードバックフォームを開く</span>
                    <ExternalLink size={20} className="opacity-80 group-hover:translate-x-1 transition-transform" />
                </a>

                <p className="text-xs text-gray-400 mt-6">
                    ※Googleフォームが新しいタブで開きます。<br/>
                    匿名で送信でき、メールアドレスは収集されません。
                </p>
            </div>
        </div>
    );
}