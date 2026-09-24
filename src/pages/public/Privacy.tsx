import React from "react";
import { Link } from "react-router-dom";
import { FileText, Calendar, Lock, Eye, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-700 dark:text-slate-300">
      {/* Decorative top accent */}
      <div className="h-2 bg-gradient-to-r from-indigo-600 to-indigo-700" />
      
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-10">
        
        {/* Navigation Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Homepage
        </Link>

        {/* Header Hero Area */}
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Security & GDPR</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap gap-4 items-center text-xs text-slate-400 font-semibold border-b border-slate-200/50 dark:border-white/5 pb-6">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Last Updated: June 12, 2026</span>
            <span className="hidden sm:inline">•</span>
            <span>Committed to Safe Academic Database Operations</span>
          </div>
        </div>

        {/* Core Content */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-xl p-8 sm:p-12 space-y-8 text-left leading-relaxed text-xs sm:text-sm">
          
          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" />
              1. Information We Collect
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">
              We collect primary identification details when you create a student profile (such as name, email address, targeted bands, learning streak, levels, and custom profile photo choices). When you submit practice responses in reading, writing and listening screens, we safely record assessment timelines and quiz metrics to compute grading criteria.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-500" />
              2. Safe Database & Supabase Protection
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">
              Your profile coordinates, including password hashes and session parameters, are secured behind industry-standard database structures and Supabase triggers. Under no circumstances do we distribute student contact details or emails to external advertising services or trackers. Your metrics are visible only to accredited evaluators for mock grading.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" />
              3. Cookies and Browser Cache Storage
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">
              We utilize browser local storage (`localStorage`) and essential cookies to persist active user login tokens, selected courses preferences, study screen indicators, and progress tracking markers. This allows smooth transitions across courses without requiring repetitive user authentication.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              4. Your Data Control & Right to Erasure
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">
              Students maintain absolute control over their profiles. You can update your user indicators at any time via the Student Dashboard settings panel. Should you wish to undergo complete student data erasure or cancel accounts permanently, please email our security officer directly.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 font-medium">
            <p className="text-xs uppercase font-black text-slate-800 dark:text-white mb-2 tracking-wider flex items-center gap-1.5">
              🛡️ Student Data Guarantee
            </p>
            SEB's Institute does not lease or monetize customer records. Your details are solely utilized to construct individual predictive band trajectories and manage candidate course rosters.
          </div>
        </div>

        {/* Footer info inside Privacy page */}
        <p className="text-center text-[10px] text-slate-400 font-mono tracking-widest uppercase">
          SEB's INSTITUTE • PRIVACY & CYBERSECURITY DEPARTMENT
        </p>

      </div>
    </div>
  );
}
