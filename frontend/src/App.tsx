import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import UniversalConverter from './components/Tools/UniversalConverter';
import DocumentStudio from './components/Tools/Document/DocumentStudio'; // 追加
import VideoTools from './components/Tools/Video/VideoTools';
import AudioEditor from './components/Tools/Audio/AudioLab';
import FileTools from './components/Tools/File/FileTools';
import TextTools from './components/Tools/Text/TextTools';
import TimeTools from './components/Tools/Time/TimeTools';
import CalculatorTools from './components/Tools/Calculator/CalculatorTools';
import ImageEditor from './components/Tools/ImageEditor/ImageEditor';
import ToolSectionPage from './components/Tools/Developer/ToolSectionPage';
import { toolCards } from './components/Tools/Developer/toolConfig';
import SystemInfo from './components/Tools/SystemInfo/SystemInfo';
import Privacy from './components/Pages/Privacy';
import Feedback from './components/Pages/Feedback';
import GlobalSettings from './components/Pages/GlobalSettings';

// Streamer Tools
// Streamer Tools (removed)

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<UniversalConverter />} />
              <Route path="/doc" element={<DocumentStudio />} />
              <Route path="/video" element={<VideoTools />} />
              <Route path="/audioeditor" element={<AudioEditor />} />
              <Route path="/audio" element={<Navigate to="/audioeditor" replace />} />
              <Route path="/file" element={<FileTools />} />
              <Route path="/text" element={<TextTools />} />
              <Route path="/time" element={<TimeTools />} />
              <Route path="/calc" element={<CalculatorTools />} />
              <Route path="/editor" element={<ImageEditor />} />
              <Route path="/generators/*" element={<ToolSectionPage tool={toolCards.generators} basePath="/generators" />} />
              <Route path="/analyzers/*" element={<ToolSectionPage tool={toolCards.analyzers} basePath="/analyzers" />} />
              <Route path="/web-tools/*" element={<ToolSectionPage tool={toolCards['web-tools']} basePath="/web-tools" />} />
              <Route path="/network-tools/*" element={<ToolSectionPage tool={toolCards['network-tools']} basePath="/network-tools" />} />
              <Route path="/dev/*" element={<Navigate to="/generators" replace />} />
              {/* Streamer route removed */}
              <Route path="/sys" element={<SystemInfo />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/settings" element={<GlobalSettings />} />
            </Routes>
          </Layout>
        } />

        {/* Streamer OBS views removed */}
      </Routes>
    </Router>
  );
}

export default App;
