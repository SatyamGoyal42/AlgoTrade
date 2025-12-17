import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const { pathname } = useLocation();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/fundamentals", label: "Fundamentals" },
    { path: "/collections", label: "Stock Collections"},
    { path: "/strategies", label: "Strategies" },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-gray-300 h-screen border-r-2 border-black p-4 fixed" style={{ borderRight: '2px solid #000' }}>
      <h2 className="text-xl font-bold mb-6 text-black">Cash F.K</h2>
      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`flex items-center gap-2 py-1 px-2 text-sm ${
                isActive(item.path)
                  ? "bg-gray-400 text-black font-bold"
                  : "text-black hover:bg-gray-400"
              }`}
              style={{
                border: isActive(item.path) ? '1px inset #808080' : '1px solid transparent',
                boxShadow: isActive(item.path) ? 'inset 1px 1px 0px #000' : 'none'
              }}
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
