import React from "react";
import { ArrowUpRight } from "lucide-react";

export default function WorldwideReviewsGlobeSection() {
  // Student avatars & flag badges data
  const orbitItemsRing1 = [
    {
      flag: "https://flagcdn.com/w40/kr.png",
      name: "Korea",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    },
    {
      flag: "https://flagcdn.com/w40/lk.png",
      name: "Sri Lanka",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    },
    {
      flag: "https://flagcdn.com/w40/th.png",
      name: "Thailand",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
    },
    {
      flag: "https://flagcdn.com/w40/es.png",
      name: "Spain",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
    },
  ];

  const orbitItemsRing2 = [
    {
      flag: "https://flagcdn.com/w40/in.png",
      name: "India",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    },
    {
      flag: "https://flagcdn.com/w40/la.png",
      name: "Laos",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
    },
    {
      flag: "https://flagcdn.com/w40/ws.png",
      name: "Samoa",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80",
    },
    {
      flag: "https://flagcdn.com/w40/vn.png",
      name: "Vietnam",
      avatar: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=120&q=80",
    },
  ];

  return (
    <section className="relative w-full bg-white py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 overflow-hidden">
      
      {/* CSS Keyframes for Left-to-Right Globe Rotation & Multi-directional Orbits */}
      <style>{`
        @keyframes globeSpinLTR {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbitNWtoSE {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes counterNWtoSE {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes orbitWtoS {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes counterWtoS {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbitEquator {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes counterEquator {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        .animate-globe-ltr {
          animation: globeSpinLTR 45s linear infinite;
        }
        .animate-orbit-nw-se {
          animation: orbitNWtoSE 30s linear infinite;
        }
        .animate-counter-nw-se {
          animation: counterNWtoSE 30s linear infinite;
        }
        .animate-orbit-w-s {
          animation: orbitWtoS 38s linear infinite;
        }
        .animate-counter-w-s {
          animation: counterWtoS 38s linear infinite;
        }
        .animate-orbit-equator {
          animation: orbitEquator 28s linear infinite;
        }
        .animate-counter-equator {
          animation: counterEquator 28s linear infinite;
        }
      `}</style>

      {/* Main Container */}
      <div className="relative max-w-5xl mx-auto min-h-[460px] sm:min-h-[520px] flex flex-col justify-between items-center text-center">
        
        {/* CENTER BACKGROUND: Rotating Wireframe Globe */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          
          {/* Globe Wireframe Sphere Container */}
          <div className="relative w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] md:w-[560px] md:h-[560px]">
            
            {/* Rotating SVG Grid (Left to Right Rotation) */}
            <svg
              className="w-full h-full text-[#00a8cc]/35 animate-globe-ltr"
              viewBox="0 0 500 500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              {/* Outer boundary circle */}
              <circle cx="250" cy="250" r="240" stroke="currentColor" strokeWidth="1.5" />

              {/* Latitude Parallels */}
              <ellipse cx="250" cy="250" rx="240" ry="40" />
              <ellipse cx="250" cy="250" rx="240" ry="90" />
              <ellipse cx="250" cy="250" rx="240" ry="140" />
              <ellipse cx="250" cy="250" rx="240" ry="190" />

              {/* Longitude Meridians */}
              <ellipse cx="250" cy="250" rx="40" ry="240" />
              <ellipse cx="250" cy="250" rx="90" ry="240" />
              <ellipse cx="250" cy="250" rx="140" ry="240" />
              <ellipse cx="250" cy="250" rx="190" ry="240" />

              {/* Diagonal Meridian Lines for 3D depth */}
              <line x1="250" y1="10" x2="250" y2="490" strokeDasharray="3 3" />
              <line x1="10" y1="250" x2="490" y2="250" strokeDasharray="3 3" />
            </svg>

            {/* ORBIT RING 1: North-West to South-East Tilted Track */}
            <div className="absolute inset-0 flex items-center justify-center transform rotate-[-32deg]">
              <div className="w-[112%] h-[38%] rounded-[100%] border-2 border-dashed border-[#00a8cc]/40 animate-orbit-nw-se relative">
                
                {/* Orbit Item 1A - Korea */}
                <div className="absolute -top-4 left-[15%] animate-counter-nw-se flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-full shadow-md border border-cyan-100">
                  <img src={orbitItemsRing1[0].avatar} className="w-7 h-7 rounded-full object-cover" alt="Student" />
                  <img src={orbitItemsRing1[0].flag} className="w-5 h-3.5 rounded-xs object-cover border" alt="Korea" />
                </div>

                {/* Orbit Item 1B - Sri Lanka */}
                <div className="absolute top-[40%] right-[-10px] animate-counter-nw-se flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-full shadow-md border border-cyan-100">
                  <img src={orbitItemsRing1[1].flag} className="w-5 h-3.5 rounded-xs object-cover border" alt="Sri Lanka" />
                  <img src={orbitItemsRing1[1].avatar} className="w-7 h-7 rounded-full object-cover" alt="Student" />
                </div>

                {/* Orbit Item 1C - Thailand */}
                <div className="absolute -bottom-4 left-[45%] animate-counter-nw-se flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-full shadow-md border border-cyan-100">
                  <img src={orbitItemsRing1[2].flag} className="w-5 h-3.5 rounded-xs object-cover border" alt="Thailand" />
                  <img src={orbitItemsRing1[2].avatar} className="w-7 h-7 rounded-full object-cover" alt="Student" />
                </div>

                {/* Orbit Item 1D - Spain */}
                <div className="absolute top-[60%] left-[-15px] animate-counter-nw-se flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-full shadow-md border border-cyan-100">
                  <img src={orbitItemsRing1[3].flag} className="w-5 h-3.5 rounded-xs object-cover border" alt="Spain" />
                </div>

              </div>
            </div>

            {/* ORBIT RING 2: West to South Tilted Track */}
            <div className="absolute inset-0 flex items-center justify-center transform rotate-[28deg]">
              <div className="w-[118%] h-[36%] rounded-[100%] border-2 border-dashed border-[#00a8cc]/30 animate-orbit-w-s relative">
                
                {/* Orbit Item 2A - India */}
                <div className="absolute top-[-10px] right-[25%] animate-counter-w-s flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-full shadow-md border border-cyan-100">
                  <img src={orbitItemsRing2[0].flag} className="w-5 h-3.5 rounded-xs object-cover border" alt="India" />
                </div>

                {/* Orbit Item 2B - Laos */}
                <div className="absolute bottom-[-10px] right-[15%] animate-counter-w-s flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-full shadow-md border border-cyan-100">
                  <img src={orbitItemsRing2[1].avatar} className="w-7 h-7 rounded-full object-cover" alt="Student" />
                  <img src={orbitItemsRing2[1].flag} className="w-5 h-3.5 rounded-xs object-cover border" alt="Laos" />
                </div>

                {/* Orbit Item 2C - Samoa */}
                <div className="absolute top-[35%] left-[-20px] animate-counter-w-s flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-full shadow-md border border-cyan-100">
                  <img src={orbitItemsRing2[2].flag} className="w-5 h-3.5 rounded-xs object-cover border" alt="Samoa" />
                  <img src={orbitItemsRing2[2].avatar} className="w-7 h-7 rounded-full object-cover" alt="Student" />
                </div>

                {/* Orbit Item 2D - Vietnam */}
                <div className="absolute bottom-[20%] left-[30%] animate-counter-w-s flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-full shadow-md border border-cyan-100">
                  <img src={orbitItemsRing2[3].avatar} className="w-7 h-7 rounded-full object-cover" alt="Student" />
                </div>

              </div>
            </div>

            {/* ORBIT RING 3: Equatorial Track */}
            <div className="absolute inset-0 flex items-center justify-center transform rotate-[-8deg]">
              <div className="w-[108%] h-[42%] rounded-[100%] border border-dotted border-[#00a8cc]/25 animate-orbit-equator relative">
                <div className="absolute top-[10%] left-[10%] animate-counter-equator flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-full shadow-xs border border-cyan-100">
                  <img src="https://flagcdn.com/w40/gb.png" className="w-5 h-3.5 rounded-xs object-cover border" alt="UK" />
                </div>
                <div className="absolute bottom-[10%] right-[10%] animate-counter-equator flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-full shadow-xs border border-cyan-100">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format,compress&fm=webp&w=120&q=80"
                    className="w-7 h-7 rounded-full object-cover"
                    alt="Student"
                    loading="lazy"
                    decoding="async"
                    width={28}
                    height={28}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* FOREGROUND CENTER TEXT CONTENT */}
        <div className="relative z-20 my-auto py-12 px-4 space-y-4 max-w-2xl mx-auto backdrop-blur-[1px]">
          
          {/* Main Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-light tracking-normal text-slate-700 leading-tight">
            Millions of <span className="text-[#00a8cc] font-normal">positive reviews</span><br />
            from learners worldwide
          </h2>

          {/* Subtitle flanked with Teal Lines */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="hidden sm:block h-[2px] w-12 bg-gradient-to-r from-transparent to-[#00a8cc]" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg leading-relaxed">
              Inspired by the recognition of millions of learners worldwide, spanning over 120 countries
            </p>
            <div className="hidden sm:block h-[2px] w-12 bg-gradient-to-l from-transparent to-[#00a8cc]" />
          </div>

        </div>

        {/* BOTTOM SOCIAL CTA BUTTONS */}
        <div className="relative z-20 flex flex-wrap justify-center items-center gap-4 sm:gap-6 pt-4">
          
          {/* TikTok CTA */}
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit SEB's Institute on TikTok"
            className="bg-[#202e43] hover:bg-[#152030] text-white font-black text-xs sm:text-sm tracking-wider uppercase pl-6 pr-1.5 py-1.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-3 cursor-pointer group"
          >
            <span>TIKTOK</span>
            <div className="w-7 h-7 rounded-full bg-[#497cb5] group-hover:bg-[#3b6aa3] flex items-center justify-center text-white transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </a>

          {/* Facebook CTA */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit SEB's Institute on Facebook"
            className="bg-[#202e43] hover:bg-[#152030] text-white font-black text-xs sm:text-sm tracking-wider uppercase pl-6 pr-1.5 py-1.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-3 cursor-pointer group"
          >
            <span>FACEBOOK</span>
            <div className="w-7 h-7 rounded-full bg-[#497cb5] group-hover:bg-[#3b6aa3] flex items-center justify-center text-white transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </a>

          {/* YouTube CTA */}
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit SEB's Institute on YouTube"
            className="bg-[#202e43] hover:bg-[#152030] text-white font-black text-xs sm:text-sm tracking-wider uppercase pl-6 pr-1.5 py-1.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-3 cursor-pointer group"
          >
            <span>YOUTUBE</span>
            <div className="w-7 h-7 rounded-full bg-[#497cb5] group-hover:bg-[#3b6aa3] flex items-center justify-center text-white transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </a>

        </div>

      </div>
    </section>
  );
}
