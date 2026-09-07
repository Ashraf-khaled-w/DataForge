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

  const from = location.state?.from?.pathname || "/workspaces";

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
        navigate("/workspaces", { replace: true });
      }
    } catch (err) {
      setError("Failed to create guest account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex-1 flex flex-col justify-center py-16 px-6 lg:px-8 bg-white text-black font-serif-body pattern-grid">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white font-serif-display font-black text-2xl border-2 border-black mb-2">
          D
        </div>
        <h1 className="font-serif-display font-black text-4xl md:text-5xl tracking-tight uppercase text-black">
          {isLoginTab ? "AUTHENTICATE" : "REGISTER"}
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-600 font-bold">
          DATAFORGE SECURITY PORTAL
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="border-4 border-black bg-white p-8 md:p-10 space-y-8">
          
          {/* Stark Tab Selectors */}
          <div className="grid grid-cols-2 gap-2 border-2 border-black p-1 bg-white">
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setError(""); }}
              className={`py-3 font-mono text-xs uppercase tracking-widest transition-none border ${
                isLoginTab
                  ? "bg-black text-white border-black font-bold"
                  : "bg-white text-black border-transparent hover:border-black font-bold"
              }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setError(""); }}
              className={`py-3 font-mono text-xs uppercase tracking-widest transition-none border ${
                !isLoginTab
                  ? "bg-black text-white border-black font-bold"
                  : "bg-white text-black border-transparent hover:border-black font-bold"
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          {error && (
            <div className="border-2 border-black bg-black text-white p-4 font-mono text-xs space-y-1">
              <span className="font-bold block">[ERR_AUTH_FAILED]</span>
              <p className="text-neutral-300">{error}</p>
            </div>
          )}

          {isLoginTab ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full px-3 py-3 border-b-2 border-black focus:border-b-4 focus:outline-none bg-white text-black font-serif-body text-base placeholder:italic placeholder:text-neutral-400"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                  PASSWORD *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-3 border-b-2 border-black focus:border-b-4 focus:outline-none bg-white text-black font-serif-body text-base placeholder:italic placeholder:text-neutral-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-widest py-4 border-2 border-black font-bold transition-none cursor-pointer disabled:opacity-50"
              >
                {loading ? "PROCESSING..." : "SIGN IN →"}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. John Doe"
                  className="w-full px-3 py-3 border-b-2 border-black focus:border-b-4 focus:outline-none bg-white text-black font-serif-body text-base placeholder:italic placeholder:text-neutral-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3 py-3 border-b-2 border-black focus:border-b-4 focus:outline-none bg-white text-black font-serif-body text-base placeholder:italic placeholder:text-neutral-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                    PASSWORD *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3 py-3 border-b-2 border-black focus:border-b-4 focus:outline-none bg-white text-black font-serif-body text-base placeholder:italic placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                    ROLE IN SYSTEM
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-3 border-2 border-black bg-white text-black font-mono text-xs uppercase tracking-widest focus:outline-none cursor-pointer"
                  >
                    <option value="user">User (Standard)</option>
                    <option value="team_leader">Team Leader</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                    MANAGER ID (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    placeholder="Leader UUID"
                    className="w-full px-3 py-3 border-b-2 border-black focus:border-b-4 focus:outline-none bg-white text-black font-mono text-xs"
                  />
                </div>
              </div>

              {/* Plan Picker */}
              <div className="space-y-2 pt-2">
                <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                  SUBSCRIPTION PLAN
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlanName("free")}
                    className={`p-3 font-mono text-xs uppercase tracking-widest border-2 transition-none flex flex-col items-center ${
                      planName === "free"
                        ? "bg-black text-white border-black font-bold"
                        : "bg-white text-black border-black hover:bg-neutral-100"
                    }`}
                  >
                    <span>FREE</span>
                    <span className="text-[9px] opacity-75 mt-1">2 Workspaces</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanName("pro")}
                    className={`p-3 font-mono text-xs uppercase tracking-widest border-2 transition-none flex flex-col items-center ${
                      planName === "pro"
                        ? "bg-black text-white border-black font-bold"
                        : "bg-white text-black border-black hover:bg-neutral-100"
                    }`}
                  >
                    <span>PRO TRIAL</span>
                    <span className="text-[9px] opacity-75 mt-1">1-Day Trial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanName("team")}
                    className={`p-3 font-mono text-xs uppercase tracking-widest border-2 transition-none flex flex-col items-center ${
                      planName === "team"
                        ? "bg-black text-white border-black font-bold"
                        : "bg-white text-black border-black hover:bg-neutral-100"
                    }`}
                  >
                    <span>TEAM TRIAL</span>
                    <span className="text-[9px] opacity-75 mt-1">1-Day Trial</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-widest py-4 border-2 border-black font-bold transition-none cursor-pointer disabled:opacity-50"
              >
                {loading ? "REGISTERING..." : "REGISTER ACCOUNT →"}
              </button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-black"></div>
            </div>
            <div className="relative flex justify-center font-mono text-[10px] uppercase tracking-widest">
              <span className="bg-white px-4 text-neutral-600 font-bold">
                OR EXPLORE WITHOUT REGISTRATION
              </span>
            </div>
          </div>

          <button
            onClick={handleGuestAccess}
            disabled={loading}
            className="w-full border-2 border-black bg-white hover:bg-black text-black hover:text-white font-mono text-xs uppercase tracking-widest py-3.5 font-bold transition-none cursor-pointer"
          >
            INSTANT GUEST DEMO ACCESS →
          </button>

        </div>
      </div>
    </div>
  );
}
