import React, { useState } from 'react';
import { 
    Clock, Hash, Dices, Shuffle, PieChart, 
    ScrollText, Type, Hourglass, Timer, Image, 
    Grid3X3, Copy, ExternalLink 
} from 'lucide-react';
import clsx from 'clsx';

export default function StreamerDashboard() {
    const [baseUrl] = useState(window.location.origin);

    // --- 1. Clock Config ---
    const [clockColor, setClockColor] = useState('#ffffff');
    const [clockBg, setClockBg] = useState('transparent');
    const [clockFont, setClockFont] = useState('sans-serif');
    const [showSeconds, setShowSeconds] = useState(true);
    const clockUrl = `${baseUrl}/streamer/view/clock?color=${encodeURIComponent(clockColor)}&bg=${encodeURIComponent(clockBg)}&font=${clockFont}&sec=${showSeconds}`;

    // --- 2. Counter Config ---
    const [counterColor, setCounterColor] = useState('#00ff00');
    const counterUrl = `${baseUrl}/streamer/view/counter?color=${encodeURIComponent(counterColor)}`;

    // --- 3. Dice Config ---
    const [diceColor, setDiceColor] = useState('#ffffff');
    const [diceDot, setDiceDot] = useState('#000000');
    const [diceCount, setDiceCount] = useState(1);
    const diceUrl = `${baseUrl}/streamer/view/dice?color=${encodeURIComponent(diceColor)}&dot=${encodeURIComponent(diceDot)}&n=${diceCount}`;

    // --- 4. RNG Config ---
    const [rngMin, setRngMin] = useState(1);
    const [rngMax, setRngMax] = useState(100);
    const [rngColor, setRngColor] = useState('#00ff00');
    const rngUrl = `${baseUrl}/streamer/view/rng?min=${rngMin}&max=${rngMax}&color=${encodeURIComponent(rngColor)}`;

    // --- 5. Roulette Config ---
    const [rouletteItems, setRouletteItems] = useState("A賞\nB賞\nC賞\nハズレ");
    const rouletteItemsParam = rouletteItems.split('\n').map(i => i.trim()).filter(i => i !== '').join(',');
    const rouletteUrl = `${baseUrl}/streamer/view/roulette?items=${encodeURIComponent(rouletteItemsParam)}`;

    // --- 6. Ticker Config ---
    const [tickerText, setTickerText] = useState("お知らせ: 毎週土曜日は参加型配信の日です！");
    const [tickerColor, setTickerColor] = useState('#ffffff');
    const [tickerSpeed, setTickerSpeed] = useState(15);
    const tickerUrl = `${baseUrl}/streamer/view/ticker?text=${encodeURIComponent(tickerText)}&color=${encodeURIComponent(tickerColor)}&speed=${tickerSpeed}`;

    // --- 7. Banner Config ---
    const [bannerText, setBannerText] = useState("初見さん歓迎！");
    const [bannerColor, setBannerColor] = useState('#ffffff');
    const [bannerBorder, setBannerBorder] = useState(true);
    const bannerUrl = `${baseUrl}/streamer/view/text?text=${encodeURIComponent(bannerText)}&color=${encodeURIComponent(bannerColor)}&border=${bannerBorder}`;

    // --- 8. Timer Config ---
    const [timerMin, setTimerMin] = useState(5);
    const [timerEndMsg, setTimerEndMsg] = useState("配信開始！");
    const [timerColor, setTimerColor] = useState('#ffffff');
    const timerUrl = `${baseUrl}/streamer/view/timer?min=${timerMin}&end=${encodeURIComponent(timerEndMsg)}&color=${encodeURIComponent(timerColor)}`;

    // --- 9. Stopwatch Config ---
    const [stopwatchColor, setStopwatchColor] = useState('#ffffff');
    const stopwatchUrl = `${baseUrl}/streamer/view/stopwatch?color=${encodeURIComponent(stopwatchColor)}`;

    // --- 10. Slideshow Config ---
    const [slideUrls, setSlideUrls] = useState("https://placehold.co/600x400/000/fff?text=Image1\nhttps://placehold.co/600x400/222/fff?text=Image2");
    const [slideInterval, setSlideInterval] = useState(5);
    const slideUrlParam = slideUrls.split('\n').map(u => u.trim()).filter(u => u !== '').join(',');
    const slideshowUrl = `${baseUrl}/streamer/view/slideshow?urls=${encodeURIComponent(slideUrlParam)}&interval=${slideInterval}`;

    // --- 11. Bingo Config ---
    const [bingoTitle, setBingoTitle] = useState("MISSION BINGO");
    const [bingoItems, setBingoItems] = useState("ノーデス\nハンドガン縛り\n回復禁止\n10キル\n3連勝");
    const [bingoColor, setBingoColor] = useState('#00ff00');
    const bingoItemsParam = bingoItems.split('\n').map(i => i.trim()).filter(i => i !== '').join(',');
    const bingoUrl = `${baseUrl}/streamer/view/bingo?title=${encodeURIComponent(bingoTitle)}&items=${encodeURIComponent(bingoItemsParam)}&color=${encodeURIComponent(bingoColor)}`;

    // 共通コピー関数
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("URL Copied! Paste this into OBS Browser Source.");
    };

    // 共通UIパーツ: カラーピッカー
    const ColorInput = ({ label, value, onChange }: any) => (
        <div>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <input 
                    type="color" 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className="w-8 h-8 bg-transparent border-0 cursor-pointer p-0" 
                />
                <span className="text-xs text-gray-400 font-mono">{value}</span>
            </div>
        </div>
    );

    // 共通UIパーツ: URL表示 & コピー
    const UrlBar = ({ url, previewHeight = "h-24", previewScale = "scale-50" }: any) => (
        <div className="space-y-2">
            <p className="text-xs text-gray-500">Preview:</p>
            <div className={`border border-gray-700 rounded-lg overflow-hidden bg-checkerboard ${previewHeight} flex items-center justify-center relative bg-black/20`}>
                <iframe src={url} className={`w-full h-full border-0 ${previewScale}`} title="Preview" />
            </div>
            <div className="bg-gray-900 border border-gray-800 p-2 rounded flex items-center gap-2">
                <input readOnly value={url} className="bg-transparent text-gray-500 text-xs flex-1 outline-none font-mono" />
                <button onClick={() => copyToClipboard(url)} className="text-primary-500 hover:text-white p-1 transition"><Copy size={16} /></button>
                <a href={url} target="_blank" rel="noreferrer" className="text-primary-500 hover:text-white p-1 transition"><ExternalLink size={16} /></a>
            </div>
        </div>
    );

    // 共通UIパーツ: カードラッパー
    const ToolCard = ({ title, icon: Icon, children }: any) => (
        <div className="bg-surface border border-gray-800 p-6 rounded-xl shadow-lg hover:border-primary-500/30 transition duration-300">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
                <Icon className="text-primary-500" size={20} />
                <h3 className="text-lg font-bold text-gray-200">{title}</h3>
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    Streamer Tools
                </h2>
                <p className="text-gray-500 font-mono text-sm">
                    Overlay Widgets for OBS / Twitch / YouTube
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                
                {/* 1. Clock */}
                <ToolCard title="Digital Clock" icon={Clock}>
                    <div className="grid grid-cols-2 gap-4">
                        <ColorInput label="Text Color" value={clockColor} onChange={setClockColor} />
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Background</label>
                            <select value={clockBg} onChange={e => setClockBg(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded px-2 py-1 text-sm">
                                <option value="transparent">Transparent</option>
                                <option value="#000000">Black</option>
                                <option value="#00ff00">Green (GB)</option>
                            </select>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-gray-300 cursor-pointer text-sm">
                        <input type="checkbox" checked={showSeconds} onChange={e => setShowSeconds(e.target.checked)} className="accent-primary-500" />
                        Show Seconds
                    </label>
                    <UrlBar url={clockUrl} />
                </ToolCard>

                {/* 2. Counter */}
                <ToolCard title="Win/Loss Counter" icon={Hash}>
                    <ColorInput label="Main Color" value={counterColor} onChange={setCounterColor} />
                    <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded text-xs text-blue-300">
                        Left Click: +1 | Right Click: -1<br/>
                        Keys: [W]in, [L]ose, [R]eset
                    </div>
                    <UrlBar url={counterUrl} />
                </ToolCard>

                {/* 3. Dice */}
                <ToolCard title="Dice Roll" icon={Dices}>
                    <div className="grid grid-cols-2 gap-2">
                        <ColorInput label="Body" value={diceColor} onChange={setDiceColor} />
                        <ColorInput label="Dots" value={diceDot} onChange={setDiceDot} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Count</label>
                        <select value={diceCount} onChange={e => setDiceCount(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white rounded px-2 py-1 text-sm">
                            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <UrlBar url={diceUrl} previewScale="scale-75" />
                </ToolCard>

                {/* 4. RNG */}
                <ToolCard title="Random Number" icon={Shuffle}>
                    <ColorInput label="Text Color" value={rngColor} onChange={setRngColor} />
                    <div className="flex items-center gap-2">
                        <input type="number" value={rngMin} onChange={e => setRngMin(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white p-1 rounded text-sm" placeholder="Min" />
                        <span className="text-gray-500">-</span>
                        <input type="number" value={rngMax} onChange={e => setRngMax(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white p-1 rounded text-sm" placeholder="Max" />
                    </div>
                    <UrlBar url={rngUrl} />
                </ToolCard>

                {/* 5. Roulette */}
                <div className="md:col-span-2 xl:col-span-1">
                    <ToolCard title="Roulette Wheel" icon={PieChart}>
                        <label className="block text-xs text-gray-500 mb-1">Items (One per line)</label>
                        <textarea 
                            value={rouletteItems} 
                            onChange={e => setRouletteItems(e.target.value)}
                            className="w-full h-24 bg-gray-900 text-white border border-gray-700 rounded p-2 text-xs font-mono focus:border-primary-500 focus:outline-none resize-none"
                        />
                        <UrlBar url={rouletteUrl} previewHeight="h-40" previewScale="scale-75" />
                    </ToolCard>
                </div>

                {/* 6. Ticker */}
                <ToolCard title="Scrolling Text" icon={ScrollText}>
                    <label className="block text-xs text-gray-500 mb-1">Message</label>
                    <input type="text" value={tickerText} onChange={e => setTickerText(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-sm text-white mb-2" />
                    <div className="grid grid-cols-2 gap-4">
                        <ColorInput label="Color" value={tickerColor} onChange={setTickerColor} />
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Speed (Sec)</label>
                            <input type="number" value={tickerSpeed} onChange={e => setTickerSpeed(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-1 text-sm" />
                        </div>
                    </div>
                    <UrlBar url={tickerUrl} previewHeight="h-16" />
                </ToolCard>

                {/* 7. Banner */}
                <ToolCard title="Fixed Banner" icon={Type}>
                    <label className="block text-xs text-gray-500 mb-1">Text</label>
                    <input type="text" value={bannerText} onChange={e => setBannerText(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-sm text-white mb-2" />
                    <div className="flex justify-between items-center">
                        <ColorInput label="Color" value={bannerColor} onChange={setBannerColor} />
                        <label className="flex items-center gap-2 text-gray-300 cursor-pointer text-sm">
                            <input type="checkbox" checked={bannerBorder} onChange={e => setBannerBorder(e.target.checked)} className="accent-primary-500" />
                            Border
                        </label>
                    </div>
                    <UrlBar url={bannerUrl} previewHeight="h-20" />
                </ToolCard>

                {/* 8. Timer */}
                <ToolCard title="Countdown / BRB" icon={Hourglass}>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                            <input type="number" value={timerMin} onChange={e => setTimerMin(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-1 text-sm" />
                        </div>
                        <ColorInput label="Color" value={timerColor} onChange={setTimerColor} />
                    </div>
                    <label className="block text-xs text-gray-500 mb-1">End Message</label>
                    <input type="text" value={timerEndMsg} onChange={e => setTimerEndMsg(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-sm text-white" />
                    <UrlBar url={timerUrl} />
                </ToolCard>

                {/* 9. Stopwatch */}
                <ToolCard title="Simple Stopwatch" icon={Timer}>
                    <ColorInput label="Color" value={stopwatchColor} onChange={setStopwatchColor} />
                    <p className="text-[10px] text-gray-500 mt-1">Starts immediately upon loading.</p>
                    <UrlBar url={stopwatchUrl} />
                </ToolCard>

                {/* 10. Slideshow */}
                <div className="md:col-span-2 xl:col-span-1">
                    <ToolCard title="Image Slideshow" icon={Image}>
                        <label className="block text-xs text-gray-500 mb-1">Image URLs (One per line)</label>
                        <textarea 
                            value={slideUrls} 
                            onChange={e => setSlideUrls(e.target.value)}
                            className="w-full h-24 bg-gray-900 text-white border border-gray-700 rounded p-2 text-xs font-mono focus:border-primary-500 focus:outline-none resize-none mb-2"
                            placeholder="https://..."
                        />
                        <div className="mb-2">
                            <label className="block text-xs text-gray-500 mb-1">Interval (Sec)</label>
                            <input type="number" value={slideInterval} onChange={e => setSlideInterval(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-1 text-sm" />
                        </div>
                        <UrlBar url={slideshowUrl} />
                    </ToolCard>
                </div>

                {/* 11. Bingo */}
                <div className="md:col-span-2 xl:col-span-1">
                    <ToolCard title="Bingo Generator" icon={Grid3X3}>
                        <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Title</label>
                                <input type="text" value={bingoTitle} onChange={e => setBingoTitle(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-sm text-white" />
                            </div>
                            <ColorInput label="Title Color" value={bingoColor} onChange={setBingoColor} />
                        </div>
                        <label className="block text-xs text-gray-500 mb-1">Items (Shuffle)</label>
                        <textarea 
                            value={bingoItems} 
                            onChange={e => setBingoItems(e.target.value)}
                            className="w-full h-24 bg-gray-900 text-white border border-gray-700 rounded p-2 text-xs font-mono focus:border-primary-500 focus:outline-none resize-none"
                        />
                        <UrlBar url={bingoUrl} previewHeight="h-40" />
                    </ToolCard>
                </div>

            </div>
        </div>
    );
}