import { Link } from 'react-router-dom';
import { Code2, Globe, Network, Lock, Terminal, Hash, Search } from 'lucide-react';

export default function DeveloperTools() {
    const tools = [
        {
            title: 'Generators',
            desc: 'UUID, Passwords, and Hashing (MD5/SHA/HMAC).',
            path: '/dev/generator',
            icon: Terminal,
            color: 'bg-blue-500'
        },
        {
            title: 'Hash Analyzer',
            desc: 'Identify hash types (MD5, SHA, Bcrypt, etc).',
            path: '/dev/hash',
            icon: Search,
            color: 'bg-orange-500'
        },
        {
            title: 'Web Tools',
            desc: 'JSON/YAML Converter, JWT Decoder, Regex Tester.',
            path: '/dev/web',
            icon: Globe,
            color: 'bg-green-500'
        },
        {
            title: 'Network Utils',
            desc: 'IPv4 Subnet Calculator, Status Codes (Coming Soon).',
            path: '#',
            icon: Network,
            color: 'bg-purple-500'
        }
    ];

    return (
        <div className="space-y-8 p-4">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Dev & Network</h2>
                <p className="text-gray-400 mt-2">Utilities for Developers and System Admins</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                        <Link 
                            key={tool.path} 
                            to={tool.path}
                            className={`group bg-gray-800 p-6 rounded-xl border border-gray-700 transition-all duration-200 ${tool.path === '#' ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-lg hover:border-gray-600'}`}
                        >
                            <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                <Icon size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{tool.title}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{tool.desc}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
