import React from "react";
import { ArrowUpRight, BookOpen, Mic, FileText, CheckCircle2, Sparkles, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import OptimizedImage from "@/src/components/ui/OptimizedImage";

interface ResourceCardProps {
  category: string;
  categoryColor: string;
  imageSrc: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  stat1Label: string;
  stat1Value: string;
  stat2Label: string;
  stat2Value: string;
  stat3Label: string;
  stat3Value: string;
  ctaText: string;
  ctaLink: string;
}

const resourcesData: ResourceCardProps[] = [
  {
    category: "Writing Task 1 & 2",
    categoryColor: "bg-[#ff8a00]",
    imageSrc: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format,compress&fm=webp&w=400&q=75",
    title: "Band 8 Writing Essay Templates & Model Answers",
    description: "Master Task 1 graphs, maps, diagrams and Task 2 opinion, discussion, and problem-solution essays with scoring breakdowns.",
    badge: "BAND 8.5+",
    badgeColor: "bg-[#fef3c7] text-[#92400e] border-amber-200/80",
    stat1Label: "Templates",
    stat1Value: "50+ Models",
    stat2Label: "Format",
    stat2Value: "Acad & GT",
    stat3Label: "Access",
    stat3Value: "Full Guide",
    ctaText: "EXPLORE WRITING",
    ctaLink: "/courses"
  },
  {
    category: "Speaking Simulator",
    categoryColor: "bg-[#e11d48]",
    imageSrc: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format,compress&fm=webp&w=400&q=75",
    title: "Part 1, 2 & 3 Speaking Cue Cards & Fluency Drills",
    description: "Latest 2026 examination cue cards, sample high-band audio recordings, vocabulary boosters, and examiner idioms.",
    badge: "2026 TOPICS",
    badgeColor: "bg-[#fce7f3] text-[#9d174d] border-pink-200/80",
    stat1Label: "Practice Tests",
    stat1Value: "40+ Tests",
    stat2Label: "Skill Focus",
    stat2Value: "Fluency & Lexis",
    stat3Label: "Level",
    stat3Value: "All Bands",
    ctaText: "PRACTICE SPEAKING",
    ctaLink: "/courses"
  },
  {
    category: "Mock Exam Suite",
    categoryColor: "bg-[#00a8cc]",
    imageSrc: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format,compress&fm=webp&w=400&q=75",
    title: "Full-Length Authentic IELTS Practice Mock Tests",
    description: "Timed computerized tests with instant band scoring, detailed answer keys, audio transcripts, and performance analytics.",
    badge: "INSTANT SCORE",
    badgeColor: "bg-[#e0f2fe] text-[#0369a1] border-sky-200/80",
    stat1Label: "Practice Tests",
    stat1Value: "40+ Tests",
    stat2Label: "Timing",
    stat2Value: "Real Exam",
    stat3Label: "Feedback",
    stat3Value: "Instant Band",
    ctaText: "START FREE TEST",
    ctaLink: "/mock-tests"
  }
];

export default function LiveLessonsSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto space-y-10 text-center">
        
        {/* Header Title Section */}
        <div className="space-y-2 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#1e293b] leading-snug">
            Explore Our <span className="text-[#00a8cc]">IELTS Learning Resources</span>
          </h2>
          
          {/* Subtitle with Teal Accent Flanks */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="hidden sm:block h-[2px] w-12 bg-gradient-to-r from-transparent to-[#00a8cc]" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl">
              Build your IELTS skills with practical resources, expert guidance, and tools designed to help you prepare with confidence.
            </p>
            <div className="hidden sm:block h-[2px] w-12 bg-gradient-to-l from-transparent to-[#00a8cc]" />
          </div>
        </div>

        {/* 3 Learning Resource Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch max-w-6xl mx-auto">
          {resourcesData.map((resource, idx) => (
            <div
              key={idx}
              className="bg-white rounded-[24px] border border-slate-200/90 shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(0,168,204,0.12)] transition-all duration-300 flex flex-col justify-between overflow-hidden text-left relative group hover:-translate-y-1"
            >
              {/* Category Pill Tag */}
              <div
                className={`absolute top-0 left-0 ${resource.categoryColor} text-white font-extrabold text-xs px-4 py-1.5 rounded-tl-[22px] rounded-br-[16px] shadow-sm tracking-wide z-10`}
              >
                {resource.category}
              </div>

              {/* Card Image */}
              <div className="relative h-[180px] w-full overflow-hidden bg-slate-100 aspect-[19/9]">
                <OptimizedImage
                  src={resource.imageSrc}
                  alt={resource.title}
                  width={380}
                  height={180}
                  aspectRatio="19/9"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 aspect-[19/9]"
                />
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                
                {/* Title & Description */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-[#00a8cc] transition-colors leading-snug line-clamp-2">
                      {resource.title}
                    </h3>
                    <span className={`text-[10px] shrink-0 font-black uppercase px-2.5 py-1 rounded-full border shadow-2xs ${resource.badgeColor}`}>
                      {resource.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                    {resource.description}
                  </p>
                </div>

                {/* Divider Line */}
                <div className="border-t border-slate-100/80 pt-2" />

                {/* Resource Metrics / Highlights Grid */}
                <div className="grid grid-cols-3 text-center gap-1 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                  {/* Stat 1 */}
                  <div>
                    <div className="text-xs sm:text-[13px] font-extrabold text-slate-800">
                      {resource.stat1Value}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      {resource.stat1Label}
                    </div>
                  </div>

                  {/* Stat 2 */}
                  <div className="border-x border-slate-200/60">
                    <div className="text-xs sm:text-[13px] font-extrabold text-slate-800">
                      {resource.stat2Value}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      {resource.stat2Label}
                    </div>
                  </div>

                  {/* Stat 3 */}
                  <div>
                    <div className="text-xs sm:text-[13px] font-extrabold text-slate-800">
                      {resource.stat3Value}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      {resource.stat3Label}
                    </div>
                  </div>
                </div>

                {/* Action CTA Button */}
                <div className="pt-1">
                  <Link
                    to={resource.ctaLink}
                    className="w-full bg-[#1e9ba8] hover:bg-[#16828e] text-white font-black text-xs tracking-wider uppercase py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{resource.ctaText}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Explore More Bottom Button */}
        <div className="flex justify-center pt-2">
          <Link
            to="/courses"
            className="bg-[#202e43] hover:bg-[#152030] text-white font-black text-xs tracking-wider uppercase pl-6 pr-1.5 py-1.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-3 group cursor-pointer"
          >
            <span>EXPLORE ALL RESOURCES</span>
            <div className="w-7 h-7 rounded-full bg-[#497cb5] group-hover:bg-[#3b6aa3] flex items-center justify-center text-white transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

      </div>
    </section>
  );
}

