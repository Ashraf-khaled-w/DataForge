export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between text-xs md:text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} DataForge Analytics Platform. All rights reserved.</p>
        <p className="hidden sm:inline">Beta v1.0.0</p>
      </div>
    </footer>
  );
}