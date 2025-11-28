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
                        No File Uploads
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                        Your files are <strong>never uploaded to our servers</strong>. 
                        Unlike other online converters, "Useful Tools" processes everything directly inside your browser using WebAssembly technology.
                        This means your sensitive documents, personal photos, and videos never leave your device.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Cpu size={20} className="text-purple-500" />
                        Local Processing
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                        We use FFmpeg.wasm and browser-image-compression to handle complex processing locally.
                        This allows for unlimited file sizes (limited only by your device's memory) and zero network latency.
                    </p>
                </section>

                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <p className="text-blue-800 text-sm font-semibold text-center">
                        "Secure by Design" — You can even use this tool while offline!
                    </p>
                </div>
            </div>
        </div>
    );
}