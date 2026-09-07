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

  // Minimalist Monochrome Badge Helper
  const getTrialBadge = () => {
    if (!user?.subscription) return null;
    const { plan_name, current_period_end, status } = user.subscription;

    if (plan_name === "free") {
      return (
        <span className="bg-white text-black text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border border-black font-bold">
          FREE TIER
        </span>
      );
    }

    const diffMs = new Date(current_period_end) - new Date();
    const isTrial = diffMs < 30 * 24 * 60 * 60 * 1000;

    if (diffMs <= 0 || status === "expired") {
      return (
        <span className="bg-black text-white text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border border-black font-bold">
          EXPIRED TRIAL
        </span>
      );
    }

    const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
    const hoursText = hoursLeft > 24 ? `${Math.ceil(hoursLeft / 24)}d left` : `${hoursLeft}h left`;

    return (
      <span className="bg-white text-black text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border-2 border-black font-bold flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-black"></span>
        <span className="capitalize">{plan_name}</span> {isTrial ? `(${hoursText})` : ""}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        
        {/* Editorial Monochrome Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-black border border-black flex items-center justify-center text-white font-serif-display font-black text-lg transition-transform duration-100 group-hover:bg-white group-hover:text-black">
            D
          </div>
          <div className="flex flex-col">
            <span className="font-serif-display font-bold text-black text-xl tracking-tight leading-none group-hover:underline">
              DATAFORGE
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 leading-none mt-1">
              DATA PLATFORM
            </span>
          </div>
        </Link>
        
        {/* Editorial Navigation Links */}
        <nav className="flex items-center gap-1 md:gap-2">
          <Link
            to="/"
            className={`text-xs font-mono uppercase tracking-widest px-3.5 py-2 transition-none border ${
              isActive("/")
                ? "bg-black text-white border-black font-bold"
                : "text-black border-transparent hover:border-black"
            }`}
          >
            HOME
          </Link>

          {user && (
            <>
              <Link
                to="/workspaces"
                className={`text-xs font-mono uppercase tracking-widest px-3.5 py-2 transition-none border ${
                  isWorkspacesActive
                    ? "bg-black text-white border-black font-bold"
                    : "text-black border-transparent hover:border-black"
                }`}
              >
                WORKSPACES
              </Link>
              
              <Link
                to="/dashboard"
                className={`text-xs font-mono uppercase tracking-widest px-3.5 py-2 transition-none border ${
                  isActive("/dashboard")
                    ? "bg-black text-white border-black font-bold"
                    : "text-black border-transparent hover:border-black"
                }`}
              >
                ANALYTICS
              </Link>
            </>
          )}

          <Link
            to="/about"
            className={`text-xs font-mono uppercase tracking-widest px-3.5 py-2 transition-none border ${
              isActive("/about")
                ? "bg-black text-white border-black font-bold"
                : "text-black border-transparent hover:border-black"
            }`}
          >
            ABOUT
          </Link>

          <Link
            to="/support"
            className={`text-xs font-mono uppercase tracking-widest px-3.5 py-2 transition-none border ${
              isActive("/support")
                ? "bg-black text-white border-black font-bold"
                : "text-black border-transparent hover:border-black"
            }`}
          >
            SUPPORT
          </Link>
        </nav>
        
        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {getTrialBadge()}
              
              <span className="hidden md:inline text-xs font-mono uppercase font-bold text-black border-b border-black">
                {user.full_name || "USER"}
              </span>

              <button
                onClick={handleLogoutClick}
                className="text-xs font-mono uppercase tracking-widest text-black hover:bg-black hover:text-white px-4 py-2 border border-black transition-none cursor-pointer"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/auth"
                className="text-xs font-mono uppercase tracking-widest text-black hover:underline px-3 py-2"
              >
                LOGIN
              </Link>
              
              <button
                onClick={handleGuestClick}
                className="bg-black hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-widest px-4 py-2.5 border border-black transition-none cursor-pointer flex items-center gap-1.5"
              >
                <span>TRY GUEST</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
