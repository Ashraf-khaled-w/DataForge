import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { guestLogin } = useAuth();

  const handleGuestAccess = async () => {
    try {
      const res = await guestLogin();
      if (res.success) {
        navigate("/workspaces");
      }
    } catch (err) {
      console.error("Guest login failed:", err);
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-serif-body w-full flex flex-col relative pattern-lines">

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          
          <div className="flex items-center gap-3 mb-8">
            <span className="w-3 h-3 bg-black"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-600 font-bold">
              SYSTEM EDITION NO. 01 — REASONING & DATA ENGINE
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            
            {/* Hero Headlines */}
            <div className="lg:col-span-8 space-y-6">
              <h1 className="font-serif-display font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tighter uppercase text-black">
                REDUCTION <br />
                TO ESSENCE.
              </h1>
              
              <div className="h-1.5 w-32 bg-black"></div>

              <p className="font-serif-body text-lg md:text-xl text-neutral-800 max-w-2xl leading-relaxed">
                Define dynamic relational variables, ingest high-volume spreadsheets in milliseconds, and execute real-time analytical audits without rigid database migrations.
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  to="/auth"
                  className="bg-black hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-widest px-8 py-4 border-2 border-black transition-none cursor-pointer inline-flex items-center gap-3 font-bold shadow-none"
                >
                  <span>GET STARTED</span>
                  <span>→</span>
                </Link>
                
                <button
                  onClick={handleGuestAccess}
                  className="bg-white hover:bg-black text-black hover:text-white font-mono text-xs uppercase tracking-widest px-8 py-4 border-2 border-black transition-none cursor-pointer font-bold"
                >
                  TRY INSTANT GUEST
                </button>
              </div>
            </div>

            {/* Editorial Metadata Column */}
            <div className="lg:col-span-4 border-2 border-black p-6 bg-white space-y-4 font-mono text-xs uppercase tracking-widest pattern-grid">
              <div className="flex items-center justify-between border-b border-black pb-2">
                <span className="font-bold">SPECIFICATION</span>
                <span>STATUS: VERIFIED</span>
              </div>
              <div className="space-y-2 text-neutral-700">
                <p>• SCHEMA: JSONB DYNAMIC</p>
                <p>• PARSING: MEMORY STREAM</p>
                <p>• AUTH: HTTP-ONLY COOKIES</p>
                <p>• CONCURRENCY: SINGLE SESSION</p>
              </div>
              <div className="border-t border-black pt-3 flex items-center justify-between">
                <span>VERSION</span>
                <span className="font-bold">v1.0.0</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Inverted Stats Banner */}
      <section className="bg-black text-white py-16 border-b-4 border-black pattern-lines-inverted">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center font-mono">
          <div className="border-r border-neutral-800 last:border-r-0 pr-4">
            <span className="font-serif-display font-bold text-4xl md:text-5xl block text-white">100%</span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1 block">MONOCHROME ACCURACY</span>
          </div>
          <div className="border-r border-neutral-800 last:border-r-0 pr-4">
            <span className="font-serif-display font-bold text-4xl md:text-5xl block text-white">&lt; 10ms</span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1 block">JSONB QUERY TIME</span>
          </div>
          <div className="border-r border-neutral-800 last:border-r-0 pr-4">
            <span className="font-serif-display font-bold text-4xl md:text-5xl block text-white">0px</span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1 block">BORDER RADIUS</span>
          </div>
          <div>
            <span className="font-serif-display font-bold text-4xl md:text-5xl block text-white">24 / 7</span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1 block">STABLE ENGINE</span>
          </div>
        </div>
      </section>

      {/* Architectural Features Section */}
      <section id="features" className="py-24 border-b-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-16">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-black pb-6 gap-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-500 font-bold block mb-2">ARCHITECTURAL CAPABILITIES</span>
              <h2 className="font-serif-display font-extrabold text-4xl md:text-5xl tracking-tight text-black">
                STARK CAPABILITIES. NO FRILLS.
              </h2>
            </div>
            <p className="font-serif-body text-base text-neutral-700 max-w-md">
              Construct complex data modeling workflows with sharp precision and instant responsiveness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Feature 1 */}
            <div className="border-2 border-black p-8 bg-white transition-colors duration-100 hover:bg-black hover:text-white group space-y-6">
              <div className="w-10 h-10 border-2 border-black group-hover:border-white font-mono font-bold text-lg flex items-center justify-center">
                01
              </div>
              <h3 className="font-serif-display font-bold text-2xl tracking-tight">Dynamic Schema</h3>
              <p className="font-serif-body text-sm leading-relaxed text-neutral-700 group-hover:text-neutral-300">
                Interactively define custom variable fields, validation rules, column headers, and data types (Text, Number, Date, Select).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border-2 border-black p-8 bg-white transition-colors duration-100 hover:bg-black hover:text-white group space-y-6">
              <div className="w-10 h-10 border-2 border-black group-hover:border-white font-mono font-bold text-lg flex items-center justify-center">
                02
              </div>
              <h3 className="font-serif-display font-bold text-2xl tracking-tight">Bulk Ingestion</h3>
              <p className="font-serif-body text-sm leading-relaxed text-neutral-700 group-hover:text-neutral-300">
                Parse Excel files instantly. Ingest thousands of spreadsheet records dynamically in a single transaction.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border-2 border-black p-8 bg-white transition-colors duration-100 hover:bg-black hover:text-white group space-y-6">
              <div className="w-10 h-10 border-2 border-black group-hover:border-white font-mono font-bold text-lg flex items-center justify-center">
                03
              </div>
              <h3 className="font-serif-display font-bold text-2xl tracking-tight">Single Session</h3>
              <p className="font-serif-body text-sm leading-relaxed text-neutral-700 group-hover:text-neutral-300">
                Prevent credential sharing. Automated session tracking kicks off older logins immediately upon new entries.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="border-2 border-black p-8 bg-white transition-colors duration-100 hover:bg-black hover:text-white group space-y-6">
              <div className="w-10 h-10 border-2 border-black group-hover:border-white font-mono font-bold text-lg flex items-center justify-center">
                04
              </div>
              <h3 className="font-serif-display font-bold text-2xl tracking-tight">Audit Logging</h3>
              <p className="font-serif-body text-sm leading-relaxed text-neutral-700 group-hover:text-neutral-300">
                Track full workspace mutation histories with role-based visibility for Administrators and Team Leaders.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Editorial Pull Quote Block */}
      <section className="py-24 bg-neutral-100 border-b-4 border-black pattern-diagonal">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <span className="font-serif-display text-8xl leading-none text-black block -mb-8">“</span>
          <blockquote className="font-serif-display italic text-2xl md:text-4xl text-black font-semibold leading-snug">
            Restraint is the ultimate form of expression. When software discards unnecessary noise, functionality becomes crystal clear.
          </blockquote>
          <div className="font-mono text-xs uppercase tracking-widest text-neutral-600 font-bold pt-4 border-t border-black max-w-xs mx-auto">
            — ARCHITECTURAL PHILOSOPHY
          </div>
        </div>
      </section>

      {/* Sharp Monochrome Pricing Section */}
      <section id="pricing" className="py-24 border-b-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-16">
          
          <div className="text-center space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-500 font-bold">TRANSPARENT TIERING</span>
            <h2 className="font-serif-display font-extrabold text-4xl md:text-5xl tracking-tight text-black">
              SELECT YOUR SUBSCRIPTION MODEL
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* Free Tier */}
            <div className="border-2 border-black p-8 bg-white flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div className="font-mono text-xs uppercase tracking-widest text-neutral-500 font-bold border-b border-black pb-2">
                  FREE TIER
                </div>
                <div className="flex items-baseline gap-1 font-serif-display font-bold text-5xl">
                  $0
                  <span className="font-mono text-xs text-neutral-500 font-normal">/ MONTH</span>
                </div>
                <p className="font-serif-body text-xs text-neutral-700 leading-relaxed">
                  For individual researchers building baseline datasets.
                </p>
                <ul className="font-mono text-xs space-y-3 border-t border-black pt-4">
                  <li className="flex items-center gap-2"><span>[✓]</span> 2 WORKSPACES</li>
                  <li className="flex items-center gap-2"><span>[✓]</span> 50 RECORDS / WORKSPACE</li>
                  <li className="flex items-center gap-2 text-neutral-400"><span>[×]</span> NO TEAM COLLABORATORS</li>
                </ul>
              </div>

              <Link
                to="/auth"
                state={{ plan: "free" }}
                className="w-full text-center bg-white hover:bg-black text-black hover:text-white font-mono text-xs uppercase tracking-widest py-3 border-2 border-black transition-none inline-block font-bold"
              >
                CREATE FREE ACCOUNT
              </Link>
            </div>

            {/* Pro Tier (Elevated Inverted Card) */}
            <div className="border-4 border-black p-8 bg-black text-white flex flex-col justify-between space-y-8 relative shadow-none">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-1 border-2 border-black">
                MOST POPULAR
              </div>
              <div className="space-y-6">
                <div className="font-mono text-xs uppercase tracking-widest text-neutral-400 font-bold border-b border-neutral-800 pb-2">
                  PRO PROFESSIONAL
                </div>
                <div className="flex items-baseline gap-1 font-serif-display font-bold text-5xl text-white">
                  $19
                  <span className="font-mono text-xs text-neutral-400 font-normal">/ MONTH</span>
                </div>
                <p className="font-serif-body text-xs text-neutral-300 leading-relaxed">
                  For analysts and clinicians needing unlimited records.
                </p>
                <ul className="font-mono text-xs space-y-3 border-t border-neutral-800 pt-4 text-neutral-200">
                  <li className="flex items-center gap-2"><span>[✓]</span> UNLIMITED WORKSPACES</li>
                  <li className="flex items-center gap-2"><span>[✓]</span> UNLIMITED INGESTION</li>
                  <li className="flex items-center gap-2 text-neutral-500"><span>[×]</span> SINGLE SEAT</li>
                </ul>
              </div>

              <Link
                to="/auth"
                state={{ plan: "pro" }}
                className="w-full text-center bg-white hover:bg-neutral-200 text-black font-mono text-xs uppercase tracking-widest py-3.5 border-2 border-white transition-none inline-block font-bold"
              >
                START 1-DAY TRIAL
              </Link>
            </div>

            {/* Team Tier */}
            <div className="border-2 border-black p-8 bg-white flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div className="font-mono text-xs uppercase tracking-widest text-neutral-500 font-bold border-b border-black pb-2">
                  TEAM ENTERPRISE
                </div>
                <div className="flex items-baseline gap-1 font-serif-display font-bold text-5xl">
                  $49
                  <span className="font-mono text-xs text-neutral-500 font-normal">/ MONTH</span>
                </div>
                <p className="font-serif-body text-xs text-neutral-700 leading-relaxed">
                  For collaborative labs, business teams, and clinics.
                </p>
                <ul className="font-mono text-xs space-y-3 border-t border-black pt-4">
                  <li className="flex items-center gap-2"><span>[✓]</span> UNLIMITED WORKSPACES</li>
                  <li className="flex items-center gap-2"><span>[✓]</span> UNLIMITED INGESTION</li>
                  <li className="flex items-center gap-2"><span>[✓]</span> 10 COLLABORATOR SEATS</li>
                </ul>
              </div>

              <Link
                to="/auth"
                state={{ plan: "team" }}
                className="w-full text-center bg-white hover:bg-black text-black hover:text-white font-mono text-xs uppercase tracking-widest py-3 border-2 border-black transition-none inline-block font-bold"
              >
                START 1-DAY TRIAL
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="bg-black text-white py-24 border-t-4 border-black pattern-lines-inverted text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          <h2 className="font-serif-display font-black text-5xl md:text-6xl tracking-tight uppercase">
            BEGIN MODELING NOW.
          </h2>
          <p className="font-serif-body text-lg text-neutral-300 max-w-xl mx-auto">
            Experience stark clarity, instant spreadsheet parsing, and strict session security.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              to="/auth"
              className="bg-white hover:bg-neutral-200 text-black font-mono text-xs uppercase tracking-widest px-8 py-4 border-2 border-white transition-none font-bold"
            >
              CREATE ACCOUNT
            </Link>
            <button
              onClick={handleGuestAccess}
              className="bg-transparent hover:bg-neutral-900 text-white font-mono text-xs uppercase tracking-widest px-8 py-4 border-2 border-white transition-none cursor-pointer font-bold"
            >
              TRY GUEST ACCESS
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}