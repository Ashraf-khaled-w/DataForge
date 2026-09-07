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
    <div className="min-h-screen bg-white text-black font-serif-body py-16 px-6 md:px-10 pattern-lines">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header Block */}
        <div className="border-b-4 border-black pb-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-black"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-600 font-bold">
              HELP & INQUIRIES
            </span>
          </div>
          <h1 className="font-serif-display font-black text-5xl md:text-6xl uppercase tracking-tight text-black">
            SUPPORT PORTAL
          </h1>
          <p className="font-serif-body text-base text-neutral-800 max-w-lg">
            Assistance with workspace variable configurations, subscription management, or bulk data ingestion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Support Channels Info */}
          <div className="md:col-span-5 border-4 border-black p-8 bg-white space-y-6 pattern-grid">
            <h3 className="font-serif-display font-bold text-xl uppercase text-black border-b-2 border-black pb-2">
              SUPPORT DIRECTORY
            </h3>
            
            <div className="space-y-6 font-mono text-xs uppercase">
              <div className="space-y-1">
                <div className="font-bold text-black border-b border-black pb-1">EMAIL CONTACT</div>
                <a href="mailto:support@dataforge.com" className="text-neutral-700 hover:underline block font-bold">
                  support@dataforge.com
                </a>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-black border-b border-black pb-1">RESPONSE SLA</div>
                <p className="text-neutral-700">WITHIN 24 BUSINESS HOURS</p>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-black border-b border-black pb-1">OPERATING HOURS</div>
                <p className="text-neutral-700">MON – FRI, 09:00 – 18:00 UTC</p>
              </div>
            </div>
          </div>

          {/* Support Form Container */}
          <div className="md:col-span-7 border-4 border-black p-8 md:p-10 bg-white">
            {submitted ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-12 h-12 border-2 border-black text-black font-mono font-bold text-2xl flex items-center justify-center mx-auto bg-black text-white">
                  ✓
                </div>
                <h3 className="font-serif-display font-bold text-2xl uppercase">MESSAGE RECEIVED</h3>
                <p className="font-serif-body text-sm text-neutral-700 max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong>{name}</strong>. Your ticket regarding <strong>{subject}</strong> queries has been logged. Our engineers will reply to <strong>{email}</strong> shortly.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setMessage(""); }}
                  className="font-mono text-xs uppercase tracking-widest bg-white hover:bg-black text-black hover:text-white border-2 border-black px-6 py-3 font-bold transition-none cursor-pointer"
                >
                  SEND ANOTHER TICKET →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                      YOUR NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-3 border-b-2 border-black focus:border-b-4 focus:outline-none bg-white text-black font-serif-body text-base placeholder:italic placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@organization.com"
                      className="w-full px-3 py-3 border-b-2 border-black focus:border-b-4 focus:outline-none bg-white text-black font-serif-body text-base placeholder:italic placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                    TOPIC CATEGORY
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-3 border-2 border-black bg-white text-black font-mono text-xs uppercase tracking-widest focus:outline-none cursor-pointer"
                  >
                    <option value="general">GENERAL INQUIRY</option>
                    <option value="billing">BILLING & SUBSCRIPTIONS</option>
                    <option value="technical">TECHNICAL ISSUE</option>
                    <option value="workspace">SCHEMA CUSTOMIZATION</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                    MESSAGE DETAILS *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe how we can assist you..."
                    className="w-full px-3 py-3 border-2 border-black focus:outline-none bg-white text-black font-serif-body text-sm placeholder:italic placeholder:text-neutral-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-black hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-widest py-4 border-2 border-black font-bold transition-none cursor-pointer"
                >
                  SUBMIT SUPPORT TICKET →
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
