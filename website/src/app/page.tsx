import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen font-sans bg-aura-bg text-aura-text overflow-x-hidden selection:bg-aura-active selection:text-black">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-aura-bg/90 backdrop-blur-md border-b border-aura-border/50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-aura-active shadow-glow-active animate-pulse"></div>
            <span className="font-bold text-lg tracking-[3px]">AURA</span>
          </div>
          <nav className="hidden md:flex gap-8 text-xs font-semibold tracking-wider text-aura-muted uppercase">
            <a href="#features" className="hover:text-aura-text transition-colors duration-300">Features</a>
            <a href="#architecture" className="hover:text-aura-text transition-colors duration-300">Architecture</a>
            <a href="#experience" className="hover:text-aura-text transition-colors duration-300">Experience</a>
          </nav>
          <a href="https://github.com/DoonMad/AURA" target="_blank" rel="noreferrer" className="text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded border border-aura-border hover:bg-aura-surface hover:border-aura-muted transition-all duration-300">
            GitHub
          </a>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-24 md:pt-56 md:pb-32 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-[8px] mb-8">
            AURA
          </h1>
          <p className="text-xl md:text-2xl text-aura-muted max-w-2xl mb-12 font-medium leading-relaxed">
            High-fidelity, real-time voice communication platform. Engineered for instant push-to-talk over persistent channels.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a href="https://github.com/DoonMad/AURA/releases/latest" className="group px-8 py-4 bg-aura-active text-black font-bold rounded hover:bg-[#00e65c] transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,255,102,0.15)] hover:shadow-[0_0_30px_rgba(0,255,102,0.3)]">
              <svg className="transition-transform group-hover:-translate-y-0.5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Get Mobile App
            </a>
            <a href="https://github.com/DoonMad/AURA/releases/latest" className="group px-8 py-4 bg-transparent border border-aura-border text-aura-text font-bold rounded hover:bg-aura-surface hover:border-aura-muted transition-all duration-300 flex items-center justify-center gap-3">
              <svg className="text-aura-muted group-hover:text-aura-text transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
              Get Watch App
            </a>
          </div>
        </div>
      </section>

      {/* SYSTEM ARCHITECTURE SECTION */}
      <section id="architecture" className="py-24 bg-aura-surface/40 border-y border-aura-border/50 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-aura-active uppercase tracking-widest mb-4">Engineering</h2>
            <h3 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">System Architecture</h3>
            <p className="text-lg text-aura-muted leading-relaxed max-w-3xl mx-auto">
              AURA bypasses traditional peer-to-peer mesh limitations in favor of a centralized Selective Forwarding Unit (SFU). This ensures communication remains stable and highly responsive regardless of room size.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-12">
            <div className="border-l border-aura-active/50 pl-6">
              <h4 className="text-lg font-bold mb-2 text-aura-text">WebRTC Audio Streaming</h4>
              <p className="text-sm text-aura-muted leading-relaxed">Opus-encoded audio over low-latency UDP transport for uncompromising voice clarity.</p>
            </div>
            <div className="border-l border-aura-active/50 pl-6">
              <h4 className="text-lg font-bold mb-2 text-aura-text">SFU Routing (mediasoup)</h4>
              <p className="text-sm text-aura-muted leading-relaxed">Centralized media distribution that eliminates bandwidth degradation as channels scale.</p>
            </div>
            <div className="border-l border-aura-active/50 pl-6">
              <h4 className="text-lg font-bold mb-2 text-aura-text">Cloud Infrastructure</h4>
              <p className="text-sm text-aura-muted leading-relaxed">Authoritative, real-time socket signaling deployed on Oracle Cloud for persistent uptime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-8 bg-aura-surface/50 border border-aura-border rounded-lg hover:border-aura-muted transition-all duration-300 group">
            <h4 className="text-lg font-bold mb-2 group-hover:text-aura-active transition-colors">Instant Push-To-Talk</h4>
            <p className="text-aura-muted text-sm leading-relaxed">Sub-second latency with tactile feedback. Transmission occurs the exact moment you press.</p>
          </div>

          <div className="p-8 bg-aura-surface/50 border border-aura-border rounded-lg hover:border-aura-muted transition-all duration-300 group">
            <h4 className="text-lg font-bold mb-2 group-hover:text-aura-active transition-colors">Multi-Channel Operation</h4>
            <p className="text-aura-muted text-sm leading-relaxed">Switch seamlessly between isolated communication frequencies without dropping the connection.</p>
          </div>

          <div className="p-8 bg-aura-surface/50 border border-aura-border rounded-lg hover:border-aura-muted transition-all duration-300 group">
            <h4 className="text-lg font-bold mb-2 group-hover:text-aura-active transition-colors">Background Persistence</h4>
            <p className="text-aura-muted text-sm leading-relaxed">A native Android foreground service maintains the WebRTC transport even when minimized.</p>
          </div>

          <div className="p-8 bg-aura-surface/50 border border-aura-border rounded-lg hover:border-aura-muted transition-all duration-300 group">
            <h4 className="text-lg font-bold mb-2 group-hover:text-aura-active transition-colors">Wear OS Integration</h4>
            <p className="text-aura-muted text-sm leading-relaxed">Trigger transmissions directly from your wrist using the synchronized smartwatch bridge.</p>
          </div>

          <div className="p-8 bg-aura-surface/50 border border-aura-border rounded-lg hover:border-aura-muted transition-all duration-300 group">
            <h4 className="text-lg font-bold mb-2 group-hover:text-aura-active transition-colors">Telemetry & Roster</h4>
            <p className="text-aura-muted text-sm leading-relaxed">Live visibility into active members, online statuses, and real-time speaker indicators.</p>
          </div>

          <div className="p-8 bg-aura-surface/50 border border-aura-border rounded-lg hover:border-aura-muted transition-all duration-300 group">
            <h4 className="text-lg font-bold mb-2 group-hover:text-aura-active transition-colors">Seamless Access</h4>
            <p className="text-aura-muted text-sm leading-relaxed">Invite operatives and join specific room contexts instantly using aura:// deep links.</p>
          </div>

        </div>
      </section>

      {/* EXPERIENCE / SCREENS SECTION */}
      <section id="experience" className="py-24 px-6 max-w-7xl mx-auto overflow-hidden border-t border-aura-border/50">
        <div className="flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32">
          
          <div className="group relative">
            <div className="absolute inset-0 bg-aura-active opacity-0 group-hover:opacity-5 blur-3xl transition-opacity duration-700 rounded-full"></div>
            <div className="relative w-[320px] h-[640px] bg-[#050505] border border-[#222] rounded-[48px] overflow-hidden shadow-2xl transition-transform duration-700 group-hover:-translate-y-2">
              <Image 
                src="/aura-mobile.jpg" 
                alt="AURA Mobile Interface" 
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          <div className="group relative md:mt-32">
            <div className="absolute inset-0 bg-aura-active opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-700 rounded-full"></div>
            <div className="relative w-[220px] h-[220px] bg-[#050505] border border-[#222] rounded-full overflow-hidden shadow-2xl transition-transform duration-700 group-hover:-translate-y-2">
              <Image 
                src="/aura-wear.png" 
                alt="AURA Wear OS Interface" 
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="py-24 bg-aura-surface/30 border-t border-aura-border/50 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-sm font-bold tracking-widest uppercase mb-4 text-aura-muted">About the Project</h2>
          <p className="text-aura-text font-medium leading-relaxed">
            AURA is an open-source real-time communication system engineered for performance.<br/>Built by DoonMad.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-aura-border/50 bg-[#050505] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-aura-muted"></div>
            <span className="font-bold tracking-widest text-xs uppercase text-aura-muted">AURA</span>
          </div>
          
          <div className="flex gap-8 text-xs font-semibold tracking-wider uppercase text-aura-muted/60">
            <a href="https://github.com/DoonMad/AURA" target="_blank" rel="noreferrer" className="hover:text-aura-text transition-colors">Source Code</a>
            <a href="https://github.com/DoonMad/AURA/releases/latest" className="hover:text-aura-text transition-colors">Releases</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
