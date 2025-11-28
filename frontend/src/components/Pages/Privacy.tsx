import { ShieldCheck, Lock, Cpu } from 'lucide-react';

export default function Privacy() {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <ShieldCheck className="text-green-500" size={32} />
                Privacy & Security
            </h2>
            
            <div className="space-y-8">
                <section>
                    <h3 className="text-xl font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Lock size={20} className="text-blue-500" />
                        No File Uploads (サーバーへのアップロードなし)
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-2">
                        Your files are <strong>never uploaded to our servers</strong>. 
                        Unlike other online converters, "Useful Tools" processes everything directly inside your browser using WebAssembly technology.
                    </p>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        当サイトでは、お客様のファイルをサーバーにアップロードすることは一切ありません。
                        WebAssembly技術を使用することで、すべての変換・圧縮処理はお客様のブラウザ（端末）内だけで完結します。
                        機密文書やプライベートな写真が外部に送信される心配はありません。
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Cpu size={20} className="text-purple-500" />
                        Local Processing (ローカル高速処理)
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-2">
                        We use FFmpeg.wasm and browser-image-compression to handle complex processing locally.
                        This allows for unlimited file sizes and zero network latency.
                    </p>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        FFmpeg.wasmなどの技術により、動画変換や画像圧縮をローカル環境で高速に実行します。
                        ファイルをインターネット経由で送受信する待ち時間が発生しないため、通信環境が悪い場所でも快適にご利用いただけます。
                    </p>
                </section>

                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                    <p className="text-blue-800 text-sm font-semibold">
                        "Secure by Design" — You can even use this tool while offline!<br/>
                        インターネット接続を切った状態（オフライン）でも動作します。ぜひお試しください。
                    </p>
                </div>
            </div>
        </div>
    );
}