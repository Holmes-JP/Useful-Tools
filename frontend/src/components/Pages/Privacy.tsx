import { ShieldCheck, Lock, Cpu } from 'lucide-react';
import Head from '@/components/Head';

export default function Privacy() {
    return (
        <div className="max-w-3xl mx-auto py-8">
            <Head 
                title="Privacy & Security" 
                description="Your files never leave your device. Secure, serverless processing with Useful Tools."
                path="/privacy"
            />

            <div className="bg-surface p-10 rounded-2xl shadow-xl border border-gray-800 text-gray-300">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-800">
                    <div className="p-3 bg-primary-500/10 rounded-full">
                        <ShieldCheck className="text-primary-500" size={40} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white">Privacy & Security</h2>
                        <p className="text-gray-500 mt-1">Our commitment to your data safety</p>
                    </div>
                </div>
                
                <div className="space-y-12">
                    {/* Section 1 */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                            <Lock size={24} className="text-blue-400" />
                            No File Uploads (サーバーへの送信なし)
                        </h3>
                        <p className="leading-relaxed mb-4 text-gray-400">
                            Your files are <strong>never uploaded to our servers</strong>. 
                            Unlike other online converters, "Useful Tools" processes everything directly inside your browser using WebAssembly technology.
                        </p>
                        <p className="text-sm text-gray-500 leading-relaxed bg-black/20 p-4 rounded-lg border border-gray-800/50">
                            当サイトでは、お客様のファイルをサーバーにアップロードすることは一切ありません。
                            WebAssembly技術を使用することで、すべての変換・圧縮処理はお客様のブラウザ（端末）内だけで完結します。
                            機密文書やプライベートな写真が外部に送信される心配はありません。
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                            <Cpu size={24} className="text-purple-400" />
                            Local Processing (ローカル高速処理)
                        </h3>
                        <p className="leading-relaxed mb-4 text-gray-400">
                            We use FFmpeg.wasm and browser-image-compression to handle complex processing locally.
                            This allows for unlimited file sizes and zero network latency.
                        </p>
                        <p className="text-sm text-gray-500 leading-relaxed bg-black/20 p-4 rounded-lg border border-gray-800/50">
                            FFmpeg.wasmなどの技術により、動画変換や画像圧縮をローカル環境で高速に実行します。
                            ファイルをインターネット経由で送受信する待ち時間が発生しないため、通信環境が悪い場所でも快適にご利用いただけます。
                        </p>
                    </section>

                    {/* Offline Support Badge */}
                    <div className="bg-primary-500/10 p-6 rounded-xl border border-primary-500/20 text-center mt-8">
                        <p className="text-primary-400 font-semibold mb-1">
                            "Secure by Design"
                        </p>
                        <p className="text-xs text-primary-500/70">
                            You can even use this tool while offline!<br/>
                            インターネット接続を切った状態（オフライン）でも動作します。ぜひお試しください。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}