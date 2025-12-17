import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import LandingPage from "./pages/LandingPage";
import StockCollections from "./pages/StockCollections";
import StrategiesList from "./pages/StrategiesList";
import StrategyRun from "./pages/StrategyRun";
import StrategyBacktest from "./pages/StrategyBacktest";
import Fundamentals from "./pages/Fundamentals";

function App() {
  return (
    <div className="flex bg-gray-200 min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/fundamentals" element={<Fundamentals />} />
          <Route path="/collections" element={<StockCollections />} />
          <Route path="/strategies" element={<StrategiesList />} />
          <Route path="/strategies/:strategy/run" element={<StrategyRun />} />
          <Route path="/strategies/:strategy/backtest" element={<StrategyBacktest />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
