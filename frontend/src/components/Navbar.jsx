import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-red-600">AlgoTrade</h1>
      <ul className="flex gap-6 text-gray-700">
        <li><Link to="/" className="hover:text-red-600">Dashboard</Link></li>
        <li><Link to="/strategies" className="hover:text-red-600">Strategies</Link></li>
        <li><Link to="/settings" className="hover:text-red-600">Settings</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
