import UniversalConverter from "./components/Tools/UniversalConverter";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 font-sans">
      {/* ヘッダーは UniversalConverter 内に組み込んだので、
         App側はシンプルにコンテナとして機能させます 
      */}
      <UniversalConverter />
    </div>
  );
}

export default App;