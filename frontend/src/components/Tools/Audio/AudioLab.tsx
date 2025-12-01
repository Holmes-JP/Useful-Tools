import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

export default function AudioLab() {
    return (
        <div className="space-y-8 p-4 text-white">
            <h2 className="text-3xl font-bold text-center">Audio Lab</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <Link to="/audio/editor" className="bg-gray-800 p-6 rounded-xl hover:bg-gray-700">
                    <Music className="text-purple-500 mb-2" size={32} />
                    <h3 className="text-xl font-bold">Audio Editor</h3>
                </Link>
            </div>
        </div>
    );
}
