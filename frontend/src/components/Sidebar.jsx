import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const { pathname } = useLocation();

  const navItems = [
    { path: "/", label: "Playground", icon: "⚡" },
    { path: "/collections", label: "Stock Collections", icon: "📊" },
    { path: "/patterns", label: "Algo Patterns", icon: "🔍" },
  ];

  return (
    <aside className="w-64 bg-white h-screen border-r border-gray-200 p-6 fixed">
      <h2 className="text-2xl font-bold text-red-600 mb-8">AlgoTrade</h2>
      <ul className="space-y-4">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`flex items-center gap-3 py-2 px-3 rounded-md ${
                pathname === item.path
                  ? "bg-red-100 text-red-600 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
