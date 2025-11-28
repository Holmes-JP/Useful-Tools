// 修正後
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import UniversalConverter from './components/Tools/UniversalConverter';
import Privacy from './components/Pages/Privacy';
import Feedback from './components/Pages/Feedback';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<UniversalConverter />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/feedback" element={<Feedback />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;