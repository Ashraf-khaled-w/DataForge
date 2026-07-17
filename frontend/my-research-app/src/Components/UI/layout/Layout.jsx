import Header from "../Header";
import Footer from "../Footer";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <Header />
      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
