import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen font-sans bg-aura-bg text-aura-text overflow-x-hidden">
      {/* HEADER / NAV */}
      <header className="fixed top-0 w-full z-50 bg-aura-bg/80 backdrop-blur-md border-b border-aura-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-aura-active shadow-glow-active"></div>
            <span className="font-bold text-xl tracking-[4px]">AURA</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-aura-muted">
            <a href="#features" className="hover:text-aura-text transition-colors">Features</a>
            <a href="#architecture" className="hover:text-aura-text transition-colors">Architecture</a>
            <a href="#experience" className="hover:text-aura-text transition-colors">Experience</a>
          </nav>
          <a href="https://github.com/DoonMad/AURA" target="_blank" rel="noreferrer" className="text-sm font-medium px-4 py-2 rounded-md border border-aura-border hover:bg-aura-surface transition-colors">
            GitHub
          </a>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aura-surface border border-aura-border text-xs font-semibold text-aura-active mb-6 tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aura-active opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-aura-active"></span>
            </span>
            SYSTEM ONLINE
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-[8px] mb-6">
            AURA
          </h1>
          <p className="text-xl md:text-2xl text-aura-muted max-w-2xl mb-10">
            High-Fidelity. Low-Latency. <br className="hidden md:block" />
            The next-generation WebRTC walkie-talkie platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a href="https://github.com/DoonMad/AURA/releases/latest" className="px-8 py-4 bg-aura-active text-black font-bold rounded-lg hover:bg-opacity-90 transition-all shadow-glow-active-strong flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Mobile APK
            </a>
            <a href="https://github.com/DoonMad/AURA/releases/latest" className="px-8 py-4 bg-aura-surface border border-aura-border text-aura-text font-bold rounded-lg hover:bg-opacity-80 transition-all flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
              Download Watch APK
            </a>
          </div>
        </div>
      </section>

      {/* PROBLEM -> SOLUTION SECTION */}
      <section className="py-20 bg-aura-surface/30 border-y border-aura-border px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Built for the critical moment.</h2>
          <p className="text-lg text-aura-muted leading-relaxed">
            Legacy voice chat apps are bloated, slow, and rely on Peer-to-Peer (P2P) mesh networks that degrade rapidly with multiple users. AURA is purpose-built. By leveraging a centralized Selective Forwarding Unit (SFU) and raw WebRTC, AURA delivers instant, channel-based Push-To-Talk communication that scales flawlessly, even in low-bandwidth environments.
          </p>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-sm font-bold text-aura-active uppercase tracking-widest mb-2">Capabilities</h2>
          <h3 className="text-3xl md:text-4xl font-bold">Tactical Feature Set</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature Card 1 */}
          <div className="p-8 bg-aura-surface border border-aura-border rounded-xl hover:border-aura-active transition-colors">
            <div className="w-12 h-12 bg-aura-active/10 text-aura-active rounded-lg flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </div>
            <h4 className="text-xl font-bold mb-3">Instant Push-To-Talk</h4>
            <p className="text-aura-muted">Core walkie-talkie interface with tactile haptic feedback. Sub-second latency ensures you are heard immediately.</p>
          </div>
          {/* Feature Card 2 */}
          <div className="p-8 bg-aura-surface border border-aura-border rounded-xl hover:border-aura-active transition-colors">
            <div className="w-12 h-12 bg-aura-active/10 text-aura-active rounded-lg flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"/></svg>
            </div>
            <h4 className="text-xl font-bold mb-3">Multi-Channel Routing</h4>
            <p className="text-aura-muted">Switch seamlessly between isolated communication channels within a single room context.</p>
          </div>
          {/* Feature Card 3 */}
          <div className="p-8 bg-aura-surface border border-aura-border rounded-xl hover:border-aura-active transition-colors">
            <div className="w-12 h-12 bg-aura-active/10 text-aura-active rounded-lg flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <h4 className="text-xl font-bold mb-3">Background Persistence</h4>
            <p className="text-aura-muted">Android foreground service ensures the socket and WebRTC transport stay alive even when the app is minimized.</p>
          </div>
          {/* Feature Card 4 */}
          <div className="p-8 bg-aura-surface border border-aura-border rounded-xl hover:border-aura-active transition-colors">
            <div className="w-12 h-12 bg-aura-active/10 text-aura-active rounded-lg flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"/></svg>
            </div>
            <h4 className="text-xl font-bold mb-3">Wear OS Companion</h4>
            <p className="text-aura-muted">Synchronized smartwatch app mirroring room state. Trigger PTT directly from your wrist without pulling out your phone.</p>
          </div>
          {/* Feature Card 5 */}
          <div className="p-8 bg-aura-surface border border-aura-border rounded-xl hover:border-aura-active transition-colors">
            <div className="w-12 h-12 bg-aura-active/10 text-aura-active rounded-lg flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h4 className="text-xl font-bold mb-3">Live Roster & Admin</h4>
            <p className="text-aura-muted">View all members, their online status, and active speakers in real-time. Full admin controls to manage room access.</p>
          </div>
          {/* Feature Card 6 */}
          <div className="p-8 bg-aura-surface border border-aura-border rounded-xl hover:border-aura-active transition-colors">
            <div className="w-12 h-12 bg-aura-active/10 text-aura-active rounded-lg flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <h4 className="text-xl font-bold mb-3">Deep Linking</h4>
            <p className="text-aura-muted">Seamlessly invite operatives and join specific frequencies instantly using aura://join/ links.</p>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE SECTION */}
      <section id="architecture" className="py-24 bg-[#0a0a0a] border-y border-aura-border px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-sm font-bold text-aura-active uppercase tracking-widest mb-2">Engineering</h2>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Advanced SFU Architecture</h3>
              <p className="text-lg text-aura-muted mb-6 leading-relaxed">
                AURA is built on top of <strong>mediasoup</strong>, a cutting-edge WebRTC Selective Forwarding Unit (SFU). Unlike traditional P2P mesh architectures that consume massive bandwidth as participants increase, AURA routes all streams through an intelligent backend server.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-aura-active shadow-glow-active"></div>
                  <p className="text-aura-muted"><strong>Dynamic Mic Allocation:</strong> Intelligent acquisition and release of the microphone to prevent echo and manage permissions.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-aura-active shadow-glow-active"></div>
                  <p className="text-aura-muted"><strong>State Synchronization:</strong> Zustand state on the React Native frontend is perfectly mirrored to the Node.js backend via Socket.io signaling.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-aura-active shadow-glow-active"></div>
                  <p className="text-aura-muted"><strong>Cloud-Ready:</strong> Configured for highly scalable cloud deployments with dynamic IP announcement and UDP port range management.</p>
                </li>
              </ul>
            </div>
            
            <div className="flex-1 w-full bg-aura-surface border border-aura-border rounded-xl p-8 font-mono text-sm overflow-x-auto relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-aura-active/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"></div>
              <div className="text-aura-muted">
                <span className="text-aura-active">const</span> <span className="text-blue-400">mediaCodecs</span> = [ <br/>
                &nbsp;&nbsp;&#123; <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;kind: <span className="text-green-400">"audio"</span>, <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;mimeType: <span className="text-green-400">"audio/opus"</span>, <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;clockRate: <span className="text-orange-400">48000</span>, <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;channels: <span className="text-orange-400">2</span>, <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;parameters: &#123; <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;minptime: <span className="text-orange-400">10</span>, <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;useinbandfec: <span className="text-orange-400">1</span> <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&#125; <br/>
                &nbsp;&nbsp;&#125; <br/>
                ]; <br/>
                <br/>
                <span className="text-aura-muted italic">// Mediasoup Router Configuration for High-Fidelity Audio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE / SCREENS SECTION */}
      <section id="experience" className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-aura-active uppercase tracking-widest mb-2">Experience</h2>
          <h3 className="text-3xl md:text-4xl font-bold">Uncompromising Interface</h3>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
          
          <div className="flex flex-col items-center">
            <div className="relative w-[300px] h-[600px] bg-black border-[8px] border-aura-border rounded-[40px] overflow-hidden shadow-2xl flex items-center justify-center">
              <div className="absolute top-0 w-32 h-6 bg-aura-border rounded-b-xl z-10"></div>
              {/* Replace with actual image later */}
              <Image 
                src="/aura-mobile.png" 
                alt="AURA Mobile Interface" 
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <h4 className="text-xl font-bold mt-8 mb-2">Command Module</h4>
            <p className="text-aura-muted text-center max-w-xs">A unified interface for instant PTT and active frequency visualization.</p>
          </div>

          <div className="flex flex-col items-center md:mt-24">
            <div className="relative w-[200px] h-[200px] bg-black border-[12px] border-aura-border rounded-full overflow-hidden shadow-2xl shadow-glow-active flex items-center justify-center">
              {/* Replace with actual image later */}
              <Image 
                src="/aura-wear.png" 
                alt="AURA Wear OS Interface" 
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <h4 className="text-xl font-bold mt-8 mb-2">Wear OS Companion</h4>
            <p className="text-aura-muted text-center max-w-[200px]">Trigger transmission seamlessly from your wrist.</p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-aura-border bg-black py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-aura-active"></div>
            <span className="font-bold tracking-[2px]">AURA</span>
          </div>
          
          <div className="flex gap-6 text-sm text-aura-muted font-medium">
            <a href="https://github.com/DoonMad/AURA" target="_blank" rel="noreferrer" className="hover:text-aura-text transition-colors">Source Code</a>
            <a href="https://github.com/DoonMad/AURA/releases/latest" className="hover:text-aura-text transition-colors">Releases</a>
          </div>
          
          <div className="text-xs text-aura-muted/50">
            Powered by React Native, Node.js & Mediasoup.
          </div>
        </div>
      </footer>
    </main>
  );
}
