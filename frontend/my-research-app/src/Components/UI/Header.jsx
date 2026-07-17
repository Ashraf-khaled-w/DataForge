import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, guestLogin } = useAuth();

  const isActive = (path) => location.pathname === path;
  const isWorkspacesActive = location.pathname.startsWith("/workspaces") || location.pathname.startsWith("/workspace");

  const handleLogoutClick = async () => {
    await logout();
    navigate("/");
  };

  const handleGuestClick = async () => {
    try {
      const res = await guestLogin();
      if (res.success) {
        navigate("/workspaces");
      }
    } catch (err) {
      navigate("/auth");
    }
  };

  // Helper to format remaining trial hours
  const getTrialBadge = () => {
    if (!user?.subscription) return null;
    const { plan_name, current_period_end, status } = user.subscription;

    if (plan_name === "free") {
      return (
        <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-700">
          Free Tier
        </span>
      );
    }

    const diffMs = new Date(current_period_end) - new Date();
    const isTrial = diffMs < 30 * 24 * 60 * 60 * 1000;

    if (diffMs <= 0 || status === "expired") {
      return (
        <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2.5 py-1 rounded-md border border-rose-500/20">
          Expired Trial
        </span>
      );
    }

    const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
    const hoursText = hoursLeft > 24 ? `${Math.ceil(hoursLeft / 24)}d left` : `${hoursLeft}h left`;

    return (
      <span className="bg-indigo-500/10 text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-indigo-500/20 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
        <span className="capitalize">{plan_name}</span> {isTrial ? `Trial (${hoursText})` : ""}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-95 transition-opacity">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-550/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
            </svg>
          </div>
          <span className="font-extrabold text-white text-lg tracking-tight">
            Data<span className="text-indigo-400">Forge</span>
          </span>
        </Link>
        
        {/* Navigation Bar Links with premium pill-shape designs */}
        <nav className="flex items-center gap-1.5">
          <Link
            to="/"
            className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200 ${
              isActive("/")
                ? "text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Home
          </Link>

          {user && (
            <>
              <Link
                to="/workspaces"
                className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200 ${
                  isWorkspacesActive
                    ? "text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                Workspaces
              </Link>
              
              <Link
                to="/dashboard"
                className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive("/dashboard")
                    ? "text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                Analytics
              </Link>
            </>
          )}

          <Link
            to="/about"
            className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200 ${
              isActive("/about")
                ? "text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            About
          </Link>

          <Link
            to="/support"
            className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200 ${
              isActive("/support")
                ? "text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Support
          </Link>
        </nav>
        
        {/* Auth / CTA Button */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {getTrialBadge()}
              
              <span className="hidden md:inline text-xs font-bold text-slate-300">
                {user.full_name || "User"}
              </span>

              <button
                onClick={handleLogoutClick}
                className="text-xs font-bold text-slate-350 hover:text-rose-400 hover:bg-rose-500/10 px-3 py-2 rounded-lg border border-slate-800 hover:border-rose-500/20 transition-all cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/auth"
                className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-all"
              >
                Login / Register
              </Link>
              
              <button
                onClick={handleGuestClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-md hover:shadow-indigo-550/20 transition-all cursor-pointer"
              >
                Try as Guest
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
