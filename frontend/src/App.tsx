import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import UniversalConverter from './components/Tools/UniversalConverter';
import Privacy from './components/Pages/Privacy';
import Feedback from './components/Pages/Feedback';
import SystemInfo from './components/Tools/SystemInfo/SystemInfo';
import TimeTools from './components/Tools/Time/TimeTools';
import CalculatorTools from './components/Tools/Calculator/CalculatorTools'; // 追加
import StreamerDashboard from './components/Tools/Streamer/StreamerDashboard';
import ObsClock from './components/Tools/Streamer/Views/ObsClock';
import ObsCounter from './components/Tools/Streamer/Views/ObsCounter';
import ObsDice from './components/Tools/Streamer/Views/ObsDice';
import ObsRng from './components/Tools/Streamer/Views/ObsRng';
import ObsRoulette from './components/Tools/Streamer/Views/ObsRoulette';
import ObsTicker from './components/Tools/Streamer/Views/ObsTicker';
import ObsText from './components/Tools/Streamer/Views/ObsText';
import ObsTimer from './components/Tools/Streamer/Views/ObsTimer';
import ObsStopwatch from './components/Tools/Streamer/Views/ObsStopwatch';
import ObsSlideshow from './components/Tools/Streamer/Views/ObsSlideshow';
import ObsBingo from './components/Tools/Streamer/Views/ObsBingo';

function App() {
  return (
    <Router>
      <Routes>
        {/* --- 1. 通常のアプリ画面（サイドバーあり） --- */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<UniversalConverter />} />
              <Route path="/time" element={<TimeTools />} />
              <Route path="/calc" element={<CalculatorTools />} />
              <Route path="/streamer" element={<StreamerDashboard />} /> {/* 設定画面 */}
              <Route path="/streamer/view/clock" element={<ObsClock />} />
              <Route path="/streamer/view/counter" element={<ObsCounter />} />
              <Route path="/streamer/view/dice" element={<ObsDice />} />
              <Route path="/streamer/view/rng" element={<ObsRng />} />
              <Route path="/streamer/view/roulette" element={<ObsRoulette />} />
              <Route path="/streamer/view/ticker" element={<ObsTicker />} />
              <Route path="/streamer/view/text" element={<ObsText />} />
              <Route path="/streamer/view/timer" element={<ObsTimer />} />
              <Route path="/streamer/view/stopwatch" element={<ObsStopwatch />} />
              <Route path="/streamer/view/slideshow" element={<ObsSlideshow />} />
              <Route path="/streamer/view/bingo" element={<ObsBingo />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/feedback" element={<Feedback />} />
            </Routes>
          </Layout>
        } />

        {/* --- 2. OBS配信専用画面（サイドバーなし・背景透明） --- */}
        {/* URLパラメータで設定を受け取る設計にします */}
        <Route path="/streamer/view/clock" element={<ObsClock />} />
        <Route path="/streamer/view/counter" element={<ObsCounter />} />
      </Routes>
    </Router>
  );
}

export default App;