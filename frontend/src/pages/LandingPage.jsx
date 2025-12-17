import React from "react";

function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-8">
      <div className="text-center border-4 border-black p-8 bg-white" style={{ boxShadow: '4px 4px 0px #000' }}>
        <h1 className="text-6xl md:text-8xl font-bold mb-6 text-black" style={{ 
          fontFamily: 'MS Sans Serif, Tahoma, Arial, sans-serif',
          textShadow: '2px 2px 0px #000'
        }}>
          Cash F.K
        </h1>
        <p className="text-xl md:text-2xl font-bold text-black" style={{ 
          fontFamily: 'MS Sans Serif, Tahoma, Arial, sans-serif'
        }}>
          cash 'em all
        </p>
      </div>
    </div>
  );
}

export default LandingPage;

