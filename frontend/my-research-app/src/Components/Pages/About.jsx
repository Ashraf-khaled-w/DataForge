import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans w-full py-16 px-6 md:px-10 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        
        {/* Header Block */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-500/20">
            📊 Our Mission & Story
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            About <span className="text-indigo-400">DataForge</span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            DataForge was built to solve a critical bottleneck in data science and clinical analysis: the friction between rigid databases and unstructured data collection.
          </p>
        </div>

        {/* Brand Narrative Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-200">
              Why We Built DataForge
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Spreadsheets are incredibly flexible but lack data validation, multi-user safety, and relational indexing. Relational databases are secure and fast but require complex SQL migrations every time a variable is added or changed.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              DataForge bridges this gap. By utilizing advanced PostgreSQL JSONB indexing and in-memory schema builder variables, we allow teams to structure custom fields, validate entries on-the-fly, and analyze reports dynamically in real-time.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="text-indigo-400 font-mono text-xs font-bold uppercase tracking-widest">
              Core Milestones
            </div>
            
            <div className="space-y-4 text-xs">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-500/20">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Flexible JSONB Engine</h4>
                  <p className="text-slate-400 mt-1">Launched a highly performant dynamic storage model capable of handling arbitrary nested schemas.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Lightning Ingestion</h4>
                  <p className="text-slate-400 mt-1">Configured raw memory excel parsers that upload thousands of row records in under 300ms.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/20">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Dynamic UI Framework</h4>
                  <p className="text-slate-400 mt-1">Engineered dynamic charts and datagrids that adjust instantaneously when variables config are updated.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature stats */}
        <div className="grid grid-cols-3 gap-6 text-center border-y border-slate-800 py-10">
          <div>
            <div className="text-3xl md:text-4xl font-extrabold text-indigo-400">99.9%</div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Uptime SLA</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-extrabold text-emerald-400">300ms</div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Average Ingestion</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-extrabold text-amber-400">10k+</div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Records Uploaded</div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-indigo-950/20 border border-indigo-500/20 p-8 rounded-2xl space-y-4 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-slate-200">
            Ready to structure your data?
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Get started today by registering a Free account, starting a 1-day Trial, or logging in instantly as a guest.
          </p>
          <div className="pt-2">
            <Link
              to="/auth"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-6 py-3 rounded-lg shadow-lg hover:shadow-indigo-550/25 transition-all inline-block"
            >
              Sign In / Register
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
