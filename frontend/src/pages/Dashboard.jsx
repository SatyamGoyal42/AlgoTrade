import React, { useEffect, useState } from "react";
import api from "../api/axios";

const cards = [
  { title: "Algo v20", desc: "Detected 12 buy opportunities this week" },
  { title: "Algo v20 Extra", desc: "5 new signals generated" },
  { title: "SMA200 Strategy", desc: "8 stocks below SMA200 threshold" },
];

export default function Dashboard() {
  const [message, setMessage] = useState("Checking backend...");

  useEffect(() => {
    api
      .get("/test")
      .then((res) => setMessage("✅ " + res.data.message))
      .catch((err) => {
        console.error("Backend error:", err);
        setMessage("❌ Failed to connect Backend");
      });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Strategy Cards */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold text-red-600">{card.title}</h3>
            <p className="text-gray-600 mt-2">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Backend Connection Status */}
      <div className="fixed bottom-4 right-6 bg-gray-100 border border-gray-200 text-sm text-gray-700 px-3 py-1.5 rounded-lg shadow-sm">
        {message}
      </div>

    </div>
  );
}
