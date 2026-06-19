import {
  Bot,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackagePlus,
  Search,
  Sun,
  User,
  Users,
  X
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/medicines", label: "Inventory", icon: ClipboardList },
  { to: "/admin/medicines/new", label: "Add Medicine", icon: PackagePlus },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/classifications", label: "AI Logs", icon: FileText },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/profile", label: "Profile", icon: User }
];

const customerLinks = [
  { to: "/app", label: "Home", icon: LayoutDashboard },
  { to: "/medicines", label: "Search", icon: Search },
  { to: "/assistant", label: "AI Chat", icon: Bot },
  { to: "/profile", label: "Profile", icon: User }
];

const AppShell = () => {
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const links = isAdmin ? adminLinks : customerLinks;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <div>
            <p className="text-lg font-bold text-primary-600 dark:text-primary-100">MediAlert AI</p>
            <p className="text-xs uppercase tracking-wide text-medical-600 dark:text-medical-500">{user?.role}</p>
          </div>
          <button className="btn btn-secondary p-2 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="space-y-1 p-4">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin" || to === "/app"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-100"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back</p>
              <h1 className="text-base font-semibold sm:text-lg">{user?.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary p-2"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="btn btn-secondary p-2 sm:px-4" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
