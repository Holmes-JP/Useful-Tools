import React, { useState } from 'react';
import { 
    Clock, Hash, Copy, ExternalLink, Dices, Shuffle, PieChart, 
    ScrollText, Type, Hourglass, Timer, Image, Grid3X3, PartyPopper, BarChart3
} from 'lucide-react';

export default function StreamerDashboard() {
    const [baseUrl] = useState(window.location.origin);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("URL Copied! Paste this into OBS Browser Source.");
    };

    const Section = ({ title, icon: Icon, url, children }: any) => (
        <div className="bg-surface border border-gray-700 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
                <Icon className="text-primary-500" />
                <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <div className="space-y-4">
                {children}
                <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Preview:</p>
                    <div className="border border-gray-600 rounded-lg overflow-hidden bg-checkerboard h-32 flex items-center justify-center relative bg-gray-800">
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                        <iframe src={url} className="w-full h-full border-0 scale-75 origin-center" />
                    </div>
                </div>
                <div className="bg-gray-900 p-3 rounded flex items-center gap-2">
                    <input readOnly value={url} className="bg-transparent text-gray-400 text-xs flex-1 outline-none font-mono" />
                    <button onClick={() => copyToClipboard(url)} className="text-primary-500 hover:text-white p-2"><Copy size={16} /></button>
                    <a href={url} target="_blank" rel="noreferrer" className="text-primary-500 hover:text-white p-2"><ExternalLink size={16} /></a>
                </div>
            </div>
        </div>
    );

    // --- State Definitions ---
    // 1. Clock
    const [clockColor, setClockColor] = useState('#ffffff');
    const [clockBg, setClockBg] = useState('transparent');
    const [clockFont, setClockFont] = useState('sans-serif');
    const [showSeconds, setShowSeconds] = useState(true);
    const clockUrl = `${baseUrl}/streamer/view/clock?color=${encodeURIComponent(clockColor)}&bg=${encodeURIComponent(clockBg)}&font=${clockFont}&sec=${showSeconds}`;

    // 2. Counter
    const [counterColor, setCounterColor] = useState('#00ff00');
    const counterUrl = `${baseUrl}/streamer/view/counter?color=${encodeURIComponent(counterColor)}`;

    // 3. Dice
    const [diceColor, setDiceColor] = useState('#ffffff');
    const [diceDot, setDiceDot] = useState('#000000');
    const [diceCount, setDiceCount] = useState(1);
    const diceUrl = `${baseUrl}/streamer/view/dice?color=${encodeURIComponent(diceColor)}&dot=${encodeURIComponent(diceDot)}&n=${diceCount}`;

    // 4. RNG
    const [rngMin, setRngMin] = useState(1);
    const [rngMax, setRngMax] = useState(100);
    const [rngColor, setRngColor] = useState('#00ff00');
    const rngUrl = `${baseUrl}/streamer/view/rng?min=${rngMin}&max=${rngMax}&color=${encodeURIComponent(rngColor)}`;

    // 5. Roulette
    const [rouletteItems, setRouletteItems] = useState("A賞\nB賞\nC賞\nハズレ");
    const rouletteUrl = `${baseUrl}/streamer/view/roulette?items=${encodeURIComponent(rouletteItems.replace(/\n/g, ','))}`;

    // 6. Ticker
    const [tickerText, setTickerText] = useState("お知らせ: 毎週土曜日は参加型配信の日です！");
    const [tickerColor, setTickerColor] = useState('#ffffff');
    const [tickerSpeed, setTickerSpeed] = useState(15);
    const tickerUrl = `${baseUrl}/streamer/view/ticker?text=${encodeURIComponent(tickerText)}&color=${encodeURIComponent(tickerColor)}&speed=${tickerSpeed}`;

    // 7. Banner
    const [bannerText, setBannerText] = useState("初見さん歓迎！");
    const [bannerColor, setBannerColor] = useState('#ffffff');
    const [bannerBorder, setBannerBorder] = useState(true);
    const bannerUrl = `${baseUrl}/streamer/view/text?text=${encodeURIComponent(bannerText)}&color=${encodeURIComponent(bannerColor)}&border=${bannerBorder}`;

    // 8. Timer
    const [timerMin, setTimerMin] = useState(5);
    const [timerEndMsg, setTimerEndMsg] = useState("配信開始！");
    const [timerColor, setTimerColor] = useState('#ffffff');
    const timerUrl = `${baseUrl}/streamer/view/timer?min=${timerMin}&end=${encodeURIComponent(timerEndMsg)}&color=${encodeURIComponent(timerColor)}`;

    // 9. Stopwatch
    const [stopwatchColor, setStopwatchColor] = useState('#ffffff');
    const stopwatchUrl = `${baseUrl}/streamer/view/stopwatch?color=${encodeURIComponent(stopwatchColor)}`;

    // 10. Slideshow
    const [slideUrls, setSlideUrls] = useState("https://placehold.co/600x400/000/fff?text=Image1\nhttps://placehold.co/600x400/222/fff?text=Image2");
    const [slideInterval, setSlideInterval] = useState(5);
    const slideshowUrl = `${baseUrl}/streamer/view/slideshow?urls=${encodeURIComponent(slideUrls.replace(/\n/g, ','))}&interval=${slideInterval}`;

    // 11. Bingo
    const [bingoTitle, setBingoTitle] = useState("MISSION BINGO");
    const [bingoItems, setBingoItems] = useState("ノーデス\nハンドガン縛り\n回復禁止\n10キル\n3連勝");
    const [bingoColor, setBingoColor] = useState('#00ff00');
    const bingoUrl = `${baseUrl}/streamer/view/bingo?title=${encodeURIComponent(bingoTitle)}&items=${encodeURIComponent(bingoItems.replace(/\n/g, ','))}&color=${encodeURIComponent(bingoColor)}`;

    // 12. Confetti
    const [confettiCount, setConfettiCount] = useState(100);
    const confettiUrl = `${baseUrl}/streamer/view/confetti?count=${confettiCount}`;

    // 13. Chart
    const [chartTitle, setChartTitle] = useState("Which Game Next?");
    const [chartLabels, setChartLabels] = useState("Apex,Valorant,Minecraft");
    const [chartData, setChartData] = useState("50,30,20");
    const [chartColor, setChartColor] = useState('#00ff00');
    const chartUrl = `${baseUrl}/streamer/view/chart?title=${encodeURIComponent(chartTitle)}&labels=${encodeURIComponent(chartLabels)}&data=${encodeURIComponent(chartData)}&color=${encodeURIComponent(chartColor)}`;


    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Streamer Tools</h2>
                <p className="text-gray-500">OBS / Twitch / YouTube Overlay Tools</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Previous Tools */}
                <Section title="Digital Clock" icon={Clock} url={clockUrl}>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-500">Color</label><input type="color" value={clockColor} onChange={e => setClockColor(e.target.value)} className="w-full h-10 bg-gray-800 rounded cursor-pointer" /></div>
                        <div><label className="text-xs text-gray-500">Background</label><select value={clockBg} onChange={e => setClockBg(e.target.value)} className="w-full h-10 bg-gray-800 text-white rounded px-2"><option value="transparent">Transparent</option><option value="#000000">Black</option><option value="#00ff00">GB</option></select></div>
                    </div>
                    <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={showSeconds} onChange={e => setShowSeconds(e.target.checked)} /> Show Seconds</label>
                </Section>

                <Section title="Win/Loss Counter" icon={Hash} url={counterUrl}>
                    <div><label className="text-xs text-gray-500">Color</label><input type="color" value={counterColor} onChange={e => setCounterColor(e.target.value)} className="w-full h-10 bg-gray-800 rounded cursor-pointer" /></div>
                </Section>

                <Section title="Dice Roll" icon={Dices} url={diceUrl}>
                    <div className="grid grid-cols-3 gap-2">
                        <div><label className="text-xs text-gray-500">Body</label><input type="color" value={diceColor} onChange={e => setDiceColor(e.target.value)} className="w-full h-10 bg-gray-800 rounded" /></div>
                        <div><label className="text-xs text-gray-500">Dots</label><input type="color" value={diceDot} onChange={e => setDiceDot(e.target.value)} className="w-full h-10 bg-gray-800 rounded" /></div>
                        <div><label className="text-xs text-gray-500">Count</label><select value={diceCount} onChange={e => setDiceCount(Number(e.target.value))} className="w-full h-10 bg-gray-800 text-white"><option>1</option><option>2</option><option>3</option></select></div>
                    </div>
                </Section>

                <Section title="Random Number (RNG)" icon={Shuffle} url={rngUrl}>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-500">Color</label><input type="color" value={rngColor} onChange={e => setRngColor(e.target.value)} className="w-full h-10 bg-gray-800 rounded" /></div>
                        <div className="flex items-center gap-1"><input type="number" value={rngMin} onChange={e => setRngMin(Number(e.target.value))} className="w-full bg-gray-900 text-white rounded p-1" /><span className="text-white">-</span><input type="number" value={rngMax} onChange={e => setRngMax(Number(e.target.value))} className="w-full bg-gray-900 text-white rounded p-1" /></div>
                    </div>
                </Section>

                <Section title="Roulette Wheel" icon={PieChart} url={rouletteUrl}>
                    <div><label className="text-xs text-gray-500">Items (Line separated)</label><textarea value={rouletteItems} onChange={e => setRouletteItems(e.target.value)} className="w-full h-24 bg-gray-900 text-white border border-gray-600 rounded p-2 text-xs font-mono" /></div>
                </Section>

                <Section title="Scrolling Ticker" icon={ScrollText} url={tickerUrl}>
                    <div><label className="text-xs text-gray-500">Text</label><input type="text" value={tickerText} onChange={e => setTickerText(e.target.value)} className="w-full bg-gray-900 text-white rounded p-2" /></div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div><label className="text-xs text-gray-500">Color</label><input type="color" value={tickerColor} onChange={e => setTickerColor(e.target.value)} className="w-full h-10 bg-gray-800 rounded" /></div>
                        <div><label className="text-xs text-gray-500">Speed (Sec)</label><input type="number" value={tickerSpeed} onChange={e => setTickerSpeed(Number(e.target.value))} className="w-full bg-gray-900 text-white rounded p-2" /></div>
                    </div>
                </Section>

                <Section title="Fixed Banner" icon={Type} url={bannerUrl}>
                    <div><label className="text-xs text-gray-500">Text</label><input type="text" value={bannerText} onChange={e => setBannerText(e.target.value)} className="w-full bg-gray-900 text-white rounded p-2" /></div>
                    <div className="flex items-center gap-4 mt-2">
                        <input type="color" value={bannerColor} onChange={e => setBannerColor(e.target.value)} className="w-10 h-10 bg-gray-800 rounded" />
                        <label className="text-white text-sm"><input type="checkbox" checked={bannerBorder} onChange={e => setBannerBorder(e.target.checked)} /> Border</label>
                    </div>
                </Section>

                <Section title="Countdown / BRB" icon={Hourglass} url={timerUrl}>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-500">Min</label><input type="number" value={timerMin} onChange={e => setTimerMin(Number(e.target.value))} className="w-full bg-gray-900 text-white rounded p-2" /></div>
                        <div><label className="text-xs text-gray-500">Color</label><input type="color" value={timerColor} onChange={e => setTimerColor(e.target.value)} className="w-full h-10 bg-gray-800 rounded" /></div>
                    </div>
                    <div className="mt-2"><label className="text-xs text-gray-500">End Msg</label><input type="text" value={timerEndMsg} onChange={e => setTimerEndMsg(e.target.value)} className="w-full bg-gray-900 text-white rounded p-2" /></div>
                </Section>

                <Section title="Stopwatch" icon={Timer} url={stopwatchUrl}>
                    <div><label className="text-xs text-gray-500">Color</label><input type="color" value={stopwatchColor} onChange={e => setStopwatchColor(e.target.value)} className="w-full h-10 bg-gray-800 rounded" /></div>
                </Section>

                <Section title="Slideshow" icon={Image} url={slideshowUrl}>
                    <div><label className="text-xs text-gray-500">Image URLs</label><textarea value={slideUrls} onChange={e => setSlideUrls(e.target.value)} className="w-full h-24 bg-gray-900 text-white border border-gray-600 rounded p-2 text-xs font-mono" /></div>
                    <div className="mt-2"><label className="text-xs text-gray-500">Interval (Sec)</label><input type="number" value={slideInterval} onChange={e => setSlideInterval(Number(e.target.value))} className="w-full bg-gray-900 text-white rounded p-2" /></div>
                </Section>

                <Section title="Bingo Card" icon={Grid3X3} url={bingoUrl}>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-500">Title</label><input type="text" value={bingoTitle} onChange={e => setBingoTitle(e.target.value)} className="w-full bg-gray-900 text-white rounded p-2" /></div>
                        <div><label className="text-xs text-gray-500">Color</label><input type="color" value={bingoColor} onChange={e => setBingoColor(e.target.value)} className="w-full h-10 bg-gray-800 rounded" /></div>
                    </div>
                    <div className="mt-2"><label className="text-xs text-gray-500">Items</label><textarea value={bingoItems} onChange={e => setBingoItems(e.target.value)} className="w-full h-24 bg-gray-900 text-white border border-gray-600 rounded p-2 text-xs" /></div>
                </Section>

                {/* New Tools */}
                <Section title="Confetti Effect" icon={PartyPopper} url={confettiUrl}>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-500">Count</label><input type="number" value={confettiCount} onChange={e => setConfettiCount(Number(e.target.value))} className="w-full bg-gray-900 text-white rounded p-2" /></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Overlay this URL on top of your stream to show confetti.</p>
                </Section>

                <Section title="Vote/Poll Chart" icon={BarChart3} url={chartUrl}>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-500">Title</label><input type="text" value={chartTitle} onChange={e => setChartTitle(e.target.value)} className="w-full bg-gray-900 text-white rounded p-2" /></div>
                        <div><label className="text-xs text-gray-500">Bar Color</label><input type="color" value={chartColor} onChange={e => setChartColor(e.target.value)} className="w-full h-10 bg-gray-800 rounded cursor-pointer" /></div>
                    </div>
                    <div className="mt-2"><label className="text-xs text-gray-500">Labels (Comma separated)</label><input type="text" value={chartLabels} onChange={e => setChartLabels(e.target.value)} className="w-full bg-gray-900 text-white rounded p-2" /></div>
                    <div className="mt-2"><label className="text-xs text-gray-500">Values (Comma separated)</label><input type="text" value={chartData} onChange={e => setChartData(e.target.value)} className="w-full bg-gray-900 text-white rounded p-2" /></div>
                </Section>

            </div>
        </div>
    );
}
