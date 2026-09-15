import React, { useState } from "react";
import { ArrowUpRight, CheckCircle2, Zap, FileText, Bot, Monitor } from "lucide-react";
import { Link } from "react-router-dom";

interface FeatureTab {
  id: string;
  title: string;
  icon: React.ReactNode;
  heading: string;
  description: string;
}

const featureTabs: FeatureTab[] = [
  {
    id: "interface",
    title: "Authentic exam interface",
    icon: <Monitor className="w-6 h-6 text-[#00a8cc]" />,
    heading: "Authentic exam interface",
    description:
      "Experience IELTS preparation on IOT with our 'IELTS Side by Side' feature, offering an identical computer interface to the actual test. From navigation and question display to support tools, everything is designed to maximize your familiarity with the real exam."
  },
  {
    id: "results",
    title: "Get Instant Results",
    icon: <Zap className="w-6 h-6 text-amber-500" />,
    heading: "Get Instant Results",
    description:
      "Receive immediate band score calculations and comprehensive skill breakdowns right after submitting your test. Track your performance across Listening, Reading, Writing, and Speaking with real-time analytics."
  },
  {
    id: "explanations",
    title: "Detailed explanations",
    icon: <FileText className="w-6 h-6 text-emerald-500" />,
    heading: "Detailed explanations",
    description:
      "Access comprehensive step-by-step explanations for every question. Easily understand why an answer is correct or incorrect with highlighted keyword location references from the reading passage or listening transcript."
  },
  {
    id: "ai",
    title: "AI Examiner for Writing & Speaking",
    icon: <Bot className="w-6 h-6 text-[#00a8cc]" />,
    heading: "AI Examiner for Writing & Speaking",
    description:
      "Get instant, human-grade evaluation for your Writing essays and Speaking recordings. Receive band score estimates along with actionable feedback on Task Achievement, Coherence, Vocabulary, and Grammar."
  }
];

export default function TakeFreeTestSection() {
  const [activeTab] = useState(0);

  const currentFeature = featureTabs[activeTab];

  return (
    <section className="relative w-full bg-[#e8f6f8] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-cyan-100 overflow-hidden">
      
      {/* Repeating Diagonal Watermark Pattern */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-[0.06] flex flex-col justify-between py-6 rotate-[-12deg] scale-125">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="text-4xl sm:text-6xl md:text-7xl font-black text-[#00a8cc] whitespace-nowrap tracking-wider">
            IELTS Mocktest Free IELTS Mocktest Free IELTS Mocktest Free
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="space-y-3 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-[#1e293b] leading-tight">
            Take an <span className="text-[#00a8cc]">IELTS Free Online Test</span>,<br />
            Ensure you <span className="text-[#00a8cc]">Score your Best!</span>
          </h2>

          {/* Subtitle with Teal Accent Flanks */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="hidden sm:block h-[2px] w-12 bg-gradient-to-r from-transparent to-[#00a8cc]" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl">
              Special features on our IELTS Mock Tests promise to deliver convenient and beneficial experiences
            </p>
            <div className="hidden sm:block h-[2px] w-12 bg-gradient-to-l from-transparent to-[#00a8cc]" />
          </div>
        </div>

        {/* Feature Display Stage (Laptop/Screen on Left, Feature Info on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
          
          {/* Left: Interactive Interface Preview Frame (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border-4 border-slate-800 shadow-2xl overflow-hidden p-2 bg-slate-900 text-slate-800">
              
              {/* Computer Exam Top Bar */}
              <div className="bg-slate-800 text-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] font-bold rounded-t-lg border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="bg-[#00a8cc] text-white text-[9px] font-black px-2 py-0.5 rounded-sm">
                    PART 3
                  </span>
                  <span className="font-extrabold tracking-tight">READING PASSAGE 3</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-amber-400 font-mono">⏱️ 60 minutes remaining</span>
                  <div className="flex gap-1.5 text-slate-400">
                    <span className="hover:text-white cursor-pointer">Review</span>
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[9px]">Submit</span>
                  </div>
                </div>
              </div>

              {/* Exam Side-by-Side Screen Layout depending on Active Tab */}
              <div className="bg-white p-3 sm:p-4 text-left min-h-[300px] sm:min-h-[340px] flex flex-col justify-between">
                
                {activeTab === 0 && (
                  /* Authentic exam interface */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full text-[10px] sm:text-xs">
                    {/* Left Column: Reading Passage */}
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2 overflow-y-auto max-h-[260px]">
                      <div className="relative h-20 rounded-md overflow-hidden mb-2">
                        <img
                          src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format,compress&fm=webp&w=500&q=80"
                          alt="Low Cost Lamps Light Rural India"
                          loading="lazy"
                          decoding="async"
                          width={500}
                          height={80}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 p-2 flex items-end">
                          <span className="text-white font-extrabold text-[10px] leading-tight">
                            Low-Cost Lamps Light Rural India
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-sans">
                        Until a few months ago, life in this remote Uttar Pradesh village was governed by sunset. Inside his mud and thatch home, a blacksmith's children used to study in the dim, smoky glow of a kerosene lamp...
                      </p>
                      <p className="text-slate-600 leading-relaxed font-sans">
                        As many as 400 million people in India alone - right now - live without access to the primary lighting grid. The fuel is dangerous, dirty, and - despite being subsidized - consumes nearly five percent of typical poor household budgets...
                      </p>
                    </div>

                    {/* Right Column: Questions Panel */}
                    <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3 overflow-y-auto max-h-[260px]">
                      <div className="font-extrabold text-slate-800 border-b pb-1">
                        Questions 27-30
                      </div>
                      <p className="text-[10px] text-slate-500 italic">
                        For each question, choose ONLY ONE of the choices in answer sheet.
                      </p>

                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-slate-800">27. The SSBP lamps:</div>
                        <div className="space-y-2 text-slate-700">
                          <label htmlFor="q27-opt1" className="min-h-[44px] py-2 px-3 rounded-lg border border-slate-200 hover:border-[#00a8cc] hover:bg-sky-50/40 transition-all flex items-center gap-2.5 cursor-pointer w-full">
                            <input id="q27-opt1" type="radio" name="q27" className="w-5 h-5 text-[#00a8cc] accent-[#00a8cc] shrink-0 cursor-pointer" />
                            <span className="leading-snug select-none text-[11px] sm:text-xs">provide light for 100,000 Indian villages</span>
                          </label>
                          <label htmlFor="q27-opt2" className="min-h-[44px] py-2 px-3 rounded-lg border border-[#00a8cc]/50 bg-sky-50/50 hover:border-[#00a8cc] hover:bg-sky-50 transition-all flex items-center gap-2.5 cursor-pointer w-full">
                            <input id="q27-opt2" type="radio" name="q27" className="w-5 h-5 text-[#00a8cc] accent-[#00a8cc] shrink-0 cursor-pointer" defaultChecked />
                            <span className="leading-snug select-none text-[11px] sm:text-xs font-semibold text-[#00a8cc]">are very inexpensive to install</span>
                          </label>
                          <label htmlFor="q27-opt3" className="min-h-[44px] py-2 px-3 rounded-lg border border-slate-200 hover:border-[#00a8cc] hover:bg-sky-50/40 transition-all flex items-center gap-2.5 cursor-pointer w-full">
                            <input id="q27-opt3" type="radio" name="q27" className="w-5 h-5 text-[#00a8cc] accent-[#00a8cc] shrink-0 cursor-pointer" />
                            <span className="leading-snug select-none text-[11px] sm:text-xs">are powered by the sun</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-slate-800">28. More than half of India's population uses:</div>
                        <div className="space-y-2 text-slate-700">
                          <label htmlFor="q28-opt1" className="min-h-[44px] py-2 px-3 rounded-lg border border-slate-200 hover:border-[#00a8cc] hover:bg-sky-50/40 transition-all flex items-center gap-2.5 cursor-pointer w-full">
                            <input id="q28-opt1" type="radio" name="q28" className="w-5 h-5 text-[#00a8cc] accent-[#00a8cc] shrink-0 cursor-pointer" />
                            <span className="leading-snug select-none text-[11px] sm:text-xs">kerosene as a cooking fuel</span>
                          </label>
                          <label htmlFor="q28-opt2" className="min-h-[44px] py-2 px-3 rounded-lg border border-slate-200 hover:border-[#00a8cc] hover:bg-sky-50/40 transition-all flex items-center gap-2.5 cursor-pointer w-full">
                            <input id="q28-opt2" type="radio" name="q28" className="w-5 h-5 text-[#00a8cc] accent-[#00a8cc] shrink-0 cursor-pointer" />
                            <span className="leading-snug select-none text-[11px] sm:text-xs">biomass as a cooking fuel</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 1 && (
                  /* Get Instant Results */
                  <div className="space-y-4 p-2 text-center">
                    <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase">
                      Test Result Summary
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black text-[#00a8cc]">8.0</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase">Overall Band</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-slate-700">8.5</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase">Listening</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-slate-700">8.0</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase">Reading</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-slate-700">7.5</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase">Writing</div>
                      </div>
                    </div>
                    <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-left text-xs space-y-1">
                      <div className="font-extrabold text-[#00a8cc]">Instant Performance Analytics:</div>
                      <p className="text-slate-600 text-[11px]">34/40 questions correct in Reading Passage 3. Estimated CEF Level: C1 Advanced.</p>
                    </div>
                  </div>
                )}

                {activeTab === 2 && (
                  /* Detailed explanations */
                  <div className="space-y-3 p-2 text-left text-xs">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-amber-900">
                        <span>Question 27 Explanation</span>
                        <span className="text-emerald-600 font-extrabold">Correct Answer: B</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Keyword location in Passage: <mark className="bg-amber-200 px-1 rounded">"are very inexpensive to install"</mark> matches paragraph 2 where the text states "...low-cost solar lighting systems requiring minimal upfront capital".
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                      <div className="font-bold text-slate-800">Vocabulary Note</div>
                      <p className="text-slate-600 text-[11px]">Biomass (noun): organic matter used as a fuel, especially in power stations for generation of electricity.</p>
                    </div>
                  </div>
                )}

                {activeTab === 3 && (
                  /* AI Examiner */
                  <div className="space-y-3 p-2 text-left text-xs">
                    <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[#00a8cc] uppercase">AI Writing Examiner Report</span>
                        <span className="bg-[#00a8cc] text-white text-xs font-black px-2 py-0.5 rounded">Band 7.5</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-700 pt-1">
                        <div className="bg-white p-2 rounded border">Task Response: <strong className="text-emerald-600">8.0</strong></div>
                        <div className="bg-white p-2 rounded border">Coherence & Cohesion: <strong className="text-emerald-600">7.5</strong></div>
                        <div className="bg-white p-2 rounded border">Lexical Resource: <strong className="text-emerald-600">7.5</strong></div>
                        <div className="bg-white p-2 rounded border">Grammatical Range: <strong className="text-emerald-600">7.0</strong></div>
                      </div>
                      <p className="text-[11px] text-slate-600 italic">"Strong thesis statement with well-structured paragraphing. Enhance complex clause usage for Band 8.0."</p>
                    </div>
                  </div>
                )}

                {/* Exam Bottom Pagination Footer */}
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                  <span>Part 3: 13 of 13 questions</span>
                  <div className="flex items-center gap-1.5">
                    <button type="button" aria-label="Go to Part 1" className="bg-slate-100 hover:bg-slate-200 min-h-[36px] min-w-[44px] px-3 py-1.5 rounded-md cursor-pointer transition-colors text-slate-700">Part 1</button>
                    <button type="button" aria-label="Go to Part 2" className="bg-slate-100 hover:bg-slate-200 min-h-[36px] min-w-[44px] px-3 py-1.5 rounded-md cursor-pointer transition-colors text-slate-700">Part 2</button>
                    <button type="button" aria-label="Current: Part 3" className="bg-[#00a8cc] text-white min-h-[36px] min-w-[44px] px-3 py-1.5 rounded-md cursor-pointer shadow-sm">Part 3</button>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Right: Feature Text & Description (5 cols) */}
          <div className="lg:col-span-5 text-left space-y-4">
            <h3 className="text-2xl sm:text-3xl font-black text-[#1e293b] tracking-tight leading-snug">
              {currentFeature.heading}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {currentFeature.description}
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#00a8cc]">
              <CheckCircle2 className="w-4 h-4 text-[#00a8cc]" />
              <span>Free for all registered students</span>
            </div>
          </div>

        </div>

        {/* Bottom CTA Button */}
        <div className="flex justify-center pt-4">
          <Link
            to="/mock-tests"
            className="bg-[#202e43] hover:bg-[#152030] text-white font-black text-xs sm:text-sm tracking-wider uppercase pl-7 pr-2 py-2 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 cursor-pointer group"
          >
            <span>GET FREE IELTS MOCK TEST</span>
            <div className="w-8 h-8 rounded-full bg-[#497cb5] group-hover:bg-[#3b6aa3] flex items-center justify-center text-white transition-colors">
              <ArrowUpRight className="w-4.5 h-4.5" />
            </div>
          </Link>
        </div>

      </div>
    </section>
  );
}
