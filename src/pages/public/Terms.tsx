import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Calendar, BookOpen, AlertCircle, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Terms of Service
          </h1>
          <div className="flex flex-wrap gap-4 items-center text-xs text-slate-400 font-semibold border-b border-slate-200/50 dark:border-white/5 pb-6">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Last Updated: June 12, 2026</span>
            <span className="hidden sm:inline">•</span>
            <span>Applicable to Online Learning System</span>
          </div>
        </div>

        {/* Core Content */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-xl p-8 sm:p-12 space-y-8 text-left leading-relaxed text-xs sm:text-sm">
          
          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              1. Learning Environment Agreement
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">
              By accessing the SEB's Institute platform (the "LMS", "Service") or attending any classes offered by Syed Ejaz Bukhari, you agree to comply with our academic standards and active learning policies. We emphasize English language communication and discourage passive translation practices (locally referred to as "Pinglish").
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-500" />
              2. Student Account Security
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">
              When creating an account, you are responsible for maintaining the confidentiality of your credentials. Logging in certifies your candidate identity. Sharing credentials or using third-party logins without authorization is strictly prohibited and may result in the immediate termination of student access without refund.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              3. Refund & Cancellation Terms
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">
              All subscription plans (Free Trial, Pro Premium, and Mastery Ultimate) are subject to standard verification. Fees submitted for specific IELTS batches or academic training packages are non-refundable once the course materials are distributed or custom progress trackers are enabled.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              4. Code of Conduct & Intellectual Property
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">
              All training resources, worksheets, mock tests, vocabulary blueprints, and custom-engineered templates are the intellectual property of SEB's Institute & Syed Ejaz Bukhari. Unauthorized distribution, commercial sharing, or hosting of this database information elsewhere will face severe civil litigation penalties.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 font-medium">
            <p className="text-xs uppercase font-black text-slate-800 dark:text-white mb-2 tracking-wider flex items-center gap-1.5">
              💡 Need further clarification?
            </p>
            For official complaints or inquiries about batch schedules, fee verification, or policy interpretations, please contact our helpline desk via WhatsApp at <strong className="text-slate-800 dark:text-slate-200">0330-4541573</strong> or mail us at <strong className="text-slate-800 dark:text-slate-200">sebs.info@gmail.com</strong>.
          </div>
        </div>

        {/* Footer info inside Terms page */}
        <p className="text-center text-[10px] text-slate-400 font-mono tracking-widest uppercase">
          SEB's INSTITUTE • ESTABLISHED IN 1992
        </p>

      </div>
    </div>
  );
}
