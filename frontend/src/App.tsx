// 修正後
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import UniversalConverter from './components/Tools/UniversalConverter';
import Privacy from './components/Pages/Privacy';
import Feedback from './components/Pages/Feedback';
import SystemInfo from './components/Tools/SystemInfo/SystemInfo';
import TimeTools from './components/Tools/Time/TimeTools';
import CalculatorTools from './components/Tools/Calculator/CalculatorTools'; // 追加

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<UniversalConverter />} />
          <Route path="/time" element={<TimeTools />} /> {/* 追加 */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/calc" element={<CalculatorTools />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;