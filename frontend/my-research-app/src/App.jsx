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
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono">
        <div className="flex flex-col items-center gap-4 p-8 border border-white/20 bg-black">
          <div className="w-8 h-8 border-2 border-white border-t-transparent animate-spin"></div>
          <span className="text-xs uppercase tracking-widest text-neutral-400">
            AUTHENTICATING SESSION...
          </span>
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
        element: <Navigate to="/workspaces" replace />,
      },
      {
        path: "/study/:studyId/patients",
        element: <Navigate to="/workspace/:studyId/records" replace />,
      },
    ],
  },
]);

function App() {
  const [serverState, setServerState] = useState("checking"); // 'checking' | 'sleeping' | 'alive'
  const [retryCount, setRetryCount] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const COMEDY_QUOTES = [
    "Spinning up the free tier hamsters... 🐹",
    "Waking up the server from a deep 15-minute nap... 😴",
    "Brewing a cup of coffee for the database... ☕",
    "Patience is a virtue, especially when hosting is free! 💸",
    "Render is searching for the power plug... 🔌",
    "Counting the seconds since we decided not to pay... ⏳",
    "The server is doing its morning stretches... 🧘",
    "Loading premium lines of code on a budget tier... 🚀",
    "Please hold, the hamsters are putting on their running shoes... 👟",
    "Almost there! Just negotiating with the cloud routers... ☁️",
  ];

  // Rotate quotes every 4 seconds when server is sleeping
  useEffect(() => {
    let quoteInterval;
    if (serverState === "sleeping") {
      quoteInterval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % COMEDY_QUOTES.length);
      }, 4000);
    }
    return () => clearInterval(quoteInterval);
  }, [serverState]);

  useEffect(() => {
    let active = true;

    // If the server takes longer than 1.5s to respond, show the wakeup dialog
    const sleepTimeout = setTimeout(() => {
      if (active) {
        setServerState("sleeping");
      }
    }, 1500);

    const checkServer = async () => {
      try {
        await axios.get(
          import.meta.env.VITE_API_URL || "http://localhost:3000",
          {
            timeout: 45000,
          },
        );
        clearTimeout(sleepTimeout);
        if (active) {
          setServerState("alive");
        }
      } catch {
        clearTimeout(sleepTimeout);
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
      clearTimeout(sleepTimeout);
    };
  }, []);

  if (serverState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono">
        <div className="flex flex-col items-center gap-4 p-8 border border-white/20 bg-black">
          <div className="w-8 h-8 border-2 border-white border-t-transparent animate-spin"></div>
          <span className="text-xs uppercase tracking-widest text-neutral-400">
            CONNECTING TO SERVICES...
          </span>
        </div>
      </div>
    );
  }

  if (serverState === "sleeping") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-4 font-mono">
        <div className="max-w-md w-full text-center space-y-6 p-8 border-2 border-white bg-black">
          <div className="w-16 h-16 mx-auto flex items-center justify-center border-2 border-white text-white">
            <svg
              className="w-8 h-8 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-serif font-bold text-white tracking-tight uppercase">
              WAKING UP INSTANCE
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We host our backend demo on a free cloud tier. The server spins down when idle,
              and is now booting up automatically.
            </p>
          </div>

          {/* Comedy Quotes Box */}
          <div className="border border-white/20 bg-neutral-950 p-4 min-h-14 flex items-center justify-center">
            <p className="text-xs text-white font-medium italic transition-all duration-500">
              {COMEDY_QUOTES[quoteIndex]}
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <div className="w-full h-2 bg-neutral-900 border border-white/20">
              <div
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${Math.min(retryCount * 8 + 5, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              <span>INITIALIZING...</span>
              <span>ATTEMPT #{retryCount || 1}</span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-500 italic">
            This typically takes 30–45 seconds. The app will open automatically once active.
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
