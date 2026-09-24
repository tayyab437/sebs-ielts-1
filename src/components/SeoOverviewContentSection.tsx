import { GraduationCap, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function SeoOverviewContentSection() {
  return (
    <section 
      aria-labelledby="seo-overview-heading"
      className="w-full py-12 sm:py-16 bg-white dark:bg-slate-950 border-t border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-[#00a8cc] text-xs font-bold uppercase tracking-wider border border-sky-200 dark:border-sky-800">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic Excellence &amp; Linguistic Mastery</span>
          </div>
          <h2 
            id="seo-overview-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight"
          >
            Master IELTS Band 8.5 &amp; Spoken English at SEB's Institute
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Pioneering modern computer-delivered exam preparation and accent retraining under the mentorship of Syed Ejaz Bukhari.
          </p>
        </div>

        {/* Informative Body Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Column 1: Academic & General Training Overview */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#00a8cc]" />
              Authentic Computer-Delivered IELTS Mock Tests
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              At <strong>SEB's Institute</strong>, candidates prepare for both <Link to="/academic-tests" className="text-[#00a8cc] font-semibold hover:underline">IELTS Academic</Link> and <Link to="/general-training-tests" className="text-[#00a8cc] font-semibold hover:underline">General Training</Link> with an exact replica of the computer-delivered exam interface. Designed to reflect the live testing environments administered worldwide by the British Council and IDP, our platform features identical split-screen reading viewports, synchronized listening audios with individual time markers, and real-time word counters for Writing Tasks 1 and 2.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Explore our <Link to="/mock-tests" className="text-[#00a8cc] font-semibold hover:underline">100+ IELTS practice tests</Link> providing instant diagnostic metrics and granular sub-score calculations. With our proprietary Locate &amp; Explain tool, students immediately identify the exact text lines and audio timestamps that validate each answer, demystifying True/False/Not Given logic and eliminating common distractor traps.
            </p>
          </div>

          {/* Column 2: Spoken English & AI Feedback */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Elite Spoken English Coaching &amp; AI Band Rubrics
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Founded by renowned linguistics coach <span className="text-[#00a8cc] font-semibold">Syed Ejaz Bukhari</span>, SEB's Institute is celebrated for its vocal conditioning methodology: <em>"We Teach English, Not Pinglish."</em> Our communicative syllabus in our <Link to="/courses" className="text-[#00a8cc] font-semibold hover:underline">English courses</Link> directly targets mother-tongue influence (MTI), auditory phonetic mapping, and speech prosody. Whether preparing for university admissions, healthcare licensing (GMC, NMC), or immigration visas, students acquire instinctive conversational confidence.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Our intelligent <Link to="/dashboard/writing" className="text-[#00a8cc] font-semibold hover:underline">AI IELTS Writing Evaluator</Link> analyzes submitted essays and vocal recordings across official band criteria: Task Achievement, Coherence &amp; Cohesion, Lexical Resource, and Grammatical Range &amp; Accuracy. Candidates receive instant Band 0–9.0 evaluations with line-by-line grammar corrections to secure a target score of Band 8.5+.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
