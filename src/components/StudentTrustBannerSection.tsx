import React from "react";

export default function StudentTrustBannerSection() {
  // Array of diverse student photo avatars for the dense background collage grid (Optimized WebP images)
  const studentPhotos = [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format,compress&fm=webp&w=200&q=75",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format,compress&fm=webp&w=200&q=75",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format,compress&fm=webp&w=200&q=75",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format,compress&fm=webp&w=200&q=75",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format,compress&fm=webp&w=200&q=75",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format,compress&fm=webp&w=200&q=75",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format,compress&fm=webp&w=200&q=75",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format,compress&fm=webp&w=200&q=75",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format,compress&fm=webp&w=200&q=75",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format,compress&fm=webp&w=200&q=75",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format,compress&fm=webp&w=200&q=75",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format,compress&fm=webp&w=200&q=75",
  ];

  const gridItems = Array.from({ length: 48 }).map((_, idx) => {
    // Pre-calculated shuffled indices to ensure a truly random-looking mosaic without vertical repeats
    const shuffledIndices = [
      2, 7, 4, 11, 0, 9, 3, 8, 1, 10, 5, 6,
      9, 1, 10, 5, 6, 2, 7, 4, 11, 0, 8, 3,
      5, 11, 2, 8, 10, 1, 0, 6, 9, 3, 7, 4,
      1, 4, 8, 0, 3, 11, 6, 2, 10, 7, 5, 9,
    ];
    return (
      <div key={idx} className="w-full h-full min-h-[55px] sm:min-h-[75px] overflow-hidden bg-slate-200">
        <img
          src={studentPhotos[shuffledIndices[idx] % studentPhotos.length]}
          alt="IELTS Band 8.5 student candidate"
          loading="lazy"
          decoding="async"
          width={150}
          height={75}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  });

  return (
    <section 
      aria-label="Student Success & Community" 
      className="relative w-full overflow-hidden bg-slate-100 py-10 sm:py-16 border-b border-slate-200"
    >
      <style>{`
        @keyframes slideLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-slide-left {
          animation: slideLeft 60s linear infinite;
        }
      `}</style>

      {/* 1. Background Student Photo Mosaic Matrix (Vivid, natural colors) */}
      <div className="absolute inset-y-0 left-0 flex w-[200%] pointer-events-none select-none animate-slide-left">
        {/* Grid 1 */}
        <div className="w-1/2 grid grid-cols-6 sm:grid-cols-12 auto-rows-fr gap-0.5 sm:gap-1 h-full pr-0.5 sm:pr-1">
          {gridItems}
        </div>
        {/* Grid 2 (Duplicate for seamless loop) */}
        <div className="w-1/2 grid grid-cols-6 sm:grid-cols-12 auto-rows-fr gap-0.5 sm:gap-1 h-full">
          {gridItems.map((item, i) => React.cloneElement(item, { key: `dup-${i}` }))}
        </div>
      </div>

      {/* 2. SVG Masked White Translucent Overlay (Cuts out 35,000,000+ to reveal images inside text) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 1000 240"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <mask id="text-transparent-cutout">
            {/* White rect keeps the translucent overlay visible on surrounding background */}
            <rect x="0" y="0" width="1000" height="240" fill="white" />
            {/* Black text cuts out a transparent hole through the overlay */}
            <text
              x="500"
              y="105"
              textAnchor="middle"
              dominantBaseline="central"
              fill="black"
              fontSize="100"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="-1px"
            >
              34 Thousand +
            </text>
          </mask>
        </defs>
        
        {/* Semi-transparent white overlay with the cutout mask applied */}
        <rect
          x="0"
          y="0"
          width="1000"
          height="240"
          fill="#ffffff"
          fillOpacity="0.82"
          mask="url(#text-transparent-cutout)"
        />
      </svg>

      {/* 3. HTML Foreground Subtitle Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center justify-center pt-24 sm:pt-28">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[#1a365d] tracking-tight py-1 inline-block">
          Students Trust SEB's Institute for IELTS &amp; English
        </h2>
      </div>
    </section>
  );
}
