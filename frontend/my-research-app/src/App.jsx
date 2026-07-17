import { createBrowserRouter, RouterProvider, Navigate, useLocation } from "react-router-dom";
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
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;