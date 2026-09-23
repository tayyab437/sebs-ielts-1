import { GraduationCap, ExternalLink, Award, CheckCircle, BookOpen, Globe2, Sparkles } from "lucide-react";
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

        {/* Informative Body Content Grid (>350 Words with Structured Paragraphs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">
          
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

        {/* Official External Resources & Accreditation Banner */}
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-[#00a8cc]" />
                Official Global Examination Authorities &amp; Resources
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Verify testing guidelines, exam formats, and test center availability through official international accreditation bodies.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-sky-100 dark:bg-sky-950 text-[#00a8cc] border border-sky-200 dark:border-sky-800">
              Verified Partners
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <a
              href="https://takeielts.britishcouncil.org"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-[#00a8cc] transition-all shadow-2xs"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#00a8cc] transition-colors">
                  British Council IELTS
                </div>
                <div className="text-[11px] text-slate-500">Official Exam Portal</div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#00a8cc] transition-colors" />
            </a>

            <a
              href="https://www.ieltsidp.com"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-[#00a8cc] transition-all shadow-2xs"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#00a8cc] transition-colors">
                  IDP Education IELTS
                </div>
                <div className="text-[11px] text-slate-500">Global Test Booking</div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#00a8cc] transition-colors" />
            </a>

            <a
              href="https://www.cambridgeenglish.org"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-[#00a8cc] transition-all shadow-2xs"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#00a8cc] transition-colors">
                  Cambridge Assessment
                </div>
                <div className="text-[11px] text-slate-500">English Language Standards</div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#00a8cc] transition-colors" />
            </a>

            <a
              href="https://www.ielts.org"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-[#00a8cc] transition-all shadow-2xs"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#00a8cc] transition-colors">
                  IELTS.org Official
                </div>
                <div className="text-[11px] text-slate-500">Format &amp; Band Descriptors</div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#00a8cc] transition-colors" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
