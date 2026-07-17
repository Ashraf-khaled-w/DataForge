import { useState, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import Layout from "./Components/UI/layout/Layout";
import Home from "./Components/Pages/Home";
import Workspaces from "./Components/Pages/Workspaces";
import Dashboard from "./Components/Pages/Dashboard";
import RecordsTable from "./Components/Pages/RecordsTable";
import Auth from "./Components/Pages/Auth";
import About from "./Components/Pages/About";
import Support from "./Components/Pages/Support";
import { AuthProvider, useAuth } from "./Components/Context/AuthContext";

// Protective route wrapper for authentication checks
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          <span className="text-xs font-semibold text-slate-400">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/support",
        element: <Support />,
      },
      {
        path: "/auth",
        element: <Auth />,
      },
      {
        path: "/workspaces",
        element: (
          <ProtectedRoute>
            <Workspaces />
          </ProtectedRoute>
        ),
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/workspace/:workspaceId/records",
        element: (
          <ProtectedRoute>
            <RecordsTable />
          </ProtectedRoute>
        ),
      },
      // Redirect legacy paths to new routing structure
      {
        path: "/studies",
        element: <Navigate to="/workspaces" replace />
      },
      {
        path: "/study/:studyId/patients",
        element: <Navigate to="/workspace/:studyId/records" replace />
      }
    ],
  },
]);

function App() {
  const [serverState, setServerState] = useState("checking"); // 'checking' | 'sleeping' | 'alive'
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    const checkServer = async () => {
      try {
        const response = await axios.get(import.meta.env.VITE_API_URL || "http://localhost:3000");
        if (active) {
          setServerState("alive");
        }
      } catch (err) {
        if (active) {
          setServerState("sleeping");
          setTimeout(checkServer, 3000);
          setRetryCount((prev) => prev + 1);
        }
      }
    };
    checkServer();
    return () => {
      active = false;
    };
  }, []);

  if (serverState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          <span className="text-xs font-semibold text-slate-400">Connecting to services...</span>
        </div>
      </div>
    );
  }

  if (serverState === "sleeping") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-2xl">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400">
            <svg className="w-10 h-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 border-t-transparent animate-spin"></div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Waking Up Server</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We host our backend demo on a free cloud tier. The server spins down when idle, and is now booting up automatically.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: `${Math.min(retryCount * 8, 100)}%` }}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Waking up instance...</span>
              <span>Attempt #{retryCount}</span>
            </div>
          </div>
          
          <p className="text-[11px] text-slate-500 italic">
            This typically takes 30–40 seconds. The page will load automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;