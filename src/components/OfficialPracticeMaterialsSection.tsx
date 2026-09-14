import React from "react";
import { ArrowUpRight, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface MaterialItem {
  id: string;
  year: string;
  month: string;
  monthColor: string; // pill background color
  title: string;
  rating: number;
  votes: string;
  isNewYear?: boolean;
}

const practiceMaterials: MaterialItem[] = [
  {
    id: "2025-dec",
    year: "2025",
    month: "December",
    monthColor: "bg-[#e2822a]",
    title: "IELTS Mock Test 2025 December",
    rating: 3.7,
    votes: "428 votes"
  },
  {
    id: "2025-nov",
    year: "2025",
    month: "November",
    monthColor: "bg-[#e2822a]",
    title: "IELTS Mock Test 2025 November",
    rating: 3.4,
    votes: "210 votes"
  },
  {
    id: "2025-oct",
    year: "2025",
    month: "October",
    monthColor: "bg-[#e2822a]",
    title: "IELTS Mock Test 2025 October",
    rating: 2.9,
    votes: "337 votes"
  },
  {
    id: "2026-jan",
    year: "2026",
    month: "January",
    monthColor: "bg-[#d96b75]",
    title: "IELTS Mock Test 2026 January",
    rating: 3.6,
    votes: "1,326 votes",
    isNewYear: true
  }
];

export default function OfficialPracticeMaterialsSection() {
  const navigate = useNavigate();

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 fill-[#f59e0b] text-[#f59e0b]" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 fill-[#f59e0b]/60 text-[#f59e0b]" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 text-slate-300" />
        );
      }
    }
    return stars;
  };

  return (
    <section className="w-full bg-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto space-y-10 text-center">
        
        {/* Section Heading */}
        <div className="space-y-2 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-[#1e293b] leading-tight">
            2026 Official <span className="text-[#00a8cc]">IELTS Practice Materials</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Boost Your Preparation with Real Test Questions & Mock Exams
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
          {practiceMaterials.map((item) => (
            <Link
              key={item.id}
              to="/mock-tests"
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_18px_40px_rgba(0,168,204,0.12)] hover:border-cyan-200 transition-all duration-300 flex flex-col justify-between cursor-pointer group block text-left"
            >
              {/* Graphic Mock Test Poster Container */}
              <div className="relative w-full aspect-square rounded-2xl bg-[#142334] overflow-hidden p-5 flex flex-col justify-between text-left text-white shadow-md group-hover:scale-[1.02] transition-transform duration-300">
                
                {/* Background Geometric Accent Waves */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1b2f46] via-[#111c2a] to-[#0c141f] pointer-events-none" />
                <div className="absolute -bottom-8 -right-8 w-36 h-36 border-[12px] border-cyan-500/20 rounded-full pointer-events-none" />
                <div className="absolute top-1/2 -left-10 w-32 h-32 border-[8px] border-amber-500/20 rounded-full pointer-events-none" />

                {/* Poster Top Row: IOT Logo */}
                <div className="relative z-10 flex justify-end">
                  <div className="flex items-center gap-1 bg-slate-900/40 backdrop-blur-xs px-2 py-1 rounded-lg border border-white/10">
                    <span className="text-[10px] font-black tracking-widest text-cyan-400">iot</span>
                    <span className="text-[8px] text-slate-300 font-bold uppercase">ielts online tests</span>
                  </div>
                </div>

                {/* Poster Middle Content */}
                <div className="relative z-10 my-auto space-y-1">
                  <div className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none text-white">
                    IELTS
                  </div>
                  <div className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-200">
                    MOCK TEST
                  </div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>{item.year}</span>
                    
                    {/* Month Pill Badge on Poster */}
                    {!item.isNewYear ? (
                      <span className={`text-[10px] sm:text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${item.monthColor} text-white shadow-sm`}>
                        {item.month}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Poster Bottom Content for New Year (e.g., January circular badge) */}
                {item.isNewYear && (
                  <div className="relative z-10 flex justify-end pt-2">
                    <div className="w-16 h-16 rounded-full bg-[#d96b75] flex items-center justify-center text-white font-extrabold text-xs uppercase tracking-wider shadow-lg transform rotate-[-6deg] border border-white/20">
                      {item.month}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Bottom Details */}
              <div className="pt-4 space-y-2 text-center">
                <h3 className="text-sm font-bold text-slate-700 group-hover:text-[#00a8cc] transition-colors leading-snug">
                  {item.title}
                </h3>

                {/* Rating & Votes Row */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span className="font-bold text-amber-600">{item.rating}</span>
                  <div className="flex items-center gap-0.5">
                    {renderStars(item.rating)}
                  </div>
                  <span className="text-[11px] text-slate-400">({item.votes})</span>
                </div>
              </div>

            </Link>
          ))}
        </div>

        {/* Explore More Button */}
        <div className="flex justify-center pt-2">
          <Link
            to="/mock-tests"
            className="bg-[#202e43] hover:bg-[#152030] text-white font-black text-xs tracking-wider uppercase pl-6 pr-1.5 py-1.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-3 cursor-pointer group"
          >
            <span>EXPLORE MORE</span>
            <div className="w-7 h-7 rounded-full bg-[#497cb5] group-hover:bg-[#3b6aa3] flex items-center justify-center text-white transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

      </div>
    </section>
  );
}
