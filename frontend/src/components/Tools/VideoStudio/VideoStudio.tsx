import { Link } from 'react-router-dom';
import { Image, Film, Video } from 'lucide-react';

export default function VideoStudio() {
    return (
        <div className="space-y-8 p-4 text-white">
            <h2 className="text-3xl font-bold text-center">Video Studio</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <Link to="/video/thumbnail" className="bg-gray-800 p-6 rounded-xl hover:bg-gray-700">
                    <Image className="text-blue-500 mb-2" size={32} />
                    <h3 className="text-xl font-bold">Thumbnail Generator</h3>
                </Link>
                <Link to="/video/gif" className="bg-gray-800 p-6 rounded-xl hover:bg-gray-700">
                    <Film className="text-pink-500 mb-2" size={32} />
                    <h3 className="text-xl font-bold">GIF Maker</h3>
                </Link>
            </div>
        </div>
    );
}
