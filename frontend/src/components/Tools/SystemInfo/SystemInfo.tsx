import { useSystemInfo } from '@/hooks/useSystemInfo';
import { 
    Monitor, 
    Wifi, 
    Cpu, 
    Globe, 
    Activity,
    HardDrive
} from 'lucide-react';
import clsx from 'clsx';

export default function SystemInfo() {
    const { systemData, speed, isTestingSpeed, runSpeedTest } = useSystemInfo();

    if (!systemData) {
        return (
            <div className="flex items-center justify-center h-64 text-primary-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mr-3"></div>
                Loading System Data...
            </div>
        );
    }

    // 情報表示用のカードコンポーネント
    const InfoCard = ({ icon: Icon, label, value, subValue, className }: any) => (
        <div className={clsx("bg-surface border border-gray-800 p-6 rounded-xl flex items-start gap-4", className)}>
            <div className="p-3 bg-gray-900 rounded-lg text-primary-400">
                <Icon size={24} />
            </div>
            <div className="flex-1">
                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-1">{label}</p>
                <p className="text-xl font-bold text-gray-100 font-mono break-all">{value}</p>
                {subValue && <p className="text-sm text-gray-400 mt-1">{subValue}</p>}
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            
            {/* ヘッダー */}
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Activity className="text-primary-500" />
                    System Diagnostics
                </h2>
                <p className="text-gray-500 font-mono text-sm">
                    Client-side Spec & Network Analyzer
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. ネットワーク情報 */}
                <div className="lg:col-span-3">
                    <h3 className="text-primary-400 font-bold mb-3 flex items-center gap-2">
                        <Globe size={18} /> Network Status
                    </h3>
                </div>
                
                <InfoCard 
                    icon={Wifi} 
                    label="Public IP Address" 
                    value={systemData.ip} 
                    subValue={systemData.provider}
                    className="border-primary-500/30 bg-primary-500/5"
                />
                
                <InfoCard 
                    icon={Activity} 
                    label="Connection Speed (Est.)" 
                    value={speed}
                    className="cursor-pointer hover:border-primary-500 transition-colors"
                />
                <div className="flex items-center">
                    <button
                        onClick={runSpeedTest}
                        disabled={isTestingSpeed}
                        className={clsx(
                            "w-full h-full min-h-[5rem] rounded-xl font-bold text-black shadow-lg transition-all flex items-center justify-center gap-2",
                            isTestingSpeed 
                                ? "bg-gray-600 cursor-wait text-gray-300" 
                                : "bg-primary-500 hover:bg-primary-400 hover:scale-[1.02]"
                        )}
                    >
                        {isTestingSpeed ? 'Measuring...' : 'Run Speed Test'}
                    </button>
                </div>

                {/* 2. ハードウェア情報 */}
                <div className="lg:col-span-3 mt-4">
                    <h3 className="text-primary-400 font-bold mb-3 flex items-center gap-2">
                        <Monitor size={18} /> Hardware Specs
                    </h3>
                </div>

                <InfoCard icon={Monitor} label="OS & Platform" value={systemData.os} subValue={systemData.device} />
                <InfoCard icon={Cpu} label="Browser" value={systemData.browser} />
                <InfoCard icon={Monitor} label="Screen Resolution" value={systemData.screen} />
                
                <div className="lg:col-span-2">
                    <InfoCard 
                        icon={HardDrive} 
                        label="GPU (Graphics)" 
                        value={systemData.gpu} 
                        subValue="WebGL Renderer"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <InfoCard 
                        icon={Cpu} 
                        label="Logical Processors (Threads)" // Cores -> Threads に変更
                        value={systemData.cpuThreads} 
                    />
                    <InfoCard 
                        icon={HardDrive} 
                        label="Memory (Approx)" 
                        value={systemData.memory} 
                    />
                </div>

            </div>
        </div>
    );
}