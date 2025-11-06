import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Playground from "./pages/Playground";
import StockCollections from "./pages/StockCollections";
import AlgoPatterns from "./pages/AlgoPatterns";

function App() {
  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Routes>
          <Route path="/" element={<Playground />} />
          <Route path="/collections" element={<StockCollections />} />
          <Route path="/patterns" element={<AlgoPatterns />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
