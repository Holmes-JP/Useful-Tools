import VideoConverter from "./components/Tools/VideoConverter";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Useful Tools</h1>
        <p className="text-gray-600 mt-3 text-lg">
          Secure & Serverless: All processing happens in your browser.
        </p>
      </header>

      <main className="container mx-auto">
        <VideoConverter />
      </main>
    </div>
  );
}

export default App;