import React, { useState } from "react";
import { Plus, Minus, ArrowUpRight, HelpCircle, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FaqItem[] = [
  {
    id: "writing-process",
    question: "What is the process of taking IELTS Writing test?",
    answer: "The IELTS Writing test consists of two tasks: Task 1 (describing a graph, chart, diagram, or map) and Task 2 (writing an essay in response to a point of view, argument, or problem). In our computer-delivered simulator, you type your answers directly into the box with built-in live word counters."
  },
  {
    id: "analyze-performance",
    question: "How to analyze one's performance and identify shortcomings after the mock exam?",
    answer: "After completing a test, click on 'View Explanations & Analytics'. You will see a detailed question-by-question breakdown, keyword locations in passages, listening audio transcript timestamps, and AI-powered feedback highlighting grammar and vocabulary gaps."
  },
  {
    id: "speaking-mock-scores",
    question: "Can the IELTS Speaking mock test scores represent the actual IELTS test scores?",
    answer: "Yes, our AI Speaking Examiner and human tutor grading systems adhere closely to the official British Council / IDP band descriptors across Fluency, Lexical Resource, Grammatical Range, and Pronunciation."
  },
  {
    id: "are-tests-free",
    question: "Are all the tests free?",
    answer: "Yes! All full-length IELTS Academic and General Training mock tests in our core library are 100% free to attempt with instant band scores and basic answer keys."
  },
  {
    id: "listening-test-how",
    question: "How to take the IELTS Listening test?",
    answer: "You will listen to four audio recordings of native English speakers and answer 40 questions. In our online simulator, audio streams directly in your browser with volume control, scratchpad notes, and auto-submit timing."
  },
  {
    id: "mock-results-affect",
    question: "Will the results of the mock exam affect the exam results?",
    answer: "No, our mock exams are independent practice tools designed to build exam stamina and reveal areas for improvement. They have no impact on your official test score recorded by test centers."
  },
  {
    id: "reading-skills",
    question: "What skills can help me better complete the IELTS Reading test?",
    answer: "Mastering Skimming (reading quickly for main ideas), Scanning (locating specific keywords/dates/names), understanding Paraphrasing and Synonyms, and managing your time strictly (20 minutes per passage) are key to achieving Band 8.0+."
  }
];

export default function FaqSection() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative w-full bg-[#e8f6f8] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-cyan-100 overflow-hidden">
      
      {/* Repeating Diagonal Watermark Pattern */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-[0.06] flex flex-col justify-between py-6 rotate-[-12deg] scale-125">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="text-4xl sm:text-6xl md:text-7xl font-black text-[#00a8cc] whitespace-nowrap tracking-wider">
            IELTS FAQ Free IELTS FAQ Free IELTS FAQ Free
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Graphic 3D FAQ Illustration + View All Button (5 Cols) */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 sticky top-24">
          
          {/* FAQ Visual Graphic Container */}
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square flex items-center justify-center">
            
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none" />

            {/* Speech Bubble 1: Teal Question Mark Circle */}
            <div className="absolute top-2 left-2 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#4dd0e1] via-[#00a8cc] to-[#00838f] text-white flex items-center justify-center shadow-xl border-4 border-white transform rotate-[-8deg] hover:scale-105 transition-transform duration-300">
              <span className="text-5xl sm:text-6xl font-black drop-shadow-md">?</span>
            </div>

            {/* Speech Bubble 2: Ellipsis Circle overlapping on right */}
            <div className="absolute top-10 right-2 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#26c6da] to-[#80deea] text-white flex items-center justify-center shadow-lg border-4 border-white transform rotate-[12deg] hover:scale-105 transition-transform duration-300">
              <span className="text-3xl sm:text-4xl font-black tracking-widest pb-2">...</span>
            </div>

            {/* 3D Big "FAQ" Text overlay at bottom */}
            <div className="absolute -bottom-2 inset-x-0 text-center">
              <h2 className="text-7xl sm:text-8xl md:text-[100px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#334e68] via-[#1e293b] to-[#0f172a] drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] leading-none">
                FAQ
              </h2>
            </div>

          </div>

          {/* VIEW ALL Button */}
          <div className="pt-2">
            <Link
              to="/contact"
              className="bg-[#202e43] hover:bg-[#152030] text-white font-black text-xs tracking-wider uppercase pl-6 pr-2 py-3 min-h-[48px] rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-3 cursor-pointer group"
            >
              <span className="underline underline-offset-4 decoration-cyan-400">VIEW ALL</span>
              <div className="w-8 h-8 rounded-full bg-[#497cb5] group-hover:bg-[#3b6aa3] flex items-center justify-center text-white transition-colors shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>
          </div>

        </div>

        {/* Right Column: Accordion Questions List (7 Cols) */}
        <div className="lg:col-span-8 space-y-4 w-full">
          {faqData.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:border-cyan-200 transition-all duration-200 overflow-hidden"
              >
                {/* Question Header Button */}
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 sm:px-6 py-5 min-h-[64px] flex items-center justify-between gap-4 font-semibold text-slate-700 hover:text-[#00a8cc] transition-colors cursor-pointer text-sm sm:text-base leading-snug touch-manipulation"
                >
                  <span className="font-semibold text-slate-700 text-sm sm:text-base">
                    {faq.question}
                  </span>
                  <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 pointer-events-none">
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-[#00a8cc]" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Answer Content */}
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
