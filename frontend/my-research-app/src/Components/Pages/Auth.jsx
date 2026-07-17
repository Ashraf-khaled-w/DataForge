import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, guestLogin } = useAuth();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");
  const [managerId, setManagerId] = useState("");
  const [planName, setPlanName] = useState("free");

  const from = location.state?.from?.pathname || "/studies";

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.error?.message || "Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        full_name: fullName,
        email,
        password,
        role,
        plan_name: planName
      };
      if (managerId.trim()) {
        payload.manager_id = managerId.trim();
      }
      const res = await register(payload);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.error?.message || "Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || "Registration failed. Verify your details.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await guestLogin();
      if (res.success) {
        navigate("/studies", { replace: true });
      }
    } catch (err) {
      setError("Failed to create guest account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100-4rem)] flex-1 flex flex-col justify-center py-12 px-6 lg:px-8 bg-slate-900 text-slate-100 font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-550/40">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
            </svg>
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Welcome to DataForge
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Universal research data modeling and collection portal.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg z-10 relative">
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/60 p-8 rounded-2xl shadow-2xl space-y-6">
          
          {/* Tab selectors */}
          <div className="flex border-b border-slate-700/50 pb-1">
            <button
              onClick={() => { setIsLoginTab(true); setError(""); }}
              className={`flex-1 text-center pb-3 text-sm font-semibold transition-all border-b-2 ${
                isLoginTab ? "text-indigo-400 border-indigo-500" : "text-slate-400 border-transparent hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLoginTab(false); setError(""); }}
              className={`flex-1 text-center pb-3 text-sm font-semibold transition-all border-b-2 ${
                !isLoginTab ? "text-indigo-400 border-indigo-500" : "text-slate-400 border-transparent hover:text-slate-200"
              }`}
            >
              Register Account
            </button>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-350 p-4 rounded-xl text-xs flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-rose-450" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {isLoginTab ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-indigo-500/25 transition-all text-sm flex items-center justify-center gap-2 disabled:bg-indigo-500/60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. John Doe"
                    className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider">
                    Role in System
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all cursor-pointer"
                  >
                    <option value="user">User (Standard)</option>
                    <option value="team_leader">Team Leader</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider">
                    Manager ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    placeholder="Leader's UUID if applicable"
                    className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all font-mono"
                  />
                </div>
              </div>

              {/* Plan Selection Picker */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider">
                  Select Subscription Tier
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlanName("free")}
                    className={`flex flex-col items-center p-3 border rounded-xl transition-all ${
                      planName === "free"
                        ? "bg-slate-900 border-indigo-500 text-indigo-400 shadow-md"
                        : "bg-slate-900/25 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase">Free</span>
                    <span className="text-[10px] text-slate-500 mt-1">2 Workspaces</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanName("pro")}
                    className={`flex flex-col items-center p-3 border rounded-xl transition-all ${
                      planName === "pro"
                        ? "bg-slate-900 border-indigo-500 text-indigo-400 shadow-md"
                        : "bg-slate-900/25 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase">Pro Trial</span>
                    <span className="text-[10px] text-slate-500 mt-1">1-Day Trial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanName("team")}
                    className={`flex flex-col items-center p-3 border rounded-xl transition-all ${
                      planName === "team"
                        ? "bg-slate-900 border-indigo-500 text-indigo-400 shadow-md"
                        : "bg-slate-900/25 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase">Team Trial</span>
                    <span className="text-[10px] text-slate-500 mt-1">1-Day Trial</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-indigo-500/25 transition-all text-sm flex items-center justify-center gap-2 disabled:bg-indigo-500/60"
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/60"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-3 py-0.5 rounded text-slate-400 font-semibold tracking-wider">
                Or explore instantly
              </span>
            </div>
          </div>

          {/* Guest Access Button */}
          <button
            onClick={handleGuestAccess}
            disabled={loading}
            className="w-full border border-indigo-500/35 hover:bg-indigo-500/5 hover:border-indigo-500/60 text-indigo-300 font-bold py-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Try as Guest (Instant Access)
          </button>

        </div>
      </div>
    </div>
  );
}
