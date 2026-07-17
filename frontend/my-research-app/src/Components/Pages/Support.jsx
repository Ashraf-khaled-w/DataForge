import { useState } from "react";

export default function Support() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans w-full py-16 px-6 md:px-10 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-10 relative z-10">
        
        {/* Header Block */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-350 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-500/20">
            💬 Customer Support
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Contact & <span className="text-indigo-400">Support</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
            Need assistance with workspace configurations, subscription limits, or bulk Excel imports? Our team is here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-4">
          {/* Support Info */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-200">Support Channels</h3>
              
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-350">Email Support</div>
                    <a href="mailto:support@dataforge.com" className="text-slate-400 hover:text-indigo-400 transition-colors">support@dataforge.com</a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-350">Knowledge Base</div>
                    <span className="text-slate-450">Comprehensive wiki guides.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-350">Business Hours</div>
                    <span className="text-slate-450">Mon - Fri, 9am - 6pm UTC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support Form */}
          <div className="md:col-span-7 bg-slate-800/40 border border-slate-700/60 p-6 md:p-8 rounded-2xl shadow-xl">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-200">Message Received!</h3>
                <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong>{name}</strong>. We have received your support request regarding <strong>{subject}</strong> queries. Our technical staff will contact you at <strong>{email}</strong> shortly.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setMessage(""); }}
                  className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@organization.com"
                      className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider">
                    Topic / Category
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/80 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all cursor-pointer"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="billing">Billing & Subscriptions</option>
                    <option value="technical">Technical Bug / Issue</option>
                    <option value="workspace">Workspace Schema Customization</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider">
                    Message Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe how we can assist you..."
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg shadow-md hover:shadow-indigo-550/20 transition-all text-sm flex items-center justify-center gap-1.5"
                >
                  Submit Ticket
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
