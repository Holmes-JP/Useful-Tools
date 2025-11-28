import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import UniversalConverter from './components/Tools/UniversalConverter';
import Privacy from './components/Pages/Privacy';
import GlobalSettings from './components/Pages/GlobalSettings';
import Feedback from './components/Pages/Feedback';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* メインツール (ホーム) */}
          <Route path="/" element={<UniversalConverter />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/settings" element={<GlobalSettings />} />
          <Route path="/feedback" element={<Feedback />} /> {/* 追加 */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;