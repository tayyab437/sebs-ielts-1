import React from "react";
import { ArrowUpRight, Sparkles, PieChart, Star, Lightbulb, Video, Award, Layers, Headphones, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function SixStepsSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="flex items-center justify-center gap-3 text-center sm:text-left">
          {/* Big "6" Number with vertical "steps" text */}
          <div className="flex items-center gap-2">
            <span className="text-7xl sm:text-8xl md:text-[96px] font-black text-[#1e293b] leading-none tracking-tighter">
              6
            </span>
            <span className="text-xs sm:text-sm font-black uppercase text-slate-400 tracking-widest [writing-mode:vertical-lr] rotate-180">
              steps
            </span>
          </div>

          {/* Heading Text */}
          <div>
            <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-[#1e293b] tracking-tight leading-tight">
              to <span className="text-[#00a8cc]">Achieve</span> <br />
              <span className="text-[#00a8cc]">Your IELTS Goal</span>
            </h2>
          </div>
        </div>

        {/* 6 Cards 3x2 Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
          {/* CARD 01: Placement Test */}
          <article className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-200 relative overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-full border-2 border-[#4AB6C3] text-[#4AB6C3] flex items-center justify-center text-xl font-bold">
                01
              </div>
              <h3 className="text-xl text-[#1E3250] font-semibold text-right max-w-[60%]">Placement Test</h3>
            </div>
            <p className="text-sm text-[#7A869A] mb-6 relative z-10 line-clamp-5">
              With our in-depth entrance assessment, we'll help you accurately determine your current proficiency level, while analyzing your strengths and weaknesses, to build the most optimal learning roadmap tailored just for you.
            </p>
            {/* Graphic Area */}
            <div className="flex-grow relative w-full mt-auto min-h-[120px] bg-[radial-gradient(circle,rgba(74,182,195,0.1)_0%,rgba(255,255,255,0)_70%)] flex items-end justify-start pb-4">
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <PieChart className="w-16 h-16 text-[#4AB6C3]" />
              </div>
              <div className="flex flex-col gap-2 z-10">
                <span className="bg-white border border-gray-100 shadow-sm text-xs px-3 py-1.5 rounded-md text-gray-600 w-fit">Assess proficiency</span>
                <span className="bg-white border border-gray-100 shadow-sm text-xs px-3 py-1.5 rounded-md text-gray-600 w-fit">Strengths & Improvement areas</span>
                <span className="bg-white border border-gray-100 shadow-sm text-xs px-3 py-1.5 rounded-md text-gray-600 w-fit">IELTS study plan</span>
              </div>
            </div>
            <Link to="/mock-tests" className="absolute bottom-6 right-6 flex items-center bg-[#1E3250] hover:bg-opacity-90 text-white rounded-full pl-6 pr-2 py-2 text-sm font-bold tracking-wide transition-colors z-20 shadow-md group">
              <span>VIEW ALL</span> 
              <span className="bg-[#4A81B8] rounded-full w-8 h-8 flex items-center justify-center ml-3 group-hover:bg-blue-500 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>
          </article>

          {/* CARD 02: Live Lesson */}
          <article className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-200 relative overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-full border-2 border-[#4AB6C3] text-[#4AB6C3] flex items-center justify-center text-xl font-bold">
                02
              </div>
              <h3 className="text-xl text-[#1E3250] font-semibold text-right">Live Lesson</h3>
            </div>
            <p className="text-sm text-[#7A869A] mb-6 relative z-10 line-clamp-5">
              We will help you improve your skills for the IELTS exam and provide guidance on studying abroad through free online lectures from IELTS experts and representatives from universities around the world.
            </p>
            {/* Graphic Area */}
            <div className="flex-grow relative w-full mt-auto min-h-[120px] flex items-center justify-center">
              <div className="absolute bg-white rounded-xl shadow-lg border border-gray-100 p-4 transform rotate-[-5deg] z-10 w-[80%]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#4AB6C3] bg-opacity-20 rounded-lg flex items-center justify-center text-[#4AB6C3]">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">Live Lessons</div>
                    <div className="text-xs text-gray-500">Talk to an expert</div>
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 bg-yellow-400 text-white text-[10px] font-bold px-2 py-1 rounded-full transform rotate-12 shadow-sm">FREE</div>
              </div>
              <div className="absolute top-1/2 left-4 bg-[#4AB6C3] text-white text-[10px] font-bold px-2 py-1 rounded-full z-20">NEW</div>
            </div>
            <Link to="/courses" className="absolute bottom-6 right-6 flex items-center bg-[#1E3250] hover:bg-opacity-90 text-white rounded-full pl-6 pr-2 py-2 text-sm font-bold tracking-wide transition-colors z-20 shadow-md group">
              <span>VIEW ALL</span> 
              <span className="bg-[#4A81B8] rounded-full w-8 h-8 flex items-center justify-center ml-3 group-hover:bg-blue-500 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>
          </article>

          {/* CARD 03: Intensive Course */}
          <article className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-200 relative overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-full border-2 border-[#4AB6C3] text-[#4AB6C3] flex items-center justify-center text-xl font-bold">
                03
              </div>
              <h3 className="text-xl text-[#1E3250] font-semibold text-right">Intensive Course</h3>
            </div>
            <p className="text-sm text-[#7A869A] mb-6 relative z-10 line-clamp-4">
              Prepare with confidence through structured IELTS courses taught by instructors with 8.0+ IELTS scores and proven exam-focused strategies.
            </p>
            {/* Graphic Area */}
            <div className="flex-grow relative w-full mt-auto min-h-[150px]">
              <div className="flex flex-wrap gap-2 mb-4 z-10 relative">
                <span className="bg-[#4AB6C3] bg-opacity-10 text-[#4AB6C3] text-xs px-3 py-1 rounded-full">Masterclass</span>
                <span className="bg-[#4AB6C3] bg-opacity-10 text-[#4AB6C3] text-xs px-3 py-1 rounded-full">IELTS 1v1</span>
                <span className="bg-[#4AB6C3] bg-opacity-10 text-[#4AB6C3] text-xs px-3 py-1 rounded-full">Video courses</span>
              </div>
              <div className="absolute bottom-4 left-0 z-10 flex flex-col gap-2 pl-2 w-full pr-24">
                <div className="bg-white border border-gray-100 shadow-sm rounded-lg px-3 py-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-700 font-medium">IELTS 8.0+ Instructors</span>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-lg px-3 py-2 flex items-center gap-2 ml-4">
                  <Award className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-700 font-medium">Guaranteed outcomes</span>
                </div>
              </div>
              <div className="absolute bottom-0 right-10 text-yellow-300 opacity-80 text-6xl">
                <Lightbulb className="w-16 h-16 fill-yellow-300" />
              </div>
            </div>
            <Link to="/courses" className="absolute bottom-6 right-6 flex items-center bg-[#1E3250] hover:bg-opacity-90 text-white rounded-full pl-6 pr-2 py-2 text-sm font-bold tracking-wide transition-colors z-20 shadow-md group">
              <span>VIEW ALL</span> 
              <span className="bg-[#4A81B8] rounded-full w-8 h-8 flex items-center justify-center ml-3 group-hover:bg-blue-500 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>
          </article>

          {/* CARD 04: Free IELTS Mock Test */}
          <article className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-200 relative overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-full border-2 border-[#4AB6C3] text-[#4AB6C3] flex items-center justify-center text-xl font-bold">
                04
              </div>
              <h3 className="text-xl text-[#1E3250] font-semibold text-right max-w-[60%]">Free IELTS Mock Test</h3>
            </div>
            <div className="text-sm text-[#7A869A] mb-6 relative z-10 line-clamp-5 space-y-2">
              <p>We are proud to offer you a free collection of IELTS practice tests, continuously updated to ensure they meet the latest standards set by the British Council and IDP.</p>
              <p>You'll be able to assess your own abilities and gain maximum exposure to real exam pressure.</p>
            </div>
            {/* Graphic Area */}
            <div className="flex-grow relative w-full mt-auto min-h-[120px] flex items-end">
              <div className="flex space-x-[-15px] z-10 relative left-4 bottom-2">
                <div className="bg-white border border-[#4AB6C3] border-opacity-30 rounded-md w-16 h-20 shadow-sm flex flex-col items-center justify-center transform -rotate-6">
                  <span className="text-[8px] font-bold text-[#4AB6C3]">IELTS</span>
                  <span className="text-[6px] text-gray-500">Mock</span>
                </div>
                <div className="bg-white border border-[#4AB6C3] border-opacity-30 rounded-md w-16 h-22 shadow-sm flex flex-col items-center justify-center transform -rotate-3 z-10">
                  <span className="text-[8px] font-bold text-[#4AB6C3]">IELTS</span>
                  <span className="text-[6px] text-gray-500">Mock</span>
                </div>
                <div className="bg-white border border-[#4AB6C3] border-opacity-30 rounded-md w-16 h-24 shadow-md flex flex-col items-center justify-center z-20">
                  <span className="text-[8px] font-bold text-[#4AB6C3]">IELTS</span>
                  <span className="text-[6px] text-gray-500">Mock Test</span>
                </div>
              </div>
              <div className="absolute right-10 bottom-10 z-30">
                <div className="bg-yellow-400 text-white text-xs font-bold px-3 py-2 rounded-lg transform rotate-12 shadow-sm">FREE</div>
              </div>
            </div>
            <Link to="/mock-tests" className="absolute bottom-6 right-6 flex items-center bg-[#1E3250] hover:bg-opacity-90 text-white rounded-full pl-6 pr-2 py-2 text-sm font-bold tracking-wide transition-colors z-30 shadow-md group">
              <span>VIEW ALL</span> 
              <span className="bg-[#4A81B8] rounded-full w-8 h-8 flex items-center justify-center ml-3 group-hover:bg-blue-500 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>
          </article>

          {/* CARD 05: Mock Test with AI */}
          <article className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-200 relative overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-full border-2 border-[#4AB6C3] text-[#4AB6C3] flex items-center justify-center text-xl font-bold">
                05
              </div>
              <h3 className="text-xl text-[#1E3250] font-semibold text-right max-w-[60%]">Mock Test with AI</h3>
            </div>
            <div className="text-sm text-[#7A869A] mb-6 relative z-10 line-clamp-5 space-y-2">
              <p>We offer in-depth online courses taught by instructors with 8.0+ IELTS scores and guaranteed outcomes. These paid courses will guide you step by step to conquer IELTS.</p>
              <p>This AI system provides detailed evaluations on grammar, vocabulary, coherence, pronunciation, and many other criteria.</p>
            </div>
            {/* Graphic Area */}
            <div className="flex-grow relative w-full mt-auto min-h-[120px] bg-[radial-gradient(circle,rgba(74,182,195,0.1)_0%,rgba(255,255,255,0)_70%)] flex items-end">
              <div className="absolute left-6 bottom-4 bg-white border border-[#4AB6C3] border-opacity-30 rounded-xl w-16 h-16 flex items-center justify-center shadow-md z-10 text-2xl font-bold text-[#4AB6C3]">
                 AI
              </div>
              <div className="absolute left-28 bottom-12 bg-white border border-gray-100 rounded-lg px-3 py-1.5 shadow-sm flex items-center gap-2 z-10">
                <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] text-gray-600 font-medium">AI Examiner</span>
              </div>
              {/* Network lines decoration */}
              <div className="absolute left-10 bottom-10 w-32 h-16 border-t border-r border-[#4AB6C3] border-opacity-20 rounded-tr-xl z-0"></div>
            </div>
            <Link to="/mock-tests" className="absolute bottom-6 right-6 flex items-center bg-[#1E3250] hover:bg-opacity-90 text-white rounded-full pl-6 pr-2 py-2 text-sm font-bold tracking-wide transition-colors z-20 shadow-md group">
              <span>VIEW ALL</span> 
              <span className="bg-[#4A81B8] rounded-full w-8 h-8 flex items-center justify-center ml-3 group-hover:bg-blue-500 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>
          </article>

          {/* CARD 06: Unlock Full Services */}
          <article className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-200 relative overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-full border-2 border-[#4AB6C3] text-[#4AB6C3] flex items-center justify-center text-xl font-bold">
                06
              </div>
              <h3 className="text-xl text-[#1E3250] font-semibold text-right max-w-[60%]">Unlock Full Services</h3>
            </div>
            <div className="text-sm text-[#7A869A] mb-6 relative z-10 line-clamp-5 space-y-2">
              <p>Enhanced, comprehensive support: We offer a rich catalog of products to serve all your IELTS study and exam preparation needs.</p>
              <p>Explore them now in our IELTS Prep Service!</p>
            </div>
            {/* Graphic Area */}
            <div className="flex-grow relative w-full mt-auto min-h-[120px] flex items-end justify-start pb-4 pl-4 overflow-hidden">
              <div className="absolute inset-0 opacity-5 z-0" style={{ backgroundImage: "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
              <div className="flex gap-4 z-10 relative items-end">
                <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100 transform rotate-[-5deg]">
                  <FileText className="w-6 h-6 text-[#4AB6C3]" />
                </div>
                <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100 transform rotate-[5deg] mb-2">
                  <Headphones className="w-6 h-6 text-[#4AB6C3]" />
                </div>
                <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100 transform rotate-[-3deg] mb-4">
                  <Layers className="w-6 h-6 text-[#4AB6C3]" />
                </div>
              </div>
            </div>
            <Link to="/pricing" className="absolute bottom-6 right-6 flex items-center bg-[#1E3250] hover:bg-opacity-90 text-white rounded-full pl-6 pr-2 py-2 text-sm font-bold tracking-wide transition-colors z-20 shadow-md group">
              <span>VIEW ALL</span> 
              <span className="bg-[#4A81B8] rounded-full w-8 h-8 flex items-center justify-center ml-3 group-hover:bg-blue-500 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
