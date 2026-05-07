import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import Home from "@/pages/Home";
import Game from "@/pages/Game";

function App() {
  return (
    <Router>
      {/* Added antialiased and tracking-tight here for the Framer look */}
      <main className="min-h-screen bg-[#050505] text-white w-full dark selection:bg-purple-500/30 antialiased tracking-tight">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;