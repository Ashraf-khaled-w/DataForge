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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans w-full flex flex-col relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24 z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Content */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-500/20">
              🚀 Universal Research & Data Modeling SaaS Platform
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white">
              Define, Collect & Analyze <span className="text-indigo-400">Any Dataset</span> Instantly
            </h1>
            
            <p className="text-slate-450 text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Ditch rigid spreadsheets. Design dynamic table schemas, import mass Excel/CSV files with automatic field matching, and manage secure databases from a single portal.
            </p>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                to="/auth"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3.5 rounded-lg shadow-lg hover:shadow-indigo-550/30 transition-all flex items-center gap-2 text-sm"
              >
                Get Started
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              
              <button
                onClick={handleGuestAccess}
                className="border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium px-6 py-3.5 rounded-lg transition-all text-sm flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-emerald-450" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Try as Guest (Instant Access)
              </button>
            </div>
          </div>
          
          {/* Hero Visual Mockup */}
          <div className="lg:col-span-6 z-10">
            <div className="relative bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 p-3 sm:p-5 aspect-4/3 flex flex-col overflow-hidden max-w-lg mx-auto lg:max-w-none">
              {/* Fake Window Controls */}
              <div className="flex items-center gap-1.5 pb-3">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-slate-500 font-mono ml-2">Console Dashboard</span>
              </div>
              
              {/* Simulated UI Cards */}
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/80 flex-1 space-y-4 font-mono text-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">SCHEMA: User Feedback</span>
                  <span className="text-emerald-400 font-bold">200 OK</span>
                </div>
                
                {/* Visual DB Columns Config */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                    <span className="text-indigo-400 text-[10px] block">field_1</span>
                    Customer (Text)
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                    <span className="text-indigo-400 text-[10px] block">field_2</span>
                    Rating (Number)
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                    <span className="text-indigo-400 text-[10px] block">field_3</span>
                    Review (Text)
                  </div>
                </div>

                {/* Table preview mock */}
                <div className="space-y-1.5">
                  <span className="text-slate-500 text-[10px] block uppercase">Parsed Records (jsonb)</span>
                  <div className="bg-slate-950 p-2 rounded text-[11px] text-slate-450 overflow-x-auto whitespace-nowrap border border-slate-850">
                    {"[ { id: 1, name: 'Alice', rating: 5 }, { id: 2, name: 'Bob', rating: 4 } ]"}
                  </div>
                </div>

                {/* Progress mock */}
                <div className="flex items-center justify-between bg-indigo-950/40 p-2 rounded border border-indigo-900/30 text-indigo-300 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading dataset_v2.xlsx...
                  </span>
                  <span className="font-bold">100% Completed</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-16 md:py-24 border-t border-slate-800 bg-slate-900/60 z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white">
              Tailored Data Infrastructure Out of the Box
            </h2>
            <p className="text-slate-450 text-sm md:text-base max-w-xl mx-auto">
              Our software operates as a flexible, schema-agnostic platform allowing you to configure dynamic workspaces for clinical, business, or academic projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-slate-800/40 p-6 border border-slate-700/50 rounded-2xl shadow-sm hover:border-slate-650 transition-all space-y-4">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-450 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-200 text-lg">Dynamic Schema Builder</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Interactively construct database variables. Assign constraints, column headers, system keys, and specify data types (Text, Number, Date, Select).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/40 p-6 border border-slate-700/50 rounded-2xl shadow-sm hover:border-slate-650 transition-all space-y-4">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-450 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-200 text-lg">Bulk File Importer</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Instantly import bulk datasets. Our server-side parser processes Excel spreadsheets and inserts records dynamically in a single transaction.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/40 p-6 border border-slate-700/50 rounded-2xl shadow-sm hover:border-slate-650 transition-all space-y-4">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-450 rounded-xl flex items-center justify-center border border-amber-500/20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-200 text-lg">Flexible jsonb Tables</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Store structured and unstructured inputs under the same workspace. Avoid complex database migrations when column requirements shift.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/40 p-6 border border-slate-700/50 rounded-2xl shadow-sm hover:border-slate-650 transition-all space-y-4">
              <div className="w-10 h-10 bg-rose-500/10 text-rose-450 rounded-xl flex items-center justify-center border border-rose-500/20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-200 text-lg">Multi-User Collaboration</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Invite workspace editors and viewers to collaborate. Track and segregate data permissions based on administrative manager hierarchies.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 border-t border-slate-800 bg-slate-950/40 z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Pricing Plans</span>
            <h2 className="text-3xl font-extrabold text-white">
              Choose the Right Plan for Your Team
            </h2>
            <p className="text-slate-450 text-sm max-w-lg mx-auto">
              Get started with a free tier account or test our premium Pro and Team tiers with a 1-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Plan 1: Free */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl flex flex-col justify-between hover:border-slate-700/80 transition-all shadow-lg relative">
              <div className="space-y-4">
                <div className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Free Tier</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-slate-500 text-xs">/month</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Perfect for individual students and researchers starting their first data catalogs.
                </p>
                <hr className="border-slate-800" />
                
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Up to <strong>2 Workspaces</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Max <strong>50 Records</strong> / Workspace</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <svg className="w-4 h-4 text-slate-650 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>No Team Members (0 seats)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to="/auth"
                  state={{ plan: "free" }}
                  className="w-full text-center bg-slate-800 hover:bg-slate-750 text-white font-semibold py-2.5 rounded-lg text-xs transition-all inline-block shadow-sm"
                >
                  Create Free Account
                </Link>
              </div>
            </div>

            {/* Plan 2: Pro */}
            <div className="bg-slate-900 border-2 border-indigo-500 p-8 rounded-2xl flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                Popular Trial
              </div>
              <div className="space-y-4">
                <div className="font-semibold text-indigo-400 text-xs uppercase tracking-wider">Pro Professional</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$19</span>
                  <span className="text-slate-500 text-xs">/month</span>
                </div>
                <p className="text-slate-350 text-xs leading-relaxed">
                  Ideal for freelance data analysts and clinicians seeking unlimited data records storage.
                </p>
                <hr className="border-slate-800" />
                
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Unlimited</strong> Workspaces</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Unlimited</strong> Records Ingestion</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <svg className="w-4 h-4 text-slate-650 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Single User (No shared seats)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to="/auth"
                  state={{ plan: "pro" }}
                  className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs transition-all inline-block shadow shadow-indigo-500/20"
                >
                  Start 1-Day Trial (Free)
                </Link>
              </div>
            </div>

            {/* Plan 3: Team */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl flex flex-col justify-between hover:border-slate-700/80 transition-all shadow-lg relative">
              <div className="space-y-4">
                <div className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Team Enterprise</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$49</span>
                  <span className="text-slate-500 text-xs">/month</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Best for clinics, team collaboration hubs, and joint academic research cohorts.
                </p>
                <hr className="border-slate-800" />
                
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Unlimited</strong> Workspaces</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Unlimited</strong> Records Ingestion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Up to <strong>10 Collaborators</strong></span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to="/auth"
                  state={{ plan: "team" }}
                  className="w-full text-center bg-slate-800 hover:bg-slate-750 text-white font-semibold py-2.5 rounded-lg text-xs transition-all inline-block shadow-sm"
                >
                  Start 1-Day Trial (Free)
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer block */}
      <section className="bg-slate-950 py-16 text-center text-slate-300 border-t border-slate-850">
        <div className="max-w-4xl mx-auto px-6 md:px-10 space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Simplify Your Data Pipeline Today
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Begin defining schema variables, import Excel sheets, and review custom data collections in minutes.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/auth"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-3 rounded-lg shadow-md hover:shadow-indigo-550/20 transition-all"
            >
              Get Started for Free
            </Link>
            <button
              onClick={handleGuestAccess}
              className="border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs px-6 py-3 rounded-lg transition-all cursor-pointer"
            >
              Try as Guest
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}