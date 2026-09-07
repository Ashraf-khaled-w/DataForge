import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-white text-black font-serif-body py-16 px-6 md:px-10 pattern-lines">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Header Block */}
        <div className="border-b-4 border-black pb-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-black"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-600 font-bold">
              ORIGIN & PHILOSOPHY
            </span>
          </div>
          <h1 className="font-serif-display font-black text-5xl md:text-6xl uppercase tracking-tight text-black">
            ABOUT DATAFORGE
          </h1>
          <p className="font-serif-body text-lg text-neutral-800 max-w-2xl leading-relaxed">
            DataForge was built to eliminate the friction between rigid relational databases and unstructured clinical spreadsheet collection.
          </p>
        </div>

        {/* Narrative & Milestones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h2 className="font-serif-display font-bold text-3xl text-black uppercase tracking-tight border-b-2 border-black pb-2">
              WHY WE BUILT DATAFORGE
            </h2>
            <p className="font-serif-body text-base text-neutral-800 leading-relaxed">
              <span className="float-left font-serif-display font-black text-4xl leading-none border-2 border-black px-3 py-1 mr-3 bg-black text-white">
                S
              </span>
              preadsheets are flexible but lack data validation, multi-user safety, and relational indexing. Relational databases are secure and fast but require complex SQL migrations every time a variable is changed.
            </p>
            <p className="font-serif-body text-base text-neutral-800 leading-relaxed">
              DataForge bridges this gap. By combining PostgreSQL JSONB storage with in-memory schema builder variables, we allow teams to structure custom fields, validate entries on-the-fly, and analyze reports dynamically in real-time.
            </p>
          </div>

          <div className="border-4 border-black p-8 bg-white space-y-6 pattern-grid">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-black border-b-2 border-black pb-2">
              SYSTEM MILESTONES
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 border-2 border-black font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  01
                </div>
                <div>
                  <h4 className="font-serif-display font-bold text-lg">Dynamic JSONB Engine</h4>
                  <p className="font-serif-body text-xs text-neutral-600 mt-1">High-performance schema-agnostic storage model for dynamic variables.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 border-2 border-black font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  02
                </div>
                <div>
                  <h4 className="font-serif-display font-bold text-lg">Bulk Ingestion Pipeline</h4>
                  <p className="font-serif-body text-xs text-neutral-600 mt-1">In-memory Excel/CSV parser ingesting thousands of rows in milliseconds.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 border-2 border-black font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  03
                </div>
                <div>
                  <h4 className="font-serif-display font-bold text-lg">Single-Session Auth</h4>
                  <p className="font-serif-body text-xs text-neutral-600 mt-1">HTTP-Only cookies with instant multi-device concurrency kickouts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature stats */}
        <div className="grid grid-cols-3 gap-6 text-center border-y-4 border-black py-10 font-mono">
          <div>
            <div className="font-serif-display font-bold text-4xl md:text-5xl text-black">100%</div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1 font-bold">MONOCHROME DEDICATION</div>
          </div>
          <div>
            <div className="font-serif-display font-bold text-4xl md:text-5xl text-black">&lt; 10ms</div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1 font-bold">POSTGRES JSONB PARSE</div>
          </div>
          <div>
            <div className="font-serif-display font-bold text-4xl md:text-5xl text-black">0px</div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1 font-bold">BORDER RADIUS</div>
          </div>
        </div>

        {/* CTA */}
        <div className="border-4 border-black bg-black text-white p-12 text-center space-y-6 pattern-lines-inverted">
          <h3 className="font-serif-display font-black text-3xl md:text-4xl uppercase tracking-tight">
            READY TO MODEL YOUR DATASET?
          </h3>
          <p className="font-serif-body text-sm text-neutral-300 max-w-md mx-auto">
            Get started by registering a Free account, testing a 1-day Trial, or exploring as a guest.
          </p>
          <div>
            <Link
              to="/auth"
              className="bg-white hover:bg-neutral-200 text-black font-mono text-xs uppercase tracking-widest px-8 py-4 border-2 border-white font-bold transition-none inline-block"
            >
              AUTHENTICATE NOW →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
