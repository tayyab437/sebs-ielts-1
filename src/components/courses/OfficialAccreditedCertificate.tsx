import React from "react";
import { 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Star,
  GraduationCap
} from "lucide-react";

export interface CertificateData {
  id: string;
  courseTitle: string;
  studentName: string;
  issueDate: string;
  targetBand?: string;
  category?: string;
}

interface OfficialAccreditedCertificateProps {
  certificate: CertificateData;
  className?: string;
}

// Red SEB Logo URL requested by user
const SEB_RED_LOGO_URL = "https://i.ibb.co/gMgHC2YQ/01-logo-curve63-3.png";
const FALLBACK_LOGO_URL = typeof window !== "undefined" ? (localStorage.getItem("site_logo_url") || "https://i.ibb.co/Xxg75WQc/image-1.jpg") : "https://i.ibb.co/Xxg75WQc/image-1.jpg";

export default function OfficialAccreditedCertificate({
  certificate,
  className = ""
}: OfficialAccreditedCertificateProps) {
  const {
    id,
    courseTitle,
    studentName,
    issueDate,
    targetBand = "Band 8.0 - 9.0 (Expert Level)"
  } = certificate;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl bg-[#fffdfa] text-[#1e293b] p-6 sm:p-10 md:p-12 shadow-2xl border-[10px] sm:border-[12px] border-[#991b1b] print:border-[8px] print:m-0 print:p-8 print:shadow-none print:bg-white select-none ${className}`}
      style={{
        boxShadow: "0 25px 50px -12px rgba(153, 27, 27, 0.3), inset 0 0 40px rgba(185, 28, 28, 0.08)",
        fontFamily: "'Playfair Display', Georgia, serif"
      }}
    >
      {/* Outer Crimson Guilloche-Inspired Inner Borders */}
      <div className="absolute inset-2 sm:inset-3 rounded-2xl border-2 border-[#dc2626]/70 pointer-events-none" />
      <div className="absolute inset-3 sm:inset-4 rounded-xl border border-dashed border-[#b91c1c]/50 pointer-events-none" />

      {/* Decorative Red & Gold Corner Filigrees */}
      <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-[#b91c1c] rounded-tl-lg pointer-events-none" />
      <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-[#b91c1c] rounded-tr-lg pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-[#b91c1c] rounded-bl-lg pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-[#b91c1c] rounded-br-lg pointer-events-none" />

      {/* Background Red Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
        <img 
          src={SEB_RED_LOGO_URL} 
          alt="SEB Watermark" 
          className="w-[440px] h-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_LOGO_URL;
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-5">
        
        {/* TOP BRANDING: OFFICIAL RED LOGO & HEADER */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-3">
            <img 
              src={SEB_RED_LOGO_URL} 
              alt="SEB's International Institute Logo" 
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm filter"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_LOGO_URL;
              }}
            />
          </div>

          <div className="space-y-0.5">
            <p className="font-sans text-[11px] sm:text-xs font-black tracking-[0.22em] text-[#991b1b]">
              SEB's INTERNATIONAL INSTITUTE FOR IELTS & FOREIGN LANGUAGES
            </p>
            <div className="flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-sans font-bold uppercase tracking-widest text-[#b91c1c]/80">
              <span>ISO 9001:2015 Certified</span>
              <span>&bull;</span>
              <span>Global IELTS Mastery Board</span>
              <span>&bull;</span>
              <span>Accredited Academic Authority</span>
            </div>
          </div>
        </div>

        {/* TITLE SECTION WITH RED THEMED BADGE */}
        <div className="space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b] text-[10px] sm:text-xs font-sans font-black uppercase tracking-widest shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#dc2626]" />
            <span>OFFICIAL ACCREDITED CREDENTIAL</span>
            <Sparkles className="w-3.5 h-3.5 text-[#dc2626]" />
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-wide text-[#7f1d1d] drop-shadow-xs">
            Certificate of Completion
          </h1>
          
          <p className="text-xs sm:text-sm font-sans italic text-[#57534e]">
            This is proudly and officially awarded to
          </p>
        </div>

        {/* CANDIDATE NAME */}
        <div className="py-2 w-full max-w-xl">
          <div className="relative inline-block px-8 sm:px-14 py-2 border-b-2 border-[#b91c1c]">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#991b1b] font-serif capitalize drop-shadow-xs">
              {studentName || "IELTS Candidate"}
            </h2>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#b91c1c]" />
          </div>
        </div>

        {/* RECOGNITION TEXT */}
        <div className="max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed text-[#44403c] font-sans px-2">
          for successfully completing all curriculum standards, intensive modules, and verified evaluations for the accredited program:
          
          <div className="mt-2 text-base sm:text-xl font-serif font-black text-[#7f1d1d] tracking-wide">
            "{courseTitle}"
          </div>
          
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs text-[#991b1b] font-bold">
            <span className="px-3 py-0.5 rounded-md bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]">
              Certified Level: {targetBand}
            </span>
            <span className="px-3 py-0.5 rounded-md bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#059669]" />
              Authenticity Verified
            </span>
          </div>
        </div>

        {/* FOOTER: FOUNDER SYED EJAZ BUKHARI SIGNATURE, RED WAX SEAL & CHIEF EXAMINER */}
        <div className="w-full pt-6 sm:pt-8 mt-4 border-t-2 border-[#fecaca] grid grid-cols-3 items-end gap-2 sm:gap-4 font-sans text-left">
          
          {/* Left: Founder Signature - Syed Ejaz Bukhari */}
          <div className="flex flex-col items-start space-y-1">
            <div className="h-9 sm:h-11 flex items-end">
              <span className="font-serif italic font-black text-lg sm:text-2xl text-[#7f1d1d] tracking-wider transform -rotate-3 select-none">
                Syed Ejaz Bukhari
              </span>
            </div>
            <div className="w-36 sm:w-48 h-0.5 bg-[#b91c1c]/70" />
            <div className="text-[11px] sm:text-xs font-black text-[#7f1d1d]">
              Syed Ejaz Bukhari
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold text-[#991b1b]">
              Founder & Director General
            </div>
            <div className="text-[9px] text-[#78716c]">
              SEB's International Institute
            </div>
            <div className="text-[9px] font-mono text-[#a8a29e] pt-0.5">
              Date: {issueDate}
            </div>
          </div>

          {/* Center: High-Prestige Gold & Crimson Embossed Official Academic Seal */}
          <div className="flex flex-col items-center justify-center -my-2 sm:-my-3">
            <div className="relative flex flex-col items-center group">
              {/* Premium Dual Satin Silk Ribbons with V-Notch Tails */}
              <div className="absolute -bottom-7 sm:-bottom-8 flex justify-center items-start gap-1 pointer-events-none z-0">
                {/* Left Ribbon */}
                <div 
                  className="w-4 sm:w-5 h-9 sm:h-11 bg-gradient-to-b from-[#7f1d1d] via-[#991b1b] to-[#581313] -rotate-[14deg] shadow-md relative overflow-hidden"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
                    filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))"
                  }}
                >
                  <div className="absolute inset-y-0 left-0.5 w-0.5 bg-amber-400/40" />
                  <div className="absolute inset-y-0 right-0.5 w-0.5 bg-amber-400/40" />
                </div>

                {/* Right Ribbon */}
                <div 
                  className="w-4 sm:w-5 h-9 sm:h-11 bg-gradient-to-b from-[#991b1b] via-[#7f1d1d] to-[#450a0a] rotate-[14deg] shadow-md relative overflow-hidden"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
                    filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))"
                  }}
                >
                  <div className="absolute inset-y-0 left-0.5 w-0.5 bg-amber-400/40" />
                  <div className="absolute inset-y-0 right-0.5 w-0.5 bg-amber-400/40" />
                </div>
              </div>

              {/* Master Embossed Rosette Medallion */}
              <div 
                className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center p-1 transition-transform duration-300 group-hover:scale-105 select-none"
                style={{
                  background: "radial-gradient(circle at 35% 25%, #fef08a 0%, #d97706 35%, #92400e 70%, #451a03 100%)",
                  boxShadow: "0 8px 20px -3px rgba(120, 20, 20, 0.45), 0 4px 10px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.6)"
                }}
              >
                {/* 24-Point Gold Starburst Rosette Ring SVG */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                    {/* Outer Scalloped Rosette Teeth */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="46" 
                      fill="none" 
                      stroke="#fbbf24" 
                      strokeWidth="2.5" 
                      strokeDasharray="2.8 2.2" 
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="42.5" 
                      fill="none" 
                      stroke="#78350f" 
                      strokeWidth="0.8" 
                    />
                  </svg>
                </div>

                {/* Inner Crimson Velvet Ring with Gold Inscribed Boundary */}
                <div 
                  className="w-[90%] h-[90%] rounded-full flex flex-col items-center justify-center p-1.5 relative overflow-hidden text-center"
                  style={{
                    background: "radial-gradient(circle at 40% 30%, #b91c1c 0%, #881337 50%, #4c0519 100%)",
                    boxShadow: "inset 0 3px 6px rgba(0,0,0,0.6), inset 0 -2px 5px rgba(251, 191, 36, 0.35), 0 0 0 1.5px #f59e0b"
                  }}
                >
                  {/* Subtle Circular Radial Glow */}
                  <div className="absolute inset-0 bg-radial from-amber-400/20 via-transparent to-transparent pointer-events-none" />

                  {/* Top Text Arc Badge */}
                  <div className="flex items-center justify-center gap-1 text-[5.5px] sm:text-[6.5px] font-black uppercase tracking-wider text-amber-200 drop-shadow-sm">
                    <span className="text-amber-400 text-[6px]">★</span>
                    <span>OFFICIAL SEAL</span>
                    <span className="text-amber-400 text-[6px]">★</span>
                  </div>

                  {/* Center Emblem Logo & Crest */}
                  <div className="my-0.5 relative flex items-center justify-center">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-amber-50 to-amber-100 p-1 border border-amber-300/80 flex items-center justify-center shadow-inner">
                      <img 
                        src={SEB_RED_LOGO_URL} 
                        alt="SEB Institute Crest" 
                        className="w-full h-full object-contain filter drop-shadow-xs"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_LOGO_URL;
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom Quality Ribbon Legend */}
                  <div className="text-[5px] sm:text-[6px] font-black tracking-widest text-amber-100 uppercase drop-shadow-sm leading-tight flex items-center gap-0.5">
                    <span>ACCREDITED</span>
                    <span className="text-amber-400">&bull;</span>
                    <span>VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Academic Dean / Chief Examiner */}
          <div className="flex flex-col items-end space-y-1 text-right">
            <div className="h-9 sm:h-11 flex items-end justify-end">
              <span className="font-serif italic font-bold text-lg sm:text-2xl text-[#1e293b] tracking-wider transform rotate-1 select-none">
                Dr. R. Al-Mansoor
              </span>
            </div>
            <div className="w-36 sm:w-48 h-0.5 bg-[#b91c1c]/70" />
            <div className="text-[11px] sm:text-xs font-bold text-[#1c1917]">
              Chief IELTS Examiner
            </div>
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#78716c]">
              <span>Registration No:</span>
              <strong className="font-mono text-[#991b1b] font-bold">{id}</strong>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-[8px] sm:text-[9px] font-bold">
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>ACCREDITED RECORD</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
