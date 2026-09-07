import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t-4 border-black py-16 pattern-lines-inverted">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-neutral-800">
          
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white text-black font-serif-display font-black text-lg flex items-center justify-center">
                D
              </div>
              <span className="font-serif-display font-bold text-xl tracking-tight text-white">
                DATAFORGE
              </span>
            </div>
            <p className="text-sm font-serif-body text-neutral-400 max-w-sm leading-relaxed">
              High-performance workspace modeling platform. Dynamic relational JSONB variables, bulk spreadsheet ingestion, and real-time analytical reporting.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-widest text-neutral-400 font-bold border-b border-neutral-800 pb-1">
              NAVIGATION
            </h4>
            <ul className="space-y-2 font-mono text-xs uppercase tracking-widest text-neutral-300">
              <li><Link to="/" className="hover:underline hover:text-white">Home</Link></li>
              <li><Link to="/workspaces" className="hover:underline hover:text-white">Workspaces</Link></li>
              <li><Link to="/dashboard" className="hover:underline hover:text-white">Analytics</Link></li>
              <li><Link to="/about" className="hover:underline hover:text-white">About</Link></li>
              <li><Link to="/support" className="hover:underline hover:text-white">Support</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-widest text-neutral-400 font-bold border-b border-neutral-800 pb-1">
              SYSTEM STATUS
            </h4>
            <div className="space-y-2 font-mono text-xs text-neutral-300">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-white"></span>
                <span>ENGINE: ONLINE</span>
              </p>
              <p className="text-neutral-400">VERSION: 1.0.0 MONOCHROME</p>
              <p className="text-neutral-400">ENCRYPTION: HTTP-ONLY COOKIES</p>
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-neutral-400 uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} DATAFORGE ENGINE. ALL RIGHTS RESERVED.</p>
          <p>EDITORIAL MONOCHROME EDITION</p>
        </div>
      </div>
    </footer>
  );
}