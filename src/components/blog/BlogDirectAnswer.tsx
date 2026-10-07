import React from 'react';
import { HelpCircle, CheckCircle2 } from 'lucide-react';

interface BlogDirectAnswerProps {
  question: string;
  answer: string;
}

export const BlogDirectAnswer: React.FC<BlogDirectAnswerProps> = ({ question, answer }) => {
  if (!question || !answer) return null;

  return (
    <aside className="my-8 p-6 sm:p-7 bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-500/30 dark:border-emerald-500/40 rounded-3xl shadow-sm text-left relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-xs uppercase tracking-wider mb-2">
        <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Direct Answer</span>
      </div>

      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug mb-3">
        {question}
      </h3>

      <div className="flex items-start gap-3 bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-inner">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
          {answer}
        </p>
      </div>
    </aside>
  );
};
